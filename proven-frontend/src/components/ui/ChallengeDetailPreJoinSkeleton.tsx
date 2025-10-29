"use client";

import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-[#2A2A2A] rounded ${className}`} />
);

export const ChallengeDetailPreJoinSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-pulse">
      {/* Header image */}
      <div className="relative h-64 bg-[#1C1C1E]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Shimmer className="h-8 w-2/3" />
          <Shimmer className="h-4 w-1/3" />
        </div>
        <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40" />
      </div>

      <div className="p-4 space-y-6">
        {/* Stat cards (2x2) */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1C1C1E] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#2A2A2A]" />
                <Shimmer className="h-4 w-24" />
              </div>
              <Shimmer className="h-6 w-28" />
            </div>
          ))}
        </div>

        {/* Challenge Details card skeleton */}
        <div className="bg-[#1C1C1E] rounded-xl p-4 space-y-4">
          <Shimmer className="h-5 w-40" />
          <div className="space-y-2">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-5/6" />
            <Shimmer className="h-4 w-4/6" />
          </div>
          <div className="space-y-2 mt-2">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-1/2" />
            <Shimmer className="h-4 w-1/3" />
          </div>
        </div>
      </div>

      {/* Join button skeleton */}
      <div className="fixed bottom-16 inset-x-0 mx-auto max-w-[450px] p-4 z-20">
        <div className="h-12 rounded-lg bg-[#2A2A2A]" />
      </div>
    </div>
  );
};

export default ChallengeDetailPreJoinSkeleton;


