import React from 'react';

export interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-black text-white">
      <p className="text-lg text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-[#FF5757] text-white rounded-md hover:bg-[#FF5757]/80"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
