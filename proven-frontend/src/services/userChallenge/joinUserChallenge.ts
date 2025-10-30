import { UserChallenge } from './types';
import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS, withApiCredentials } from '../../config/api';

/**
 * Join a user challenge
 */
export const joinUserChallenge = async (
  challengeId: string,
  stakeAmount: number
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
        stakeAmount
      }),
    }));

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to join challenge');
    }

    const data = await response.json();
    return data.userChallenge;
  } catch (error) {
    throw error;
  }
};
