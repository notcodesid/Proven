import { Connection, Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import crypto from 'crypto';
import prisma from '../lib/prisma';

/**
 * Escrow Wallet Service
 * Manages escrow wallets for challenge stakes (Simplified Solana approach)
 */

const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Devnet USDC

// Encryption key for storing private keys (MUST be set in environment!)
// Generate with: openssl rand -base64 32
const ENCRYPTION_KEY_RAW = process.env.ESCROW_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_RAW) {
  throw new Error(
    'ESCROW_ENCRYPTION_KEY environment variable is required! ' +
    'Generate a secure key with: openssl rand -base64 32'
  );
}

// Type-safe after null check
const ENCRYPTION_KEY: string = ENCRYPTION_KEY_RAW;

class EscrowService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  /**
   * Generate a new escrow wallet for a challenge
   */
  async createEscrowWallet(challengeId: string): Promise<{
    publicKey: string;
    balance: number;
  }> {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const encryptedSecret = this.encryptSecretKey(keypair.secretKey);

    await prisma.$transaction(async (tx) => {
      await tx.escrowWallet.upsert({
        where: { challengeId },
        create: {
          challengeId,
          publicKey,
          secretKey: encryptedSecret,
        },
        update: {
          publicKey,
          secretKey: encryptedSecret,
        },
      });

      await tx.challenge.update({
        where: { id: challengeId },
        data: {
          escrowAddress: publicKey,
        },
      });
    });

    const balance = await this.connection.getBalance(keypair.publicKey);
    const balanceInSol = balance / LAMPORTS_PER_SOL;

    return {
      publicKey,
      balance: balanceInSol,
    };
  }

  /**
   * Store encrypted private key for escrow wallet
   */
  private encryptSecretKey(secretKey: Uint8Array): string {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(secretKey)),
      cipher.final(),
    ]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Load escrow wallet keypair for a challenge
   */
  private async loadKeypair(challengeId: string): Promise<Keypair> {
    const record = await prisma.escrowWallet.findUnique({
      where: { challengeId },
    });

    if (!record) {
      throw new Error(`Escrow key not found for challenge: ${challengeId}`);
    }

    const secretKeyBytes = this.decryptSecretKey(record.secretKey);
    return Keypair.fromSecretKey(secretKeyBytes);
  }

  private decryptSecretKey(payload: string): Uint8Array {
    const [ivHex, encryptedHex] = payload.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted key payload');
    }

    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);

    return new Uint8Array(decrypted);
  }

  /**
   * Verify a USDC transfer to escrow wallet
   */
  async verifyTransfer(
    transactionSignature: string,
    senderWallet: string,
    escrowAddress: string,
    expectedAmount: number
  ): Promise<boolean> {
    try {
      // Fetch transaction
      const tx = await this.connection.getTransaction(transactionSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        return false;
      }

      // Check if transaction succeeded
      if (tx.meta?.err) {
        return false;
      }

      // Verify sender signed the transaction
      const senderPubkey = new PublicKey(senderWallet);
      const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys;
      const senderSigned = accountKeys.some((key) => key.equals(senderPubkey));

      if (!senderSigned) {
        return false;
      }

      // Get escrow's USDC token account
      const escrowPubkey = new PublicKey(escrowAddress);
      const escrowTokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowPubkey);

      // Check if escrow token account received USDC
      const escrowAccountIndex = accountKeys.findIndex((key) => key.equals(escrowTokenAccount));

      if (escrowAccountIndex === -1) {
        return false;
      }

      // Verify balance change (USDC has 6 decimals)
      const preBalance = tx.meta?.preTokenBalances?.find(
        (bal) => bal.accountIndex === escrowAccountIndex
      )?.uiTokenAmount?.uiAmount || 0;

      const postBalance = tx.meta?.postTokenBalances?.find(
        (bal) => bal.accountIndex === escrowAccountIndex
      )?.uiTokenAmount?.uiAmount || 0;

      const transferred = postBalance - preBalance;

      // Allow small tolerance (0.01 USDC)
      const tolerance = 0.01;
      if (Math.abs(transferred - expectedAmount) > tolerance) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get escrow wallet USDC balance
   */
  async getEscrowBalance(escrowAddress: string): Promise<number> {
    try {
      const escrowPubkey = new PublicKey(escrowAddress);
      const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowPubkey);

      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.uiAmountString || '0');
    } catch (error) {
      return 0;
    }
  }

  /**
   * Send payout from escrow wallet
   */
  async sendPayout(
    challengeId: string,
    recipientWallet: string,
    amount: number
  ): Promise<string> {
    try {
      // Load escrow keypair
      const escrowKeypair = await this.loadKeypair(challengeId);

      // Get token accounts
      const escrowTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        escrowKeypair.publicKey
      );

      const recipientPubkey = new PublicKey(recipientWallet);
      const recipientTokenAccount = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

      // Convert amount to smallest unit (6 decimals for USDC)
      const amountInSmallestUnit = Math.floor(amount * 1_000_000);

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        escrowTokenAccount,
        recipientTokenAccount,
        escrowKeypair.publicKey,
        amountInSmallestUnit,
        [],
        TOKEN_PROGRAM_ID
      );

      // Create and send transaction
      const transaction = new Transaction().add(transferInstruction);
      transaction.feePayer = escrowKeypair.publicKey;

      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Sign and send
      transaction.sign(escrowKeypair);
      const signature = await this.connection.sendRawTransaction(transaction.serialize());

      // Confirm
      await this.connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (error) {
      throw new Error(`Failed to send payout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Export singleton instance
export const escrowService = new EscrowService();
export { EscrowService };
