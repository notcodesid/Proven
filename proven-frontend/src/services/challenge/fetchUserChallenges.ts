import { Challenge } from '../../types/challenge';
import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS, withApiCredentials } from '../../config/api';

/**
 * Fetch challenges that the current user has joined
 */
export const fetchUserChallenges = async (): Promise<Challenge[]> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_USER), withApiCredentials({
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }));
    
    if (!response.ok) {
      throw new Error('Failed to fetch user challenges');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Return empty array as fallback (non-critical)
    return [];
  }
};
