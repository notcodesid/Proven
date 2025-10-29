import { Challenge } from '../../types/challenge';
import { fetchChallengeById as fetchChallengeDirect } from '../challengeService';

/**
 * Fetch a challenge by ID using the direct endpoint (optimized)
 *
 * ✅ OPTIMIZATION: Uses direct API endpoint instead of fetching all challenges
 * Old: Downloads ALL challenges (~100KB+) then filters locally
 * New: Fetches single challenge directly (~2KB)
 */
export const fetchChallengeById = async (challengeId: string): Promise<Challenge | null> => {
  try {
    const challenge = await fetchChallengeDirect(challengeId);
    return challenge;
  } catch (error) {
    return null;
  }
};
