"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IoTrophyOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { getUserActiveChallenges, getUserCompletedChallenges, UserChallenge } from '../../src/services/userChallenge';
import { useAuth } from '../../hooks/useAuth';
import { ChallengeListItem } from '../../src/components/ui/ChallengeListItem';
import { ChallengeTabNavigation } from '../../src/components/ui/ChallengeTabNavigation';
import { EmptyStateDisplay } from '../../src/components/ui/EmptyStateDisplay';
import { LoadingSkeleton } from '../../src/components/ui/LoadingSkeleton';

export default function ChallengesScreen() {
  const [activeTab, setActiveTab] = useState('active');
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<UserChallenge[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [errorActive, setErrorActive] = useState<string | null>(null);
  const [errorCompleted, setErrorCompleted] = useState<string | null>(null);
  const [completedFetched, setCompletedFetched] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const getHeaderText = () => {
    switch(activeTab) {
      case 'active':
        return { title: 'My Challenges', subtitle: 'Track your ongoing challenges' };
      case 'completed':
        return { title: 'Completed Challenges', subtitle: 'View your past victories' };
      default:
        return { title: 'My Challenges', subtitle: 'Track your ongoing challenges' };
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadActiveChallenges(user.id);
    } else {
      setLoadingActive(false);
    }
  }, [isAuthenticated, user]);

  const loadActiveChallenges = async (userId: string) => {
    try {
      setLoadingActive(true);
      setErrorActive(null);
      const active = await getUserActiveChallenges(userId);
      setActiveChallenges(active);
    } catch (err) {
      setErrorActive('An error occurred while fetching active challenges');
    } finally {
      setLoadingActive(false);
    }
  };

  const loadCompletedChallenges = async (userId: string) => {
    try {
      setLoadingCompleted(true);
      setErrorCompleted(null);
      const completed = await getUserCompletedChallenges(userId);
      setCompletedChallenges(completed);
      setCompletedFetched(true);
    } catch (err) {
      setErrorCompleted('An error occurred while fetching completed challenges');
    } finally {
      setLoadingCompleted(false);
    }
  };

  // ✅ OPTIMIZATION: Memoize callbacks to prevent unnecessary re-renders
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'completed' && user && !completedFetched) {
      void loadCompletedChallenges(user.id);
    }
  }, [user, completedFetched]);

  const handleChallengeClick = useCallback((challengeId: string) => {
    router.push(`/challenges/${challengeId}`);
  }, [router]);

  const handleExploreClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleRetryClick = useCallback(() => {
    if (!user) return;
    if (activeTab === 'active') {
      void loadActiveChallenges(user.id);
    } else {
      void loadCompletedChallenges(user.id);
    }
  }, [user, activeTab]);

  // Map user challenges to the format expected by ChallengeListItem
  const mapChallenges = (challenges: UserChallenge[]) => {
    return challenges.map(item => ({
      id: item.id,
      challengeId: item.challengeId,
      title: item.challenge.title,
      image: item.challenge.image,
      type: item.challenge.type,
      difficulty: item.challenge.difficulty,
      progress: item.progress,
      totalPrizePool: item.challenge.totalPrizePool
    }));
  };

  // Render the appropriate content based on loading state and data
  const renderContent = () => {
    const challenges = activeTab === 'active' ? activeChallenges : completedChallenges;
    const isLoading = activeTab === 'active' ? loadingActive : loadingCompleted;
    const error = activeTab === 'active' ? errorActive : errorCompleted;

    if (isLoading) {
      return <LoadingSkeleton count={4} />;
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col justify-center items-center p-5">
          <div className="mb-5">
            <IoAlertCircleOutline size={80} className="text-[#8a8891]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#c4c2c9]">
            Error Loading Challenges
          </h3>
          <p className="text-center mb-8 text-[#8a8891]">
            {error}
          </p>
          <button 
            onClick={handleRetryClick}
            className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-[#FF5757] to-[#FF7F50] text-white"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (challenges.length === 0) {
      return (
        <EmptyStateDisplay
          icon={<IoTrophyOutline size={80} className="text-white" />}
          title={`No ${activeTab === 'active' ? 'Active' : 'Completed'} Challenges`}
          message={activeTab === 'active' 
            ? "You haven't joined any challenges yet. Explore and join challenges to stay accountable." 
            : "You don't have any completed challenges yet. Complete your active challenges to see them here."}
          actionButton={activeTab === 'active' ? {
            label: "Explore Challenges",
            onClick: handleExploreClick
          } : undefined}
        />
      );
    }

    // Inline the ChallengeList component functionality
    const mappedChallenges = mapChallenges(challenges);
    return (
      <div className="flex-1 overflow-auto">
        {mappedChallenges.map((item) => (
          <ChallengeListItem
            key={item.id}
            {...item}
            isCompleted={activeTab === 'completed'}
            onClick={handleChallengeClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121214]">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2 text-white">{getHeaderText().title}</h1>
        <p className="text-[#6B7280]">{getHeaderText().subtitle}</p>
      </div>
      
      <ChallengeTabNavigation 
        tabs={[
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}
