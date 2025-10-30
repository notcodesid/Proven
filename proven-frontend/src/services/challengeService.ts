import { Challenge } from '../types/challenge';
import { supabase } from '../../lib/supabase';
import { API_ENDPOINTS, getApiUrl, withApiCredentials } from '../config/api';

/**
 * Get the authentication token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error('Error getting session');
  }
  
  if (!session) {
    throw new Error('User not authenticated');
  }
  
  return session.access_token;
}

export const fetchChallenges = async (): Promise<Challenge[]> => {
  try {
    // Make API call to get all challenges (public endpoint)
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGES), withApiCredentials({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch challenges: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const joinChallenge = async (
  challengeId: string,
  stakeAmount: number,
  userWalletAddress: string,
  transactionSignature: string
): Promise<{ success: boolean, message: string }> => {
  try {
    const token = await getAuthToken();

    // Make a POST request to join the challenge with on-chain proof
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_JOIN), withApiCredentials({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        challengeId,
        stakeAmount,
        userWalletAddress,
        transactionSignature,
      }),
    }));

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Failed to join challenge',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Successfully joined the challenge',
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while joining the challenge',
    };
  }
};

export const fetchChallengeById = async (challengeId: string): Promise<Challenge> => {
  try {
    // Make API call to get single challenge (public endpoint)
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_BY_ID(challengeId)), withApiCredentials({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Challenge not found');
      }
      throw new Error(`Failed to fetch challenge: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchStakeQuote = async (challengeId: string) => {
  const token = await getAuthToken();
  const response = await fetch(
    getApiUrl(API_ENDPOINTS.CHALLENGE_STAKE_QUOTE(challengeId)),
    withApiCredentials({
      headers: { 'Authorization': `Bearer ${token}` }
    })
  );
  if (!response.ok) throw new Error('Failed to fetch stake quote');
  const { data } = await response.json();
  return data as { quoteId: string; amountLamports: number; escrowPubkey: string; expiresAt: number };
};

export const joinChallengeWithQuote = async (
  challengeId: string,
  quoteId: string,
  opts?: { signature?: string; walletAddress?: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_JOIN), withApiCredentials({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ challengeId, quoteId, ...opts })
    }));
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, message: err.message || 'Failed to join challenge' };
    }
    const data = await response.json().catch(() => ({}));
    return { success: true, message: data.message || 'Successfully joined the challenge' };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Failed to join challenge' };
  }
};

export const fetchUserChallenges = async () => {
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
    
    // For development purposes, if the API fails, return an empty array
    // This should be removed in production and proper error handling added
    return [];
  }
};

export interface CreateChallengeData {
  title: string;
  description: string;
  category: string;
  duration: string;
  prizePool: number;
  status: string;
  participantLimit: number;
  startDate: string;
  endDate: string;
  rules: string[];
  image: string;
  metrics: string;
  difficulty: string;
  verificationType: string;
  userStake: number;
  totalPrizePool: number;
  hostType: string;
  sponsor?: string;
  // Blockchain integration fields
  blockchainId?: string;
  transactionSignature?: string;
}

export const createChallenge = async (challengeData: CreateChallengeData): Promise<{ success: boolean, challenge?: any, message: string }> => {
  try {
    const token = await getAuthToken();
    
    // Prepare the data according to backend schema
    const payload = {
      title: challengeData.title,
      description: challengeData.description,
      type: challengeData.category,
      duration: challengeData.duration,
      userStake: challengeData.userStake,
      totalPrizePool: challengeData.totalPrizePool,
      participants: 0,
      metrics: challengeData.metrics,
      trackingMetrics: [],
      image: challengeData.image,
      rules: challengeData.rules,
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
      difficulty: challengeData.difficulty,
      verificationType: challengeData.verificationType,
      hostType: challengeData.hostType,
      sponsor: challengeData.sponsor,
      // Blockchain data
      blockchainId: challengeData.blockchainId,
      transactionSignature: challengeData.transactionSignature,
    };

    
    // Make API call to create challenge
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_CREATE), withApiCredentials({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }));

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.error || 'Failed to create challenge',
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      challenge: data.challenge,
      message: 'Challenge created successfully!',
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while creating the challenge',
    };
  }
}; 
