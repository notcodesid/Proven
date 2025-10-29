import { UserChallenge } from './types';
import { getLocalUserChallenges } from './localStorage';
import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

/**
 * Get all active challenges for a user
 */
export const getUserActiveChallenges = async (userId: string): Promise<UserChallenge[]> => {
  try {
    const token = await getAuthToken();
    
    // Call the API endpoint with status filter
    const response = await fetch(`${getApiUrl(API_ENDPOINTS.CHALLENGE_USER)}?status=ACTIVE`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch active challenges');
    }
    
    const data = await response.json();
    return data.userChallenges || [];
  } catch (error) {
    // Fall back to localStorage if API fails
    const challenges = getLocalUserChallenges();
    return challenges.filter(uc => uc.userId === userId && uc.status === 'ACTIVE');
  }
};

/**
 * Get all completed challenges for a user
 */
export const getUserCompletedChallenges = async (userId: string): Promise<UserChallenge[]> => {
  try {
    const token = await getAuthToken();
    
    // Call the API endpoint with status filter
    const response = await fetch(`${getApiUrl(API_ENDPOINTS.CHALLENGE_USER)}?status=COMPLETED`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch completed challenges');
    }
    
    const data = await response.json();
    return data.userChallenges || [];
  } catch (error) {
    // Fall back to localStorage if API fails
    const challenges = getLocalUserChallenges();
    return challenges.filter(uc => uc.userId === userId && uc.status === 'COMPLETED');
  }
};

/**
 * Get all challenges for a user
 */
export const getUserChallenges = async (userId: string): Promise<UserChallenge[]> => {
  try {
    const token = await getAuthToken();
    
    // Call the API endpoint
    const response = await fetch(`${getApiUrl(API_ENDPOINTS.CHALLENGE_USER)}?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user challenges');
    }
    
    const data = await response.json();
    return data.userChallenges || [];
  } catch (error) {
    // Fall back to localStorage if API fails
    const challenges = getLocalUserChallenges();
    return challenges.filter(uc => uc.userId === userId);
  }
};
