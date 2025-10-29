"use client";

import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-[#2A2A2A] rounded ${className}`} />
);

export const ChallengeDetailSkeleton: React.FC = () => {
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

        {/* Your Progress card */}
        <div className="bg-[#1C1C1E] rounded-xl p-4">
          <Shimmer className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Shimmer className="h-4 w-28 mb-2" />
              <Shimmer className="h-6 w-16" />
            </div>
            <div>
              <Shimmer className="h-4 w-28 mb-2" />
              <Shimmer className="h-6 w-24" />
            </div>
          </div>
        </div>

        {/* Calendar header */}
        <div className="flex items-center justify-between">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-4 w-24" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Shimmer key={i} className="h-4 w-10 mx-auto" />
          ))}
          {/* Calendar squares (5 weeks) */}
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg border-2 border-[#2A2A2A] bg-[#1A1A1A]" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailSkeleton;


