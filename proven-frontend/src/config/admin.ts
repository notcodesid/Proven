/**
 * Admin Configuration
 *
 * Admin access control configuration using environment variables.
 * Set NEXT_PUBLIC_ADMIN_EMAILS as a comma-separated list of admin email addresses.
 */

/**
 * Get list of admin emails from environment variable
 * Supports comma-separated list: "admin1@example.com,admin2@example.com"
 */
const getAdminEmails = (): string[] => {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;

  if (envEmails) {
    return envEmails.split(',').map(email => email.trim()).filter(Boolean);
  }

  // Default admin email (only used if environment variable is not set)
  // In production, this should be configured via environment variables
  return ['hellolockin@gmail.com'];
};

export const ADMIN_EMAILS = getAdminEmails();

/**
 * Check if an email belongs to an admin user
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

/**
 * Admin-specific feature flags
 */
export const ADMIN_FEATURES = {
  CHALLENGE_CREATION: true,
  SUBMISSION_REVIEW: true,
  USER_MANAGEMENT: false, // Not yet implemented
} as const;
