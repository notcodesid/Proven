/**
 * Solana Error Handling Utilities
 *
 * This file provides comprehensive error parsing for Solana transactions
 * to give users better error messages when transactions fail.
 */

export interface ParsedError {
  title: string;
  message: string;
  technicalDetails?: string;
  actionable: boolean;
}

/**
 * Parse Solana/Anchor errors into user-friendly messages
 */
export function parseSolanaError(error: any): ParsedError {
  const errorString = error?.message || error?.toString() || '';
  const logs = error?.logs || [];

  // User rejected transaction
  if (errorString.includes('User rejected') || errorString.includes('user rejected')) {
    return {
      title: 'Transaction Rejected',
      message: 'You rejected the transaction in your wallet. No funds were transferred.',
      actionable: true,
    };
  }

  // Insufficient SOL for fees
  if (errorString.includes('0x1') || errorString.includes('insufficient funds for rent')) {
    return {
      title: 'Insufficient SOL',
      message: 'You need SOL in your wallet to pay for transaction fees. Please add at least 0.01 SOL to your wallet.',
      actionable: true,
    };
  }

  // Insufficient token balance
  if (errorString.includes('Insufficient') && errorString.includes('USDC')) {
    return {
      title: 'Insufficient USDC',
      message: errorString,
      actionable: true,
    };
  }

  // Account doesn't exist
  if (errorString.includes('Account does not exist') || errorString.includes('AccountNotFound')) {
    return {
      title: 'Account Not Found',
      message: 'The required blockchain account does not exist. This might be a configuration issue.',
      technicalDetails: errorString,
      actionable: false,
    };
  }

  // Challenge not found
  if (errorString.includes('Challenge not found')) {
    return {
      title: 'Challenge Not Found',
      message: 'This challenge does not exist on the blockchain. The challenge may have been deleted or the blockchain ID is incorrect.',
      actionable: false,
    };
  }

  // Already joined
  if (errorString.includes('already joined')) {
    return {
      title: 'Already Joined',
      message: 'You have already joined this challenge.',
      actionable: false,
    };
  }

  // Challenge status errors
  if (errorString.includes('already started')) {
    return {
      title: 'Challenge Started',
      message: 'This challenge has already started. You can no longer join.',
      actionable: false,
    };
  }

  if (errorString.includes('cancelled')) {
    return {
      title: 'Challenge Cancelled',
      message: 'This challenge has been cancelled.',
      actionable: false,
    };
  }

  if (errorString.includes('ended')) {
    return {
      title: 'Challenge Ended',
      message: 'This challenge has already ended.',
      actionable: false,
    };
  }

  // Token account errors
  if (errorString.includes('token account')) {
    return {
      title: 'Token Account Error',
      message: 'There was an issue setting up your USDC token account. Please try again.',
      technicalDetails: errorString,
      actionable: true,
    };
  }

  // Simulation failed
  if (errorString.includes('Simulation failed') || errorString.includes('Transaction simulation failed')) {
    // Try to extract more specific error from logs
    let specificReason = '';

    if (logs.some((log: string) => log.includes('InvalidChallengeStatus'))) {
      specificReason = 'The challenge is not in a valid state to join.';
    } else if (logs.some((log: string) => log.includes('ChallengeStarted'))) {
      specificReason = 'The challenge has already started.';
    } else if (logs.some((log: string) => log.includes('insufficient funds'))) {
      specificReason = 'You have insufficient USDC balance.';
    } else if (logs.some((log: string) => log.includes('custom program error'))) {
      specificReason = 'The smart contract rejected the transaction. Check the challenge requirements.';
    }

    return {
      title: 'Transaction Simulation Failed',
      message: specificReason || 'The transaction failed during simulation. Common causes:\n• Insufficient USDC balance\n• Insufficient SOL for transaction fees\n• Challenge state has changed\n• USDC token account not set up\n\nPlease check your balances and try again.',
      technicalDetails: logs.join('\n'),
      actionable: true,
    };
  }

  // Program errors from logs
  if (logs.length > 0) {
    if (logs.some((log: string) => log.includes('InvalidChallengeStatus'))) {
      return {
        title: 'Invalid Challenge Status',
        message: 'The challenge is not in a valid state for this operation.',
        technicalDetails: logs.join('\n'),
        actionable: false,
      };
    }

    if (logs.some((log: string) => log.includes('InvalidOracle'))) {
      return {
        title: 'Oracle Error',
        message: 'There is an issue with the challenge oracle configuration. Please contact support.',
        technicalDetails: logs.join('\n'),
        actionable: false,
      };
    }

    if (logs.some((log: string) => log.includes('NotJoined'))) {
      return {
        title: 'Not Joined',
        message: 'You have not joined this challenge.',
        actionable: false,
      };
    }
  }

  // Network errors
  if (errorString.includes('fetch') || errorString.includes('network') || errorString.includes('timeout')) {
    return {
      title: 'Network Error',
      message: 'There was a network error connecting to the Solana blockchain. Please check your internet connection and try again.',
      technicalDetails: errorString,
      actionable: true,
    };
  }

  // Backend errors
  if (errorString.includes('Backend verification failed')) {
    return {
      title: 'Verification Failed',
      message: 'The blockchain transaction succeeded, but backend verification failed. Your funds are safe on the blockchain. Please contact support with your transaction signature.',
      technicalDetails: errorString,
      actionable: false,
    };
  }

  // Generic error
  return {
    title: 'Transaction Failed',
    message: errorString || 'An unexpected error occurred. Please try again.',
    technicalDetails: logs.join('\n') || errorString,
    actionable: true,
  };
}

/**
 * Format error for logging
 */
export function formatErrorForLog(error: any): string {
  const parsed = parseSolanaError(error);

  let formatted = `[${parsed.title}] ${parsed.message}`;

  if (parsed.technicalDetails) {
    formatted += `\n\nTechnical Details:\n${parsed.technicalDetails}`;
  }

  if (error?.stack) {
    formatted += `\n\nStack Trace:\n${error.stack}`;
  }

  return formatted;
}

/**
 * Check if error is recoverable/retryable
 */
export function isRetryableError(error: any): boolean {
  const parsed = parseSolanaError(error);
  return parsed.actionable;
}

/**
 * Get Solana Explorer URL for transaction
 */
export function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' | 'testnet' = 'devnet'): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
}
