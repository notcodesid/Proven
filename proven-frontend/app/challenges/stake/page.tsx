'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from "../../../hooks/useAuth";
import { useWallet } from "@solana/wallet-adapter-react";
import { IoArrowBack, IoWalletOutline } from 'react-icons/io5';
import { fetchChallenges } from '../../../src/services/challengeService';
import { Challenge } from '../../../src/types/challenge';
import { ChallengeStats } from '../../../src/components/ui/ChallengeStats';
import ChallengeInfoCard from '../../../src/components/ui/ChallengeInfoCard';
import { ConnectWallet } from "../../../components/connectwallet";
import { StakeForm } from "../../../components/StakeForm";

function StakePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('id');
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const wallet = useWallet();
  
  // State management
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load challenge data
  useEffect(() => {
    const loadChallenge = async () => {
      if (!challengeId) {
        setError('No challenge ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const challenges = await fetchChallenges();
        const found = challenges.find(c => c.id === challengeId);
        
        if (found) {
          setChallenge(found);
        } else {
          setError('Challenge not found');
        }
      } catch (err) {
        setError('Failed to load challenge details');
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, [challengeId]);

  const handleBackClick = () => {
    router.back();
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse text-white">Loading challenge details...</div>
      </div>
    );
  }

  // Error state
  if (error && !challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <p className="text-lg text-red-400 mb-4">{error}</p>
        <button
          onClick={handleBackClick}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
        <div className="p-4 flex items-center">
          <button 
            onClick={handleBackClick}
            className="p-2 rounded-full bg-gray-800 mr-4 hover:bg-gray-700 transition-colors"
            aria-label="Go back"
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-xl font-bold">Join Challenge</h1>
        </div>
      </header>
      
      {/* Challenge content */}
      {challenge && (
        <div className="p-4 max-w-2xl mx-auto">
          {/* Challenge header */}
          <div style={{ backgroundColor: '#18181a' }} className="rounded-lg p-4 mb-6 shadow-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                {challenge.image && (
                  <Image
                    src={challenge.image}
                    alt={challenge.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="ml-4">
                <h2 className="font-bold text-lg">{challenge.title}</h2>
                <p className="text-sm text-gray-400">{challenge.metrics}</p>
              </div>
            </div>
            
            {/* Challenge stats */}
            <ChallengeStats 
              duration={challenge.duration}
              participants={challenge.participants}
              userStake={challenge.userStake}
              totalPrizePool={challenge.totalPrizePool}
            />
          </div>
          
          {/* Stake and Prize information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Stake information */}
            <div style={{ backgroundColor: '#252329' }} className="p-4 rounded-lg shadow-md border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Your Stake</p>
              <div className="flex items-center">
                <IoWalletOutline size={20} className="text-yellow-400 mr-2" />
                <p className="font-semibold text-yellow-400 text-lg">{challenge.userStake} USD</p>
              </div>
            </div>
            
            {/* Prize pool information */}
            <div style={{ backgroundColor: '#252329' }} className="p-4 rounded-lg shadow-md border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Prize Pool</p>
              <div className="flex items-center">
                <IoWalletOutline size={20} className="text-yellow-400 mr-2" />
                <p className="font-semibold text-yellow-400 text-lg">{challenge.totalPrizePool} USD</p>
              </div>
            </div>
          </div>
          
          {/* Wallet connection prompt */}
          {!wallet.connected && (
            <div className="mb-6 p-5 rounded-lg flex flex-col items-center shadow-lg" 
                 style={{ backgroundColor: '#252329', borderLeft: '4px solid #FF5757' }}>
              <p className="text-center mb-3 font-medium" style={{ color: '#c4c2c9' }}>
                Connect your wallet to join this challenge
              </p>
              <ConnectWallet 
                fullWidth={true}
                darkMode={true}
                customClassName="py-3 text-base"
                withProviders={true}
              />
            </div>
          )}
          
          {/* Stake Form */}
          <StakeForm 
            stakeAmount={1} 
            challengeId={challengeId || undefined}
          />
          
          {/* Status messages */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {/* Challenge details */}
          <ChallengeInfoCard challenge={challenge} />
        </div>
      )}
    </div>
  );
}

export default function StakePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="text-white">Loading...</div></div>}>
      <StakePageInner />
    </Suspense>
  );
}