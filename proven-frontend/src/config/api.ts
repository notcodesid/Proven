/**
 * Centralized API Configuration
 *
 * All API endpoints should use this configuration instead of hardcoding URLs
 */

// Helper to safely merge base URLs and endpoints without double slashes
let warnedMissingEnv = false;

const sanitizeBaseUrl = (
  value: string | undefined | null,
  fallback: string,
  envLabel: string
): string => {
  const candidate = value?.trim();

  if (!candidate && process.env.NODE_ENV !== 'production' && !warnedMissingEnv) {
    console.warn(`Using fallback for ${envLabel}. Set ${envLabel} to avoid localhost defaults.`);
    warnedMissingEnv = true;
  }

  if (!candidate && process.env.NODE_ENV === 'production' && !warnedMissingEnv) {
    console.error(`Missing ${envLabel} in production. Falling back to ${fallback}.`);
    warnedMissingEnv = true;
  }

  const resolved = candidate || fallback;
  return resolved.replace(/\/+$/, '');
};

const ensureLeadingSlash = (endpoint: string): string =>
  endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

const PROD_API_FALLBACK = 'https://proven.onrender.com/api';
const PROD_SERVER_FALLBACK = 'https://proven.onrender.com';
const DEV_API_FALLBACK = 'http://localhost:3001/api';
const DEV_SERVER_FALLBACK = 'http://localhost:3001';

const apiFallback = process.env.NODE_ENV === 'production' ? PROD_API_FALLBACK : DEV_API_FALLBACK;
const serverFallback = process.env.NODE_ENV === 'production' ? PROD_SERVER_FALLBACK : DEV_SERVER_FALLBACK;

// Base API URL for all requests
export const API_BASE_URL = sanitizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL,
  apiFallback,
  'NEXT_PUBLIC_API_URL'
);

// Server URL (for auth and other endpoints that might differ)
export const SERVER_URL = sanitizeBaseUrl(
  process.env.NEXT_PUBLIC_SERVER_URL,
  serverFallback,
  'NEXT_PUBLIC_SERVER_URL'
);

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
  STORAGE_PROOF_SIGNED_UPLOAD: '/storage/proof/signed-upload',
  STORAGE_PROOF_SIGNED_PREVIEW: '/storage/proof/signed-preview',
} as const;

/**
 * Get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${ensureLeadingSlash(endpoint)}`;
};

/**
 * Get full server URL
 */
export const getServerUrl = (endpoint: string): string => {
  return `${SERVER_URL}${ensureLeadingSlash(endpoint)}`;
};
