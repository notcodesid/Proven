"use client";

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const { connected } = useWallet();

  // Auto-proceed when wallet connects
  React.useEffect(() => {
    if (connected && isOpen) {
      setTimeout(() => {
        onConnected();
      }, 500);
    }
  }, [connected, isOpen, onConnected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to Proven! 🎉
          </h2>
          <p className="text-gray-400 mb-6">
            Connect your Solana wallet to start joining challenges and earning rewards on the blockchain
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Secure & Transparent</p>
                <p className="text-xs text-gray-400">All stakes and rewards are managed on-chain</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">You Own Your Assets</p>
                <p className="text-xs text-gray-400">Only you control your wallet and funds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Fast Transactions</p>
                <p className="text-xs text-gray-400">Join challenges and claim rewards instantly</p>
              </div>
            </div>
          </div>

          {/* Wallet Connect Button */}
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-gradient-to-r !from-[#FF5757] !to-[#FF7F50] hover:!opacity-90 !transition-opacity !rounded-lg !font-semibold" />
          </div>

          {/* Skip Button */}
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Skip for now, I&apos;ll explore first
          </button>

          {/* Help Text */}
          <div className="pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Don&apos;t have a wallet?{' '}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Get Phantom Wallet
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
