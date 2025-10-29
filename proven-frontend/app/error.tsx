"use client";
import React from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-4">{error.message || 'Unexpected error'}</p>
        <button onClick={() => reset()} className="px-4 py-2 bg-[#FF5757] rounded">Try again</button>
      </div>
    </div>
  );
}




