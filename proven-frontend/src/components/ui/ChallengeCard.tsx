import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import { CalendarIcon, StepsIcon } from './customicons';
import { StatusBadge, TimelineBadge } from './ChallengeTimeline';
import { formatDateRange } from '@/utils/challengeTimeline';

export interface ChallengeCardProps {
  id: string;
  title: string;
  image: string;
  category?: string;
  hostType: string;
  sponsor?: string;
  creator?: string;
  duration: string;
  participants: number;
  userStake: number;
  totalPrizePool: number;
  steps?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  // Timeline fields
  startDate?: Date | string;
  endDate?: Date | string;
}

const ChallengeCardComponent: React.FC<ChallengeCardProps> = ({
  id,
  title,
  image,
  category = "Tech",
  duration,
  participants,
  userStake,
  totalPrizePool,
  steps = "Steps",
  isSelected,
  onSelect,
  startDate,
  endDate,
}) => {

  const handleClick = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  }, [id, onSelect]);
  

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${title} challenge card. ${isSelected ? 'Selected' : 'Not selected'}`}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF5757] focus:ring-offset-2 focus:ring-offset-[#121214] ${
        isSelected ? 'bg-[#252329] ring-2 ring-[#FF5757]' : 'bg-[#1C1C1E]'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Image section with category badge */}
      <div
        className="relative h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        
        {/* Category badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-[#FF5757] text-white px-3 py-1 rounded-full text-sm font-medium">
            {category}
          </span>
        </div>

        {/* Status badge (if timeline data is available) */}
        {startDate && endDate && (
          <div className="absolute bottom-4 left-4">
            <StatusBadge startDate={startDate} endDate={endDate} />
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-6 space-y-4">
        {/* Title and timeline */}
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
          {startDate && endDate && (
            <p className="text-sm text-gray-400">
              📅 {formatDateRange(startDate, endDate)}
            </p>
          )}
        </div>

        {/* Metrics pills */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-[#2A2A2A] border border-gray-700 rounded-full px-4 py-2 flex items-center justify-center gap-2">
            <span className="text-white text-sm font-medium leading-none">{userStake} USDC</span>
          </div>

          {/* Show duration badge if timeline data is available */}
          {startDate && endDate ? (
            <TimelineBadge startDate={startDate} endDate={endDate} />
          ) : (
            <div className="bg-[#2A2A2A] border border-gray-700 rounded-full px-4 py-2 flex items-center justify-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                <CalendarIcon />
              </div>
              <span className="text-gray-300 text-sm leading-none">{duration}</span>
            </div>
          )}

          <div className="bg-[#2A2A2A] border border-gray-700 rounded-full px-4 py-2 flex items-center justify-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <StepsIcon />
            </div>
            <span className="text-gray-300 text-sm leading-none">{steps}</span>
          </div>
        </div>

        {/* Prize pool and participants */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Prize pool */}
          <div className="bg-[#2A2A2A] rounded-xl p-4">
            <p className="text-gray-400 text-xs font-medium mb-2">PRIZE POOL</p>
            <div className="flex justify-center items-center gap-2">
              <span className="text-white text-xl font-semibold">
                {totalPrizePool} USDC
              </span>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-[#2A2A2A] rounded-xl p-4">
            <p className="text-gray-400 text-xs font-medium mb-2">PARTICIPANTS </p>
            <div className="flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{participants}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component for better performance
export const ChallengeCard = memo(ChallengeCardComponent);

export default ChallengeCard;
