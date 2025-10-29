import { useState, useEffect } from 'react';
import { getUserProfile, UserProfile } from '../services/user';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching user profile
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        if (mounted) {
          setProfile(data);
        }
      } catch (err) {
        // Profile is optional, so we don't treat this as a critical error
        if (mounted) {
          setError('Could not load user profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    profile,
    loading,
    error,
  };
}
