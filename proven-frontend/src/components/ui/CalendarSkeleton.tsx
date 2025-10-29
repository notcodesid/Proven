"use client";

import React from 'react';

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-[#2A2A2A] rounded" />
        <div className="h-4 w-24 bg-[#2A2A2A] rounded" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`h-${i}`} className="h-4 w-10 bg-[#2A2A2A] rounded mx-auto" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`c-${i}`} className="aspect-square rounded-lg border-2 border-[#2A2A2A] bg-[#1A1A1A]" />
        ))}
      </div>
    </div>
  );
};

export default CalendarSkeleton;


