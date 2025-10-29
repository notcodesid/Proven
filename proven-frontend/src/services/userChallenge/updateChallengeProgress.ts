import { UserChallenge } from './types';
import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

/**
 * Update challenge progress for a user
 */
export const updateChallengeProgress = async (
  userChallengeId: string,
  progress: number
): Promise<UserChallenge | null> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_PROGRESS), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userChallengeId,
        progress
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.userChallenge;
  } catch (error) {
    return null;
  }
};
