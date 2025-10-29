import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchChallenges } from '../services/challengeService';
import { Challenge } from '../types/challenge';

interface UseChallengesReturn {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing challenges
 */
export function useChallenges(): UseChallengesReturn {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate calls in React Strict Mode
  const loadingRef = useRef(false);

  const loadChallenges = useCallback(async () => {
    // Guard: prevent duplicate calls
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchChallenges();
      setChallenges(data);
    } catch (err) {
      setError('Failed to load challenges. Please try again later.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  return {
    challenges,
    loading,
    error,
    refetch: loadChallenges,
  };
}
