import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  MINT_SIZE, 
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { USDC_MINT } from '../config/blockchain';
import { API_ENDPOINTS, getServerUrl, withApiCredentials } from '../src/config/api';

// For devnet testing - this would be a server-side faucet in production
export const useUSDCFaucet = () => {
  const { publicKey, sendTransaction } = useWallet();

  // Airdrop devnet USDC to user's wallet
  const requestUSDC = async (connection: Connection, amount: number = 100): Promise<string | null> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      
      // Get or create the user's USDC token account
      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );

      // Check if token account exists
      const accountInfo = await connection.getAccountInfo(userTokenAccount);
      
      if (!accountInfo) {
        // Create the associated token account
        const createAccountIx = createAssociatedTokenAccountInstruction(
          publicKey, // payer
          userTokenAccount, // token account
          publicKey, // owner
          USDC_MINT // mint
        );

        const transaction = new Transaction().add(createAccountIx);
        transaction.feePayer = publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');
      }

      // Call backend faucet endpoint
      const response = await fetch(getServerUrl(API_ENDPOINTS.FAUCET_USDC), withApiCredentials({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          amount,
        }),
      }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Faucet request failed');
      }

      const result = await response.json();
      
      return result.data?.signature || result.signature;

    } catch (error) {
      throw error;
    }
  };

  const getUSDCBalance = async (connection: Connection): Promise<number> => {
    if (!publicKey) return 0;

    try {
      const userTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );

      const accountInfo = await connection.getAccountInfo(userTokenAccount);
      if (!accountInfo) return 0;

      const balance = await connection.getTokenAccountBalance(userTokenAccount);
      return parseFloat(balance.value.amount) / 1_000_000; // USDC has 6 decimals
    } catch (error) {
      return 0;
    }
  };

  return {
    requestUSDC,
    getUSDCBalance,
  };
};

// Alternative direct approach for testing (requires a mint authority keypair)
export class DevnetUSDCFaucet {
  private connection: Connection;
  
  constructor(rpcEndpoint: string = 'https://api.devnet.solana.com') {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  async requestUSDCDirect(userPublicKey: PublicKey, amount: number = 100): Promise<string> {
    // This would require the mint authority's private key
    // For security, this should be done on the server side
    throw new Error('Direct USDC minting requires server-side implementation for security');
  }
}

// Mock faucet for development/testing
export const mockUSDCFaucet = {
  async requestUSDC(walletAddress: string, amount: number): Promise<{ success: boolean; signature?: string; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        signature: `faucet_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `Successfully airdropped ${amount} USDC to ${walletAddress}`,
      };
    } else {
      return {
        success: false,
        message: 'Faucet temporarily unavailable. Please try again.',
      };
    }
  }
};
