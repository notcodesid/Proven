import React from 'react';

export interface ChallengeCardProps {
  id: string;
  title: string;
  image: string;
  metrics?: string;
  hostType: string;
  sponsor?: string;
  creator?: string;
  duration: string;
  participants: number;
  userStake: number;
  totalPrizePool: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  id,
  title,
  image,
  metrics,
  hostType,
  sponsor,
  creator,
  duration,
  participants,
  userStake,
  totalPrizePool,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${
        isSelected ? 'bg-[#252329] ring-2 ring-red-500' : 'bg-[#1C1C1E]'
      }`}
      onClick={() => onSelect(id)}
    >
      <div
        className="relative h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-0 left-0 p-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {metrics && (
            <span className="text-sm text-white opacity-90">{metrics}</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {/* <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            {hostType === 'ORG' ? '🏢' : '👥'}
            {hostType === 'ORG'
              ? `Sponsored by ${sponsor}`
              : `Created by ${creator}`}
          </span>
        </div> */}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span>📅</span>
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>👥</span>
            <span>{participants} participants</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>💰</span>
            <span>Stake: {userStake} PROVEN</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>🏆</span>
            <span>Prize: {totalPrizePool} PROVEN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
