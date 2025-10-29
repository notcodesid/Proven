/**
 * Application Constants
 *
 * Centralized constants for timeouts, limits, and other configuration values.
 * NO default images or names should be stored here.
 */

// API and Network Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000,           // 30 seconds for API requests
  FILE_UPLOAD: 120000,          // 2 minutes for file uploads
  WALLET_CONNECTION: 15000,     // 15 seconds for wallet operations
  SUCCESS_MESSAGE: 3000,        // 3 seconds to show success messages
  REDIRECT_DELAY: 2000,         // 2 seconds before redirecting after success
  FAUCET_COOLDOWN: 5 * 60 * 1000,  // 5 minutes cooldown for faucet
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 5,          // Maximum file size in MB
  MAX_PROFILE_IMAGE_MB: 5,      // Maximum profile image size
  MAX_PROOF_IMAGE_MB: 10,       // Maximum proof submission image size
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
} as const;

// Blockchain Constants
export const BLOCKCHAIN = {
  // Conversion factors for different tokens
  LAMPORTS_PER_SOL: 1_000_000_000,  // SOL has 9 decimals
  DECIMALS: {
    SOL: 9,      // Native SOL: 1 SOL = 1_000_000_000 lamports
    USDC: 6,     // USDC token: 1 USDC = 1_000_000 smallest units
  },
  // Stake amount limits
  MIN_STAKE: {
    SOL: 0.001,   // Minimum SOL stake
    USDC: 0.01,   // Minimum USDC stake
  },
  MAX_STAKE: {
    SOL: 1000,    // Maximum SOL stake
    USDC: 10000,  // Maximum USDC stake
  },
  // Refresh intervals
  BALANCE_REFRESH_INTERVAL: 10000,  // 10 seconds - refresh wallet balance
  ESCROW_CHECK_INTERVAL: 10000,     // 10 seconds - check escrow balance

  // Default currency for new challenges (can be overridden per challenge)
  DEFAULT_CURRENCY: 'SOL' as 'SOL' | 'USDC',
} as const;

// Challenge Status Values
export const CHALLENGE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  UPCOMING: 'UPCOMING',
  CANCELLED: 'CANCELLED',
} as const;

// Submission Status Values
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  LOCKED: 'locked',
} as const;

// Calendar Day Status Icons
export const STATUS_ICONS = {
  APPROVED: '✅',
  SUBMITTED: '🟡',
  REJECTED: '❌',
  NOT_SUBMITTED: '⚪',
  LOCKED: '🔒',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Date Formats
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm',
} as const;

// UI Constants
export const UI = {
  SKELETON_LOADING_COUNT: 4,     // Number of skeleton items to show
  DEBOUNCE_DELAY: 300,           // Debounce delay for search/input (ms)
  ANIMATION_DURATION: 200,       // Standard animation duration (ms)
} as const;

// Challenge Difficulty Levels
export const DIFFICULTY = {
  EASY: 'EASY',
  MODERATE: 'MODERATE',
  HARD: 'HARD',
} as const;

// Challenge Types
export const CHALLENGE_TYPES = {
  FITNESS: 'Fitness',
  EDUCATION: 'Education',
  LIFESTYLE: 'Lifestyle',
  OTHER: 'Other',
} as const;

// Host Types
export const HOST_TYPES = {
  ORG: 'ORG',
  INDIVIDUAL: 'INDIVIDUAL',
} as const;
