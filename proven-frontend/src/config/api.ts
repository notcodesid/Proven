/**
 * Centralized API Configuration
 *
 * All API endpoints should use this configuration instead of hardcoding URLs
 */

// Base API URL for all requests
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Server URL (for auth and other endpoints that might differ)
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  // Challenges
  CHALLENGES: '/challenges',
  CHALLENGE_BY_ID: (id: string) => `/challenges/${id}`,
  CHALLENGE_STAKE_QUOTE: (id: string) => `/challenges/${id}/stake-quote`,
  CHALLENGE_JOIN: '/challenges/join',
  CHALLENGE_CREATE: '/challenges/create',
  CHALLENGE_USER: '/challenges/user',
  CHALLENGE_CHECK: (id: string) => `/challenges/${id}/check`,
  CHALLENGE_PROGRESS: '/challenges/progress',
  CHALLENGE_COMPLETE: (id: string) => `/challenges/${id}/complete`,
  CHALLENGE_COMPLETE_PAYOUTS: (id: string) => `/challenges/${id}/complete-payouts`,
  CHALLENGE_RESULTS: (id: string) => `/challenges/${id}/results`,

  // User
  USER_PROFILE: '/users/me',
  USER_SIGNOUT: '/users/signout',

  // Submissions
  SUBMISSIONS: '/submissions',
  SUBMISSION_SUBMIT: '/submissions/submit',
  SUBMISSION_CALENDAR: (challengeId: string) => `/submissions/challenge/${challengeId}/calendar`,
  SUBMISSION_PENDING: '/submissions/pending',
  SUBMISSION_REVIEW: (id: string) => `/submissions/${id}/review`,

  // Transactions
  TRANSACTION_CREATE: '/transactions',
  TRANSACTIONS: '/transactions/history',

  // Auth
  AUTH_SAVE_USER: '/api/auth/save-user',

  // Faucet
  FAUCET_USDC: '/api/faucet/usdc',

  // Storage
  STORAGE_SIGNED_URL: '/storage/signed-url',
} as const;

/**
 * Get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Get full server URL
 */
export const getServerUrl = (endpoint: string): string => {
  return `${SERVER_URL}${endpoint}`;
};
