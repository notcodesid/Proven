import { getAuthToken } from './auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

export interface Transaction {
  id: string;
  userId: string;
  type: 'STAKE' | 'REWARD' | 'WITHDRAWAL';
  amount: number;
  signature: string;
  timestamp: string;
  description: string;
  challengeId?: string;
  challengeTitle?: string;
}

/**
 * Record a transaction (stake, reward, or withdrawal)
 */
export const recordStakeTransaction = async (userChallenge: any): Promise<Transaction> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.TRANSACTION_CREATE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'STAKE',
        amount: userChallenge.stakeAmount,
        signature: userChallenge.transactionSignature,
        description: `Staked for ${userChallenge.challenge?.title || 'Challenge'}`,
        challengeId: userChallenge.challengeId,
        challengeTitle: userChallenge.challenge?.title,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to record transaction: ${response.status}`);
    }

    const data = await response.json();
    return data.transaction;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (): Promise<Transaction[]> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.TRANSACTIONS), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    throw error;
  }
};
