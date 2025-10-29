import React from 'react';
import {
  formatChallengeTimeline,
  formatDateRange,
  getStatusText,
  getStatusColor,
  getChallengeStatus,
  calculateChallengeDuration,
} from '@/utils/challengeTimeline';
import { CalendarIcon } from './customicons';

interface ChallengeTimelineProps {
  startDate: Date | string;
  endDate: Date | string;
  variant?: 'full' | 'compact' | 'badge-only';
  showStatus?: boolean;
  className?: string;
}

/**
 * ChallengeTimeline Component
 *
 * Displays challenge timeline information with status badge
 */
export const ChallengeTimeline: React.FC<ChallengeTimelineProps> = ({
  startDate,
  endDate,
  variant = 'full',
  showStatus = true,
  className = '',
}) => {
  const { status, text: statusText } = getStatusText(startDate, endDate);
  const colors = getStatusColor(status);
  const timeline = formatChallengeTimeline(startDate, endDate);
  const dateRange = formatDateRange(startDate, endDate);
  const duration = calculateChallengeDuration(startDate, endDate);

  if (variant === 'badge-only') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
      >
        {status}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-400">
          📅 {dateRange}
        </span>
        {showStatus && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {statusText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">📅</span>
          <span className="text-sm font-medium text-white">{timeline}</span>
        </div>
        {showStatus && (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Inline timeline display for cards
 */
export const TimelineBadge: React.FC<{ startDate: Date | string; endDate: Date | string }> = ({
  startDate,
  endDate,
}) => {
  const duration = calculateChallengeDuration(startDate, endDate);

  return (
    <div className="bg-[#2A2A2A] border border-gray-700 rounded-full px-4 py-2 flex items-center justify-center gap-2">
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        <CalendarIcon />
      </div>
      <span className="text-gray-300 text-sm leading-none">
        {duration} {duration === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
};

/**
 * Status indicator with icon
 */
export const StatusBadge: React.FC<{ startDate: Date | string; endDate: Date | string }> = ({
  startDate,
  endDate,
}) => {
  const { status, text } = getStatusText(startDate, endDate);
  const colors = getStatusColor(status);

  const getIcon = () => {
    switch (status) {
      case 'UPCOMING':
        return '🔜';
      case 'ACTIVE':
        return '🔥';
      case 'COMPLETED':
        return '✅';
      default:
        return '';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span>{getIcon()}</span>
      <span>{text}</span>
    </span>
  );
};
