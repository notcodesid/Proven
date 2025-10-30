import { UserProfile } from './types';
import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS, withApiCredentials } from '../../config/api';

/**
 * Update the current user's profile information
 * Uses the /api/users/me endpoint with PUT method
 * @param data Object containing fields to update (name, username, bio, image)
 */
export const updateUserProfile = async (
  data: Partial<Pick<UserProfile, 'name' | 'bio' | 'image'>>
): Promise<UserProfile | null> => {
  try {
    const token = await getAuthToken();
    
    // Call the API endpoint
    const response = await fetch(getApiUrl(API_ENDPOINTS.USER_PROFILE), withApiCredentials({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }));
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific error for username conflict
      if (response.status === 400 && errorData.error && errorData.error.includes('already taken')) {
        throw new Error('Username already taken. Please choose a different username.');
      }
      
      throw new Error(errorData.message || errorData.error || 'Failed to update user profile');
    }
    
    const result = await response.json();
    
    // Return the updated user data from the response
    return result.user || result;
  } catch (error) {
    throw error;
  }
};
