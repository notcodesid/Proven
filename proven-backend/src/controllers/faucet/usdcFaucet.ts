import { Response } from 'express';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { getMint, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

// Devnet USDC mint (default). Can be overridden via env USDC_MINT
const DEFAULT_USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

function loadFaucetKeypair(): Keypair {
  // Disable faucet in production for security
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Faucet is disabled in production environment');
  }

  const secret = process.env.FAUCET_SECRET_KEY;
  if (!secret) {
    throw new Error(
      'FAUCET_SECRET_KEY environment variable is required! ' +
      'This should be a JSON array of the faucet wallet secret key bytes. ' +
      'Only use for devnet/testnet environments.'
    );
  }

  let secretKey: Uint8Array;
  try {
    const arr = JSON.parse(secret);
    if (!Array.isArray(arr)) {
      throw new Error('FAUCET_SECRET_KEY must be a JSON array');
    }
    secretKey = new Uint8Array(arr);
    if (secretKey.length !== 64) {
      throw new Error('FAUCET_SECRET_KEY must be 64 bytes (Solana secret key)');
    }
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error('FAUCET_SECRET_KEY must be a valid JSON array of 64 bytes');
  }

  return Keypair.fromSecretKey(secretKey);
}

/**
 * Request devnet USDC from faucet
 * @route POST /api/faucet/usdc
 * @access Public (Disabled in production)
 */
export const requestUSDC = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Fail fast if production
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        message: 'Faucet is disabled in production environment'
      });
      return;
    }

    const { walletAddress, amount } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
      return;
    }

    if (!amount || amount <= 0 || amount > 1000) {
      res.status(400).json({
        success: false,
        message: 'Amount must be between 1 and 1000 USDC'
      });
      return;
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
      return;
    }

    // Build connection and keys
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const mintAddress = new PublicKey(process.env.USDC_MINT || DEFAULT_USDC_DEVNET_MINT);
    const recipientPubkey = new PublicKey(walletAddress);
    const faucetKeypair = loadFaucetKeypair();

    // Resolve mint info and compute base units (use number to avoid BigInt target issues)
    const mintInfo = await getMint(connection, mintAddress);
    const decimals = mintInfo.decimals;
    const unit = Math.pow(10, decimals);
    const amountInBaseUnits = Math.round(Number(amount) * unit);

    // Ensure faucet has an ATA and sufficient balance
    const faucetAta = await getOrCreateAssociatedTokenAccount(
      connection,
      faucetKeypair,
      mintAddress,
      faucetKeypair.publicKey
    );

    if (Number(faucetAta.amount) < amountInBaseUnits) {
      res.status(503).json({
        success: false,
        message: 'Faucet temporarily depleted. Please try again later.'
      });
      return;
    }

    // Ensure recipient ATA exists
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      faucetKeypair,
      mintAddress,
      recipientPubkey
    );

    // Transfer tokens
    const signature = await transfer(
      connection,
      faucetKeypair, // fee payer
      faucetAta.address,
      recipientAta.address,
      faucetKeypair, // owner of source
      amountInBaseUnits
    );

    res.status(200).json({
      success: true,
      message: `Successfully airdropped ${amount} devnet USDC`,
      data: {
        signature,
        amount,
        walletAddress,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        network: 'devnet',
        mint: mintAddress.toBase58(),
        note: 'Transferred USDC on devnet via SPL Token program'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error)?.message || 'Internal server error while processing faucet request'
    });
  }
};

/**
 * Get faucet status and limits
 * @route GET /api/faucet/status
 * @access Public
 */
export const getFaucetStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        available: true,
        limits: {
          maxAmount: 1000,
          minAmount: 1,
          cooldown: 300, // 5 minutes in seconds
        },
        network: 'devnet',
        tokenMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC mint
        note: 'Mock faucet for development testing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting faucet status'
    });
  }
};