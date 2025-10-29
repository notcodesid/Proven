"use client"
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

// Custom hooks
import { useChallenges } from '../../src/hooks/useChallenges';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { useChallengeFilters } from '../../src/hooks/useChallengeFilters';
import { useAdminAccess } from '../../src/hooks/useAdminAccess';

// UI components
import { LoadingSkeleton } from '../../src/components/ui/LoadingSkeleton';
import { ErrorDisplay } from '../../src/components/ui/ErrorDisplay';
import { ActionButton } from '../../src/components/ui/ActionButton';
import { ProfileGreeting } from '../../src/components/ui/ProfileGreeting';
import { CreateChallengeModal } from '../../src/components/ui/CreateChallengeModal';
import { ConnectWallet } from '../../components/connectwallet';

// Dashboard-specific components
// import { FilterPanel } from '../../src/components/dashboard/FilterPanel';
import { AdminFloatingButton } from '../../src/components/dashboard/AdminFloatingButton';
import { ChallengeList } from '../../src/components/dashboard/ChallengeList';
import { DashboardEmptyState } from '../../src/components/dashboard/DashboardEmptyState';

// Onboarding components
import { WalletConnectionModal } from '../../components/onboarding/WalletConnectionModal';
import { USDCFaucetGuideModal } from '../../components/onboarding/USDCFaucetGuideModal';

// Constants and types
import { COLORS, Z_INDEX } from '../../src/constants/dashboard';
import { SortOption, CategoryValue } from '../../src/types/dashboard';

/**
 * Dashboard page component
 * Displays challenges with filtering, sorting, and admin functionality
 */
const Dashboard = () => {
  // State
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Onboarding states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showFaucetModal, setShowFaucetModal] = useState(false);

  // Router
  const router = useRouter();

  // Wallet
  const { connected } = useWallet();

  // Custom hooks
  const { challenges, loading: challengesLoading, error: challengesError, refetch } = useChallenges();
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    searchValue,
    category,
    sortBy,
    filterActive,
    filteredChallenges,
    setSearchValue,
    setCategory,
    setSortBy,
    setFilterActive,
  } = useChallengeFilters(challenges);
  const isAdmin = useAdminAccess(profile?.isAdmin);

  // Handlers - memoized to prevent unnecessary re-renders
  const handleSelect = useCallback((id: string) => {
    setSelectedChallenge((prev) => (prev === id ? null : id));
  }, []);

  const handleReadMore = useCallback(() => {
    if (selectedChallenge) {
      router.push(`/challenges/${selectedChallenge}`);
    }
  }, [selectedChallenge, router]);

  const handleCreateChallenge = useCallback(() => {
    if (!isAdmin) {
      return;
    }
    setShowCreateModal(true);
  }, [isAdmin]);

  const handleCreateSuccess = useCallback(async () => {
    try {
      await refetch();
    } catch (err) {
      // Silently handle refresh error - UI will show existing data
    }
  }, [refetch]);

  const handleCloseFilter = useCallback(() => {
    setFilterActive(false);
  }, [setFilterActive]);

  const handleResetFilters = useCallback(() => {
    setSearchValue('');
    setCategory('all');
    setSortBy('recent');
  }, [setSearchValue, setCategory, setSortBy]);

  const handleCategoryChange = useCallback((value: CategoryValue) => {
    setCategory(value);
  }, [setCategory]);

  // Onboarding logic - Show wallet modal on first visit
  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const hasSeenWalletModal = localStorage.getItem('hasSeenWalletModal');

    if (!hasSeenOnboarding && !hasSeenWalletModal && !connected) {
      // Show wallet modal after a short delay
      const timer = setTimeout(() => {
        setShowWalletModal(true);
        localStorage.setItem('hasSeenWalletModal', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [connected]);

  // Show faucet modal after wallet connects
  const handleWalletConnected = useCallback(() => {
    setShowWalletModal(false);

    // Check if user has seen faucet guide
    const hasSeenFaucetGuide = localStorage.getItem('hasSeenFaucetGuide');

    if (!hasSeenFaucetGuide) {
      // Show faucet modal after wallet modal closes
      setTimeout(() => {
        setShowFaucetModal(true);
        localStorage.setItem('hasSeenFaucetGuide', 'true');
        localStorage.setItem('hasSeenOnboarding', 'true');
      }, 500);
    }
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, [setSortBy]);

  // Derived state
  const hasActiveFilters = useMemo(
    () => searchValue.trim() !== '' || category !== 'all' || sortBy !== 'recent',
    [searchValue, category, sortBy]
  );

  const loading = challengesLoading || profileLoading;

  // Loading state
  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  // Error state
  if (challengesError) {
    return <ErrorDisplay message={challengesError} onRetry={() => window.location.reload()} />;
  }

  return (
    <>
      <div className="relative flex flex-col bg-[#121214] text-white w-full h-full">

        {/* Header with profile greeting and admin badge */}
        <header className="flex justify-between items-center p-4 mt-3 relative">
          <div className="flex items-center gap-3">
            <ProfileGreeting
              name={profile?.name || "User"}
              avatarSrc={profile?.image || undefined}
            />
            {isAdmin && (
              <div
                className="bg-[#FF5757] text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg"
                role="status"
                aria-label="Admin user"
              >
                ADMIN
              </div>
            )}
          </div>

          {/* Wallet Connect on the right */}
          <div className="flex items-center">
            <ConnectWallet darkMode={true} />
          </div>
        </header>

        {/* Filter Panel */}
        {/* <FilterPanel
          isOpen={filterActive}
          category={category}
          sortBy={sortBy}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          onClose={handleCloseFilter}
        /> */}

        {/* Main content */}
        <main>
          {filteredChallenges.length === 0 ? (
            <DashboardEmptyState
              hasFilters={hasActiveFilters}
              onReset={handleResetFilters}
            />
          ) : (
            <ChallengeList
              challenges={filteredChallenges}
              selectedId={selectedChallenge}
              onSelect={handleSelect}
            />
          )}
        </main>

        {/* Admin floating button */}
        {isAdmin && (
          <AdminFloatingButton onClick={handleCreateChallenge} />
        )}
      </div>

      {/* Read More button that appears when a challenge is selected */}
      {selectedChallenge && (
        <div
          className="fixed bottom-24 left-0 right-0 max-w-[450px] mx-auto px-4"
          style={{ zIndex: Z_INDEX.readMoreButton }}
        >
          <ActionButton
            onClick={handleReadMore}
            label="Read More"
            position="static"
            gradient={true}
          />
        </div>
      )}

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Onboarding Modals */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnected={handleWalletConnected}
      />

      <USDCFaucetGuideModal
        isOpen={showFaucetModal}
        onClose={() => setShowFaucetModal(false)}
      />
    </>
  );
};

export default Dashboard;
