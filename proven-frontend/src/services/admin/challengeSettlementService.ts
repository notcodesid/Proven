import { getAuthToken } from '../auth/authUtils';
import { getApiUrl, API_ENDPOINTS } from '../../config/api';

export interface ChallengeResultUser {
  userId: string;
  userName?: string | null;
  progress: number;
  reward: number;
}

export interface ChallengeResultStatistics {
  totalParticipants: number;
  winners: number;
  losers: number;
  successRate: string;
  averageProgress: string;
  totalStaked: number;
  totalRewardsDistributed: number;
}

export interface ChallengeResultData {
  challenge: {
    id: string;
    title: string;
    startDate: string | Date;
    endDate: string | Date;
    image?: string | null;
  };
  results: {
    isCompleted: boolean;
    statistics: ChallengeResultStatistics;
    winners: ChallengeResultUser[];
    losers: Array<{ userId: string; userName?: string | null; progress: number; stakeLost: number }>;
  };
}

export interface ChallengeResultResponse {
  success: boolean;
  data?: ChallengeResultData;
  message?: string;
}

export interface CompleteChallengePayload {
  completionThreshold?: number;
}

export async function completeChallenge(challengeId: string, payload?: CompleteChallengePayload) {
  const token = await getAuthToken();
  const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_COMPLETE(challengeId)), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload ?? {}),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || 'Failed to complete challenge');
  }
  return result;
}

export async function runChallengePayouts(challengeId: string) {
  const token = await getAuthToken();
  const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_COMPLETE_PAYOUTS(challengeId)), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    const details = Array.isArray(result?.errors)
      ? result.errors
          .map((err: { userName?: string; reason?: string }) => {
            if (!err) return null;
            const who = err.userName ? `${err.userName}: ` : '';
            return `${who}${err.reason ?? 'Unknown error'}`;
          })
          .filter(Boolean)
          .join('; ')
      : '';
    const message = result?.message || 'Failed to run payouts';
    throw new Error(details ? `${message}. ${details}` : message);
  }
  return result;
}

export async function fetchChallengeResults(challengeId: string): Promise<ChallengeResultResponse> {
  const token = await getAuthToken();
  const response = await fetch(getApiUrl(API_ENDPOINTS.CHALLENGE_RESULTS(challengeId)), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ChallengeResultResponse = await response.json().catch(() => ({ success: false }));
  if (!response.ok) {
    throw new Error(result?.message || 'Failed to load challenge results');
  }
  return result;
}
