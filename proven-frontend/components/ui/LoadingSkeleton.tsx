import React from 'react';

export interface LoadingSkeletonProps {
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="flex items-center justify-center bg-black">
      <div className="animate-pulse space-y-4 w-full max-w-4xl p-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-[#1C1C1E]">
            <div className="h-48 bg-[#2A2A2A]" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-[#2A2A2A] rounded w-1/3" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-[#2A2A2A] rounded" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
