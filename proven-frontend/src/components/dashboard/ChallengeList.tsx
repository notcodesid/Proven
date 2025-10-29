import React, { memo } from 'react';
import { Challenge } from '../../types/challenge';
import { ChallengeCard } from '../ui/ChallengeCard';

interface ChallengeListProps {
  challenges: Challenge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Memoized list of challenge cards
 */
const ChallengeListComponent: React.FC<ChallengeListProps> = ({
  challenges,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="flex flex-col gap-10 p-4 pt-6">
      {challenges.map((item) => (
        <ChallengeCard
          key={item.id}
          id={item.id}
          title={item.title}
          image={item.image}
          category={item.category || item.metrics || 'Tech'}
          hostType={item.hostType}
          sponsor={item.sponsor}
          duration={item.duration}
          participants={item.participants}
          userStake={item.userStake}
          totalPrizePool={item.totalPrizePool}
          steps={item.steps || 'Steps'}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
          startDate={item.startDate}
          endDate={item.endDate}
        />
      ))}
      {/* Bottom spacing for floating buttons */}
      <div className="h-[7rem]" aria-hidden="true" />
    </div>
  );
};

export const ChallengeList = memo(ChallengeListComponent);
