import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

/**
 * Check if a user has already joined a challenge
 * @param challengeId The ID of the challenge to check
 * @returns An object with hasJoined flag and userChallenge data if joined
 */
export const checkUserChallenge = async (challengeId: string): Promise<{
  hasJoined: boolean;
  userChallenge: any | null;
}> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Call the API endpoint
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_CHECK(challengeId)), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to check challenge status');
    }
    
    const data = await response.json();
    return {
      hasJoined: data.hasJoined,
      userChallenge: data.userChallenge
    };
  } catch (error) {
    return {
      hasJoined: false,
      userChallenge: null
    };
  }
};
