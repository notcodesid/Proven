import React from 'react';

export interface ChallengeJoinModalProps {
  title: string;
  stakeAmount: number | string;
  error: string | null;
  joining: boolean;
  joinSuccess: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChallengeJoinModal({
  title,
  stakeAmount,
  error,
  joining,
  joinSuccess,
  onCancel,
  onConfirm
}: ChallengeJoinModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="bg-[#1C1C1E] p-6 rounded-xl w-[90%] max-w-sm">
        {joinSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Challenge Joined!</h3>
            <p className="text-gray-300 mb-4">You&apos;ve successfully joined the challenge. Good luck!</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4">Join {title}</h3>
            <p className="mb-6 text-gray-300">
              You&apos;re about to stake <span className="text-yellow-400 font-bold">{stakeAmount} LOCKIN</span> to join this challenge.
              This amount will be returned to you along with rewards if you successfully complete the challenge.
            </p>
            
            {error && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-800 rounded-lg font-medium"
                disabled={joining}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{
                  background: 'linear-gradient(to right, #FF5757, #FF7F50)',
                  color: '#FFFFFF'
                }}
                disabled={joining}
              >
                {joining ? 'Processing...' : 'Confirm & Join'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
