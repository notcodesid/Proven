import React from 'react';
import Image from 'next/image';
import { IoCheckmarkCircle, IoWalletOutline } from 'react-icons/io5';

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

export const ChallengeListItem: React.FC<ChallengeListItemProps> = ({
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
  return (
    <div 
      className="flex p-4 cursor-pointer transition-colors hover:bg-[#252329]"
      style={{
        borderBottomWidth: '1px',
        borderBottomColor: '#333333',
        backgroundColor: '#18181a'
      }}
      onClick={() => onClick(challengeId)}
    >
      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        {isCompleted && (
          <div className="absolute top-1 right-1 rounded-full p-1" 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <IoCheckmarkCircle size={24} className="text-green-500" />
          </div>
        )}
      </div>
      <div className="flex-1 ml-4">
        <h3 className="text-lg font-bold mb-1" style={{ color: '#c4c2c9' }}>
          {title}
        </h3>
        <p className="text-sm mb-3" style={{ color: '#8a8891' }}>
          {type} • {difficulty}
        </p>
        <div className="h-2 rounded-full mb-2" style={{ backgroundColor: '#252329' }}>
          <div 
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: isCompleted 
                ? '#4CAF50'
                : 'linear-gradient(to right, #FF5757, #FF7F50)'
            }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: '#8a8891' }} className="text-sm">
            {Math.round(progress * 100)}% complete
          </span>
          <div className="flex items-center">
            <IoWalletOutline size={14} className="text-yellow-400" />
            <span className="font-bold text-sm ml-1 text-yellow-400">
              {totalPrizePool} LOCKIN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeListItem;
