"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { useUserProfile } from "../../../src/hooks/useUserProfile";
import { useAdminAccess } from "../../../src/hooks/useAdminAccess";
import { fetchChallenges } from "../../../src/services/challenge/fetchChallenges";
import type { Challenge } from "../../../src/types/challenge";
import { LoadingSkeleton } from "../../../src/components/ui/LoadingSkeleton";
import {
  completeChallenge,
  runChallengePayouts,
  fetchChallengeResults,
  type ChallengeResultData,
} from "../../../src/services/admin/challengeSettlementService";

function formatDate(value?: string | Date): string {
  if (!value) return "Unknown";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function hasChallengeEnded(challenge?: Challenge | null): boolean {
  if (!challenge?.endDate) return false;
  const end = new Date(challenge.endDate);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() <= Date.now();
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [results, setResults] = useState<ChallengeResultData | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [completionThreshold, setCompletionThreshold] = useState<number>(80);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = useAdminAccess(profile?.isAdmin);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  const loadChallengeList = useCallback(async () => {
    try {
      setLoadingChallenges(true);
      setLoadError(null);
      const data = await fetchChallenges();
      const sorted = [...data].sort((a, b) => {
        const endA = a.endDate ? new Date(a.endDate).getTime() : 0;
        const endB = b.endDate ? new Date(b.endDate).getTime() : 0;
        return endB - endA;
      });
      setChallenges(sorted);
      setSelectedChallengeId((prev) => {
        if (prev && sorted.some((c) => c.id === prev)) {
          return prev;
        }
        if (sorted.length === 0) {
          return "";
        }
        const ended = sorted.find((c) => hasChallengeEnded(c));
        return (ended ?? sorted[0]).id;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load challenges";
      setLoadError(message);
    } finally {
      setLoadingChallenges(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void loadChallengeList();
    }
  }, [loading, isAuthenticated, loadChallengeList]);

  const loadResults = useCallback(async (challengeId: string) => {
    if (!challengeId) {
      setResults(null);
      setResultsError(null);
      return;
    }
    try {
      setResultsLoading(true);
      setResultsError(null);
      const response = await fetchChallengeResults(challengeId);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setResults(null);
        setResultsError(response.message || "Results not available yet");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load results";
      setResults(null);
      setResultsError(message);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChallengeId) {
      void loadResults(selectedChallengeId);
    }
  }, [selectedChallengeId, loadResults]);

  const selectedChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === selectedChallengeId) || null,
    [challenges, selectedChallengeId]
  );

  const ended = hasChallengeEnded(selectedChallenge);

  const handleChallengeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedChallengeId(event.target.value);
    setActionMessage(null);
    setActionError(null);
  };

  const handleCompleteChallenge = async () => {
    if (!selectedChallengeId) return;
    setActionBusy(true);
    setActionMessage(null);
    setActionError(null);
    try {
      const result = await completeChallenge(selectedChallengeId, {
        completionThreshold,
      });
      setActionMessage(result?.message || "Challenge completed successfully");
      await loadChallengeList();
      await loadResults(selectedChallengeId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete challenge";
      setActionError(message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleRunPayouts = async () => {
    if (!selectedChallengeId) return;
    setActionBusy(true);
    setActionMessage(null);
    setActionError(null);
    try {
      const result = await runChallengePayouts(selectedChallengeId);
      setActionMessage(result?.message || "Payouts executed");
      await loadResults(selectedChallengeId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to run payouts";
      setActionError(message);
    } finally {
      setActionBusy(false);
    }
  };

  if (loading || profileLoading || !isAuthenticated) {
    return <LoadingSkeleton count={2} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg">Admin access required</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-[#FF5757] rounded"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Challenge Settlements</h1>
          <p className="text-sm text-gray-400">
            Close out completed challenges and release rewards from escrow.
          </p>
        </header>

        {loadError && (
          <div className="p-3 rounded border border-red-600 bg-red-900/40 text-sm">
            {loadError}
          </div>
        )}

        {loadingChallenges ? (
          <LoadingSkeleton count={1} />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Select challenge</label>
              <select
                value={selectedChallengeId}
                onChange={handleChallengeChange}
                className="w-full bg-[#1c1c1e] border border-[#2a2a2a] rounded px-3 py-2 text-sm"
              >
                {challenges.map((challenge) => {
                  const endedLabel = hasChallengeEnded(challenge) ? "Ended" : "Active";
                  return (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title} • {endedLabel} • Ends {formatDate(challenge.endDate)}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedChallenge && (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#2a2a2a] bg-[#121214] p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">{selectedChallenge.title}</p>
                      <p className="text-sm text-gray-400">Stake {selectedChallenge.userStake} • Prize pool {selectedChallenge.totalPrizePool}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${ended ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}
                    >
                      {ended ? "Ready for settlement" : "Challenge still active"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm text-gray-300">
                    <div>
                      <p className="text-gray-500">Start date</p>
                      <p>{formatDate(selectedChallenge.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">End date</p>
                      <p>{formatDate(selectedChallenge.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Participants</p>
                      <p>{selectedChallenge.participants ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Escrow address</p>
                      <p className="truncate">{selectedChallenge.escrowAddress || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2a2a2a] bg-[#121214] p-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Completion threshold (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={completionThreshold}
                      onChange={(event) => setCompletionThreshold(Number(event.target.value) || 0)}
                      className="w-full bg-[#1c1c1e] border border-[#2a2a2a] rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCompleteChallenge}
                      disabled={!ended || actionBusy}
                      className="flex-1 px-4 py-2 rounded bg-[#FF8A34] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete Challenge
                    </button>
                    <button
                      onClick={handleRunPayouts}
                      disabled={!ended || !selectedChallenge.escrowAddress || actionBusy}
                      className="flex-1 px-4 py-2 rounded bg-[#4ADE80] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Run Payouts
                    </button>
                  </div>

                  {actionMessage && (
                    <div className="p-3 rounded bg-green-500/10 border border-green-500/40 text-sm text-green-200">
                      {actionMessage}
                    </div>
                  )}
                  {actionError && (
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-sm text-red-200">
                      {actionError}
                    </div>
                  )}
                  {!ended && (
                    <p className="text-xs text-gray-500">
                      Settlement actions unlock once the challenge end date has passed.
                    </p>
                  )}
                  {ended && !selectedChallenge.escrowAddress && (
                    <p className="text-xs text-yellow-400">
                      Payouts need an escrow address on the challenge before funds can be released.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-[#2a2a2a] bg-[#121214] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-semibold">Latest results</p>
                    {resultsLoading && <span className="text-xs text-gray-400">Refreshing…</span>}
                  </div>
                  {resultsError && (
                    <div className="p-3 rounded bg-[#2a2a2a] text-sm text-gray-200">
                      {resultsError}
                    </div>
                  )}
                  {!resultsError && !results && !resultsLoading && (
                    <p className="text-sm text-gray-400">No results available yet.</p>
                  )}
                  {results && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Participants</p>
                          <p>{results.results.statistics.totalParticipants}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Winners</p>
                          <p>{results.results.statistics.winners}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Losers</p>
                          <p>{results.results.statistics.losers}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Success rate</p>
                          <p>{results.results.statistics.successRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total staked</p>
                          <p>{results.results.statistics.totalStaked}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rewards paid</p>
                          <p>{results.results.statistics.totalRewardsDistributed}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Top winners</p>
                        {results.results.winners.length === 0 ? (
                          <p className="text-sm text-gray-400">No winners recorded.</p>
                        ) : (
                          <ul className="space-y-2 text-sm text-gray-200">
                            {results.results.winners.slice(0, 5).map((winner) => (
                              <li key={winner.userId} className="flex items-center justify-between">
                                <span>{winner.userName || winner.userId}</span>
                                <span className="text-gray-400">{winner.reward.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
