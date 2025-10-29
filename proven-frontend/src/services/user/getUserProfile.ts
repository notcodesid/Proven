import { UserProfile } from './types';
import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

/**
 * Get the current user's profile information
 * Uses the /api/users/me endpoint
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const token = await getAuthToken();
    
    // Call the API endpoint
    const response = await fetch(getApiUrl(API_ENDPOINTS.USER_PROFILE), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user profile');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Return null if fetch fails (non-critical - user might not be logged in)
    return null;
  }
};
