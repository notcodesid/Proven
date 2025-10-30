import { UserChallenge } from './types';
import { saveUserChallenge } from './localStorage';
import { recordStakeTransaction } from '../transactionService';
import { getAuthToken } from '../auth/authUtils';

import { getApiUrl, API_ENDPOINTS, withApiCredentials } from '../../config/api';

/**
 * Record a challenge stake and add it to user's active challenges
 */
export const recordChallengeStake = async (
  challengeId: string,
  userId: string,
  stake: number,
  transactionSignature: string
): Promise<UserChallenge> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_JOIN), withApiCredentials({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        challengeId,
        stakeAmount: stake,
        transactionSignature
      }),
    }));

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to record challenge stake');
    }

    const data = await response.json();
    const userChallenge = data.userChallenge;

    // Record the stake transaction
    await recordStakeTransaction(userChallenge);

    // Save to localStorage as a fallback
    saveUserChallenge(userChallenge);

    return userChallenge;
  } catch (error) {
    throw error;
  }
};
