import { getAuthToken } from './auth/authUtils';
import { getApiUrl, API_ENDPOINTS, withApiCredentials } from '../config/api';

export interface ProofSubmission {
  id: string;
  imageUrl: string;
  description?: string;
  submissionDate: Date;
  reviewComments?: string;
  reviewedAt?: Date;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  status: 'not_submitted' | 'submitted' | 'approved' | 'rejected' | 'locked';
  submission: ProofSubmission | null;
  canSubmit: boolean;
}

export interface ChallengeCalendar {
  challenge: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    duration: string;
  };
  userChallenge: {
    id: string;
    progress: number;
    stakeAmount: number;
  };
  calendar: CalendarDay[];
  statistics: {
    totalDays: number;
    submittedDays: number;
    approvedDays: number;
    rejectedDays: number;
    missedDays: number;
    completionRate: number;
  };
}

export interface UserChallengeStatus {
  hasJoined: boolean;
  userChallenge: {
    id: string;
    progress: number;
    stakeAmount: number;
  } | null;
}

/**
 * Check if user has joined a specific challenge
 */
export const checkUserChallengeStatus = async (challengeId: string): Promise<UserChallengeStatus> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_CHECK(challengeId)), withApiCredentials({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to check challenge status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      hasJoined: data.hasJoined,
      userChallenge: data.userChallenge
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get daily proof calendar for a challenge
 */
export const getChallengeCalendar = async (challengeId: string): Promise<ChallengeCalendar> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.SUBMISSION_CALENDAR(challengeId)), withApiCredentials({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch challenge calendar: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Submit daily proof for a challenge
 */
export const submitDailyProof = async (
  userChallengeId: string,
  imageUrl: string,
  description?: string,
  imagePath?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(getApiUrl(API_ENDPOINTS.SUBMISSION_SUBMIT), withApiCredentials({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userChallengeId,
        imageUrl,
        imagePath,
        description
      }),
    }));
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit proof');
    }
    
    return {
      success: true,
      message: result.message || 'Proof submitted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit proof'
    };
  }
}; 
