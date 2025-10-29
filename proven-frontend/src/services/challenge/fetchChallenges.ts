import { Challenge } from '../../types/challenge';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

/**
 * Fetch all available challenges
 */
export const fetchChallenges = async (): Promise<Challenge[]> => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGES), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch challenges: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    return data.challenges || [];
  } catch (error) {
    throw error;
  }
};
