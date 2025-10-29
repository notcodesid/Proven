import { PublicKey } from '@solana/web3.js';
import type { TokenType } from '@/utils/tokenUtils';

/**
 * Blockchain Configuration
 *
 * All blockchain addresses and network settings should be configured via environment variables.
 * See .env.example for required variables.
 */

/**
 * Safely fetch a required env variable.
 */
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Program ID for the Proven Stake program
// This must match the declare_id!() in the Rust program
export const PROGRAM_ID = new PublicKey(getRequiredEnv('NEXT_PUBLIC_PROGRAM_ID'));

// USDC Mint address (configured per deployment)
export const USDC_MINT = new PublicKey(getRequiredEnv('NEXT_PUBLIC_USDC_MINT'));

/**
 * Get the token mint address for a given token type
 * Returns null for native SOL (doesn't have a mint)
 */
export const getTokenMint = (tokenType: TokenType): PublicKey | null => {
  switch (tokenType) {
    case 'USDC':
      return USDC_MINT;
    case 'SOL':
      return null; // Native SOL doesn't have a mint
    default:
      return null;
  }
};

// Oracle public key for challenge validation
export const ORACLE_PUBKEY = new PublicKey(getRequiredEnv('NEXT_PUBLIC_ORACLE_PUBKEY'));

// RPC endpoint
export const DEFAULT_RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Network configuration (devnet, testnet, mainnet-beta)
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// Solana explorer base URL
const EXPLORER_BASE_URLS = {
  'mainnet-beta': 'https://explorer.solana.com',
  'devnet': 'https://explorer.solana.com/?cluster=devnet',
  'testnet': 'https://explorer.solana.com/?cluster=testnet',
} as const;

export const EXPLORER_URL = EXPLORER_BASE_URLS[NETWORK as keyof typeof EXPLORER_BASE_URLS] || EXPLORER_BASE_URLS.devnet;


/**
 * Get address URL for Solana explorer
 */
export const getAddressUrl = (address: string): string => {
  return `${EXPLORER_URL}/address/${address}`;
};
