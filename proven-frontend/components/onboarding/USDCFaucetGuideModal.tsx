"use client";

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface USDCFaucetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const USDCFaucetGuideModal: React.FC<USDCFaucetGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Get Free USDC 💰
          </h2>
          <p className="text-gray-400">
            You&apos;ll need USDC to join challenges. Here&apos;s how to get it for free on devnet!
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-6">
          {/* Your Wallet Address */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-400 mb-2">YOUR WALLET ADDRESS</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-white font-mono bg-black/50 px-3 py-2 rounded overflow-x-auto">
                {publicKey?.toBase58() || 'Not connected'}
              </code>
              <button
                onClick={handleCopyAddress}
                className="flex-shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm font-medium"
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Follow these steps:
            </h3>

            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5757] to-[#FF7F50] flex items-center justify-center font-bold text-white">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Visit Circle&apos;s USDC Faucet</p>
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  https://faucet.circle.com
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5757] to-[#FF7F50] flex items-center justify-center font-bold text-white">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Paste your wallet address</p>
                <p className="text-sm text-gray-400">
                  Copy your address above and paste it into the faucet website
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5757] to-[#FF7F50] flex items-center justify-center font-bold text-white">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Get your USDC instantly</p>
                <p className="text-sm text-gray-400">
                  You&apos;ll receive free devnet USDC in seconds
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#FF5757] to-[#FF7F50] flex items-center justify-center font-bold text-white">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Come back and join challenges!</p>
                <p className="text-sm text-gray-400">
                  You&apos;re all set to start your journey
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-400 mb-1">What is Devnet USDC?</p>
                <p className="text-xs text-gray-400">
                  This is test USDC on Solana&apos;s devnet (development network). It has no real value and is only used for testing. Perfect for trying out challenges risk-free!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-gradient-to-r from-[#FF5757] to-[#FF7F50] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-center"
            >
              Get USDC Now
            </a>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              I&apos;ll Do This Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
