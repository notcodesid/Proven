import { getAuthToken } from './auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

export interface TransactionHistory {
  challengeId: string;
  transactionType: 'STAKE' | 'REWARD' | 'WITHDRAWAL';
  amount: number;
  timestamp: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'COMPLETED';
  transactionSignature?: string | null;
  metadata?: Record<string, unknown> | null;
  challenge: {
    id: string;
    title: string;
  };
}

/**
 * Get transaction history for the authenticated user
 */
export const getTransactionHistory = async (): Promise<TransactionHistory[]> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.TRANSACTIONS), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction history: ${response.status}`);
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    throw error;
  }
};
