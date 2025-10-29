import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import { IoCheckmarkCircle } from 'react-icons/io5';

export interface ChallengeListItemProps {
  id: string;
  challengeId: string;
  title: string;
  image: string;
  type: string;
  difficulty: string;
  progress: number;
  totalPrizePool: number;
  isCompleted?: boolean;
  onClick: (challengeId: string) => void;
}

/**
 * ✅ OPTIMIZATION: Memoized challenge list item to prevent unnecessary re-renders
 */
const ChallengeListItemComponent: React.FC<ChallengeListItemProps> = ({
  id,
  challengeId,
  title,
  image,
  type,
  difficulty,
  progress,
  totalPrizePool,
  isCompleted = false,
  onClick,
}) => {
  // Memoize the click handler to prevent creating new function on each render
  const handleClick = useCallback(() => {
    onClick(challengeId);
  }, [onClick, challengeId]);
  return (
    <div
      className="flex p-6 cursor-pointer transition-colors hover:bg-[#252329] bg-[#18181a] border-2 border-[#27272A] m-3 rounded-lg"
      onClick={handleClick}
    >
      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 ml-4">
        <h3 className="text-lg font-bold mb-1 text-[#c4c2c9]">
          {title}
        </h3>
        <p className="text-sm mb-3 text-[#8a8891]">
          {type} • {difficulty}
        </p>
        <div className="h-2 rounded-full mb-2 bg-[#252329]">
          <div 
            className={`h-full rounded-full ${
              isCompleted 
                ? 'bg-[#4CAF50]'
                : 'bg-gradient-to-r from-[#FF5757] to-[#FF7F50]'
            }`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#8a8891] text-sm">
            {Math.round(Math.min(Math.max(progress, 0), 100))}% complete
          </span>
          <div className="flex items-center">
            <span className="font-bold text-sm ml-1 text-[#FF5837] flex flex-row">
              {totalPrizePool} USDC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export memoized version to prevent re-renders when parent updates
export const ChallengeListItem = memo(ChallengeListItemComponent);

export default ChallengeListItem;
