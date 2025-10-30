import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS, withApiCredentials } from '../../config/api';

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.USER_SIGNOUT), withApiCredentials({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }));

    if (!response.ok) {
    }

    return true;
  } catch (error) {
    // Even if API fails, we can still sign out locally
    return true;
  }
};
