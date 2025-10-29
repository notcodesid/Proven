"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchChallengeById } from '../../../src/services/challengeService';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Challenge } from '../../../src/types/challenge';
import { IoArrowBack } from 'react-icons/io5';
import { ChallengeStats } from '../../../src/components/ui/ChallengeStats';
import ChallengeInfoCard from '../../../src/components/ui/ChallengeInfoCard';
import { DailyProofCalendar, ProofUploadModal, ChallengeDetailSkeleton, CalendarSkeleton, ChallengeDetailPreJoinSkeleton } from '../../../src/components/ui';
import {
  checkUserChallengeStatus,
  getChallengeCalendar,
  submitDailyProof,
  ChallengeCalendar
} from '../../../src/services/proofService';
import { ChallengeTimeline, StatusBadge } from '../../../src/components/ui/ChallengeTimeline';
import { JoinChallengeModal } from '../../../src/components/ui/JoinChallengeModal';

export default function ChallengeDetail() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const params = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Proof submission states
  const [hasJoined, setHasJoined] = useState(false);
  const [calendarData, setCalendarData] = useState<ChallengeCalendar | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Prevent duplicate calls in React Strict Mode
  const loadingRef = React.useRef(false);

  useEffect(() => {
    const loadChallengeData = async () => {
      // Guard: prevent duplicate calls
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        setLoading(true);
        setError(null);

        if (!params.id || typeof params.id !== 'string') {
          setError('Invalid challenge ID');
          return;
        }

        // ✅ OPTIMIZATION: Parallelize independent API calls
        const [challengeData, userStatus] = await Promise.allSettled([
          fetchChallengeById(params.id),
          checkUserChallengeStatus(params.id)
        ]);

        // Handle challenge data
        if (challengeData.status === 'fulfilled') {
          setChallenge(challengeData.value);
        } else {
          throw challengeData.reason;
        }

        // Handle user status (non-fatal if fails)
        if (userStatus.status === 'fulfilled' && userStatus.value.hasJoined) {
          setHasJoined(true);

          // Load calendar data only if user has joined
          try {
            setLoadingCalendar(true);
            const calendar = await getChallengeCalendar(params.id);
            setCalendarData(calendar);
          } catch (calendarError) {
            // Calendar load error handled by fallback UI
          } finally {
            setLoadingCalendar(false);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load challenge details');
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadChallengeData();
  }, [params.id]);

  const handleBackClick = () => {
    router.back();
  };

  const handleJoinClick = () => {
    if (!challenge) {
      console.error('No challenge data available');
      return;
    }

    console.log('Join button clicked. Challenge:', challenge);
    console.log('Escrow address:', challenge.escrowAddress || 'Not set (V1 mode)');

    setShowJoinModal(true);
  };

  const handleJoinSuccess = async () => {
    // Reload challenge data after successful join
    setHasJoined(true);

    try {
      setLoadingCalendar(true);
      if (challenge?.id) {
        const calendar = await getChallengeCalendar(challenge.id);
        setCalendarData(calendar);
      }
    } catch (calendarError) {
      console.error('Failed to load calendar:', calendarError);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleUploadProof = (date: string) => {
    setSelectedDate(date);
    setShowUploadModal(true);
  };

  const handleProofSubmit = async (imageUrl: string, description?: string) => {
    if (!calendarData?.userChallenge?.id) {
      return { success: false, message: 'User challenge not found. Please join the challenge first.' };
    }
    
    return await submitDailyProof(calendarData.userChallenge.id, imageUrl, description);
  };

  const handleProofSubmitSuccess = async () => {
    // Reload calendar data after successful submission
    if (challenge?.id) {
      try {
        setLoadingCalendar(true);
        const calendar = await getChallengeCalendar(challenge.id);
        setCalendarData(calendar);
      } catch (error) {
      } finally {
        setLoadingCalendar(false);
      }
    }
  };

  if (loading) {
    return hasJoined ? <ChallengeDetailSkeleton /> : <ChallengeDetailPreJoinSkeleton />;
  }

  if (error || !challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <p className="text-lg text-red-400 mb-4">{error || 'Challenge not found'}</p>
        <button
          onClick={handleBackClick}
          className="px-4 py-2 bg-gray-800 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Challenge Header - Simplified */}
      <div className="relative h-64">
        <Image
          src={challenge.image}
          alt={challenge.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80" />
        
        <button 
          onClick={handleBackClick}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50"
        >
          <IoArrowBack size={24} />
        </button>
        
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>

          {/* Timeline Display */}
          {challenge.startDate && challenge.endDate && (
            <div className="mb-2">
              <StatusBadge startDate={challenge.startDate} endDate={challenge.endDate} />
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm opacity-80">
            <span>{challenge.metrics}</span>
            {challenge.hostType && (
              <>
                <span>•</span>
                <span>
                  {challenge.hostType === 'ORG'
                    ? `Sponsored by ${challenge.sponsor}`
                    : `Created by ${challenge.creator?.name || 'Unknown'}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Challenge details */}
      <div className="p-4 space-y-6">
        {/* Timeline Card */}
        {challenge.startDate && challenge.endDate && (
          <div className="bg-[#1C1C1E] p-4 rounded-xl">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Challenge Timeline</h3>
            <ChallengeTimeline
              startDate={challenge.startDate}
              endDate={challenge.endDate}
              variant="full"
              showStatus={true}
            />
          </div>
        )}

        {/* Stats */}
        <ChallengeStats
          duration={challenge.duration}
          participants={challenge.participants}
          userStake={challenge.userStake}
          totalPrizePool={challenge.totalPrizePool}
        />
        
        {/* Show proof calendar if user has joined, otherwise show challenge info */}
        {hasJoined && calendarData ? (
          <div className="space-y-6">
            {/* Challenge Progress Header */}
            <div className="bg-[#1C1C1E] p-4 rounded-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Your Progress</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-xl font-bold text-green-400">{calendarData.statistics.completionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Days Submitted</p>
                  <p className="text-xl font-bold text-white">
                    {calendarData.statistics.submittedDays} / {calendarData.statistics.totalDays}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Daily Proof Calendar */}
            {loadingCalendar ? (
              <div className="mt-4"><CalendarSkeleton /></div>
            ) : (
              <DailyProofCalendar 
                calendar={calendarData.calendar}
                onUploadProof={handleUploadProof}
                isLoading={loadingCalendar}
              />
            )}
          </div>
        ) : (
          /* Challenge info - for users who haven't joined yet */
          <ChallengeInfoCard challenge={challenge} />
        )}
      </div>
      
      {/* Fixed join button - only show if user hasn't joined */}
      {!hasJoined && challenge && (
        <div className="fixed bottom-16 inset-x-0 mx-auto max-w-[450px] p-4 z-50">
          <button
            onClick={handleJoinClick}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #FF5757, #FF7F50)',
              color: '#FFFFFF'
            }}
          >
            Join Challenge
          </button>
        </div>
      )}

      {/* Join Challenge Modal */}
      {challenge && (
        <JoinChallengeModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
          challenge={{
            id: challenge.id,
            title: challenge.title,
            stakeAmount: challenge.stakeAmount || challenge.userStake,
            escrowAddress: challenge.escrowAddress,
            tokenType: challenge.tokenType || 'USDC'
          }}
        />
      )}

      {/* Proof Upload Modal */}
      <ProofUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        challengeId={challenge?.id || ''}
        challengeTitle={challenge?.title || ''}
        date={selectedDate}
        onSubmitSuccess={handleProofSubmitSuccess}
        onSubmit={handleProofSubmit}
      />
    </div>
  );
} 