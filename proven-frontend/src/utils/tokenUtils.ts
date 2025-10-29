import { PublicKey } from '@solana/web3.js';
import { BLOCKCHAIN } from '@/config/constants';

export type TokenType = 'SOL' | 'USDC';

/**
 * Token configuration interface
 */
export interface TokenConfig {
  type: TokenType;
  decimals: number;
  mint?: PublicKey; // Only for SPL tokens (USDC)
  symbol: string;
}

/**
 * Get token decimals based on token type
 */
export const getTokenDecimals = (tokenType: TokenType): number => {
  return BLOCKCHAIN.DECIMALS[tokenType];
};

/**
 * Convert token amount to smallest units (lamports for SOL, token units for USDC)
 */
export const toSmallestUnit = (amount: number, tokenType: TokenType): number => {
  const decimals = getTokenDecimals(tokenType);
  return Math.floor(amount * Math.pow(10, decimals));
};

/**
 * Convert smallest units back to display amount
 */
export const fromSmallestUnit = (amount: number, tokenType: TokenType): number => {
  const decimals = getTokenDecimals(tokenType);
  return amount / Math.pow(10, decimals);
};

/**
 * Check if token is native SOL (vs SPL token)
 */
export const isNativeToken = (tokenType: TokenType): boolean => {
  return tokenType === 'SOL';
};

/**
 * Get minimum stake for token type
 */
export const getMinStake = (tokenType: TokenType): number => {
  return BLOCKCHAIN.MIN_STAKE[tokenType];
};

/**
 * Get maximum stake for token type
 */
export const getMaxStake = (tokenType: TokenType): number => {
  return BLOCKCHAIN.MAX_STAKE[tokenType];
};

/**
 * Validate stake amount for given token type
 */
export const validateStakeAmount = (
  amount: number,
  tokenType: TokenType
): { valid: boolean; error?: string } => {
  const min = getMinStake(tokenType);
  const max = getMaxStake(tokenType);

  if (amount < min) {
    return {
      valid: false,
      error: `Minimum stake is ${min} ${tokenType}`,
    };
  }

  if (amount > max) {
    return {
      valid: false,
      error: `Maximum stake is ${max} ${tokenType}`,
    };
  }

  return { valid: true };
};
