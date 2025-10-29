import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ID, USDC_MINT } from '../config/blockchain';

export { PROGRAM_ID, USDC_MINT };

// Derive the escrow PDA
export const findEscrowPDA = async (): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow')],
    PROGRAM_ID
  );
};

// Get escrow account balance
export const getEscrowBalance = async (connection: Connection): Promise<number> => {
  const [escrowPDA] = await findEscrowPDA();
  const balance = await connection.getBalance(escrowPDA);
  return balance / LAMPORTS_PER_SOL;
};

// Stake SOL to the escrow
export const stakeToEscrow = async (
  connection: Connection,
  wallet: ReturnType<typeof useWallet>,
  amount: number
): Promise<string | null> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    return null;
  }

  try {
    // Convert SOL to lamports
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    
    // Get the escrow PDA
    const [escrowPDA] = await findEscrowPDA();
    
    // Create a simple transfer transaction
    // In a complete implementation, you would call your program's stake instruction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: escrowPDA,
        lamports,
      })
    );
    
    // Set recent blockhash and fee payer
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    // Sign and send the transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    return null;
  }
};

// Initialize the escrow account
export const initializeEscrow = async (
  connection: Connection,
  wallet: ReturnType<typeof useWallet>
): Promise<string | null> => {
  // This would call your program's initialize_escrow instruction
  // For now, we're just creating a simple transfer to ensure the account exists
  try {
    const [escrowPDA] = await findEscrowPDA();
    const balance = await connection.getBalance(escrowPDA);
    
    // If the account already has a balance, we don't need to initialize
    if (balance > 0) {
      return 'already-initialized';
    }
    
    // For simplicity, just send a small amount to create the account
    return await stakeToEscrow(connection, wallet, 0.001);
  } catch (error) {
    return null;
  }
}; 