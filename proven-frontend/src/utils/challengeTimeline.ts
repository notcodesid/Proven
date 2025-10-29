/**
 * Challenge Timeline Utilities (Frontend)
 *
 * Helper functions for displaying and working with challenge timelines
 */

export type ChallengeStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

/**
 * Calculate the duration of a challenge in days
 */
export const calculateChallengeDuration = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if a challenge is currently active based on timeline
 */
export const isChallengeActive = (startDate: Date | string, endDate: Date | string): boolean => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  return now >= start && now <= end;
};

/**
 * Check if a challenge is upcoming (hasn't started yet)
 */
export const isChallengeUpcoming = (startDate: Date | string): boolean => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const now = new Date();
  return now < start;
};

/**
 * Check if a challenge has ended
 */
export const isChallengeEnded = (endDate: Date | string): boolean => {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  return now > end;
};

/**
 * Get challenge status based on timeline
 */
export const getChallengeStatus = (startDate: Date | string, endDate: Date | string): ChallengeStatus => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  if (now < start) {
    return 'UPCOMING';
  } else if (now >= start && now <= end) {
    return 'ACTIVE';
  } else {
    return 'COMPLETED';
  }
};

/**
 * Format challenge timeline for display
 * Example: "Oct 25 - Nov 1 (7 days)"
 */
export const formatChallengeTimeline = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const duration = calculateChallengeDuration(start, end);

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${startFormatted} - ${endFormatted} (${duration} ${duration === 1 ? 'day' : 'days'})`;
};

/**
 * Format just the date range without duration
 * Example: "Oct 25 - Nov 1"
 */
export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Get days remaining in a challenge
 */
export const getDaysRemaining = (endDate: Date | string): number => {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  if (now > end) return 0;

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get days until challenge starts
 */
export const getDaysUntilStart = (startDate: Date | string): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const now = new Date();

  if (now >= start) return 0;

  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get status badge color based on challenge status
 */
export const getStatusColor = (status: ChallengeStatus): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'UPCOMING':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
      };
    case 'ACTIVE':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
      };
    case 'COMPLETED':
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
      };
  }
};

/**
 * Get human-readable status text
 */
export const getStatusText = (
  startDate: Date | string,
  endDate: Date | string
): { status: ChallengeStatus; text: string } => {
  const status = getChallengeStatus(startDate, endDate);

  switch (status) {
    case 'UPCOMING': {
      const days = getDaysUntilStart(startDate);
      return {
        status,
        text: days === 0 ? 'Starting soon' : `Starts in ${days} ${days === 1 ? 'day' : 'days'}`,
      };
    }
    case 'ACTIVE': {
      const days = getDaysRemaining(endDate);
      return {
        status,
        text: days === 0 ? 'Ends today' : `${days} ${days === 1 ? 'day' : 'days'} left`,
      };
    }
    case 'COMPLETED': {
      return {
        status,
        text: 'Completed',
      };
    }
    default:
      return {
        status: 'COMPLETED',
        text: 'Unknown',
      };
  }
};
