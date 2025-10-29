import { getAuthToken } from '../auth/authUtils';
import { API_BASE_URL, API_ENDPOINTS, getApiUrl } from '../../config/api';

export type ReviewStatus = 'APPROVED' | 'REJECTED';

export interface AdminUserInfo {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AdminChallengeInfo {
  id: string;
  title: string;
  description?: string | null;
  endDate: string | Date;
}

export interface AdminUserChallengeInfo {
  id: string;
  currentProgress: number;
  stakeAmount: number;
  startDate: string | Date;
}

export interface AdminSubmissionItem {
  id: string;
  imageUrl: string; // May be a storage path or absolute URL
  description?: string | null;
  submissionDate: string | Date;
  daysSinceSubmission: number;
  urgency: 'low' | 'medium' | 'high';
  user: AdminUserInfo;
  challenge: AdminChallengeInfo;
  userChallenge: AdminUserChallengeInfo;
}

export interface PendingResponse {
  submissions: AdminSubmissionItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  summary: {
    totalPending: number;
    highUrgency: number;
    mediumUrgency: number;
    lowUrgency: number;
  };
}

export async function fetchPendingSubmissions(params?: {
  page?: number;
  limit?: number;
  challengeId?: string;
}): Promise<PendingResponse> {
  const token = await getAuthToken();
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.challengeId) query.set('challengeId', params.challengeId);

  const response = await fetch(`${getApiUrl(API_ENDPOINTS.SUBMISSION_PENDING)}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to load pending submissions');
  }
  return result.data as PendingResponse;
}

export async function reviewSubmission(
  submissionId: string,
  status: ReviewStatus,
  reviewComments?: string
): Promise<{ success: boolean; message: string }> {
  const token = await getAuthToken();
  const response = await fetch(getApiUrl(API_ENDPOINTS.SUBMISSION_REVIEW(submissionId)), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reviewComments }),
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    return { success: false, message: result?.message || 'Failed to review submission' };
  }
  return { success: true, message: result?.message || 'Reviewed' };
}

export function getSubmissionImageUrl(raw: string): string {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  // proxy will validate auth and stream bytes
  return `${API_BASE_URL}/storage/proof?path=${encodeURIComponent(raw)}`;
}


