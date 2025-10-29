import React from 'react';
import { IoCalendarOutline, IoStatsChartOutline, IoWalletOutline, IoPeopleOutline } from 'react-icons/io5';

export interface ChallengeStatsProps {
  duration: string;
  participants: number;
  userStake: number | string;
  totalPrizePool: number | string;
}

export function ChallengeStats({ 
  duration, 
  participants, 
  userStake, 
  totalPrizePool 
}: ChallengeStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#1C1C1E] p-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <IoCalendarOutline size={20} className="text-gray-400" />
          <span className="text-gray-400">Duration</span>
        </div>
        <p className="text-xl font-semibold">{duration}</p>
      </div>
      
      <div className="bg-[#1C1C1E] p-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <IoPeopleOutline size={20} className="text-gray-400" />
          <span className="text-gray-400">Participants</span>
        </div>
        <p className="text-xl font-semibold">{participants}</p>
      </div>
      
      <div className="bg-[#1C1C1E] p-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <IoWalletOutline size={20} className="text-gray-400" />
          <span className="text-gray-400">Stake</span>
        </div>
        <p className="text-xl font-semibold">{userStake} PROVEN</p>
      </div>
      
      <div className="bg-[#1C1C1E] p-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <IoStatsChartOutline size={20} className="text-gray-400" />
          <span className="text-gray-400">Prize Pool</span>
        </div>
        <p className="text-xl font-semibold">{totalPrizePool} PROVEN</p>
      </div>
    </div>
  );
}
