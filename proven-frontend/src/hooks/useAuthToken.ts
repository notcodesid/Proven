import { useState, useEffect } from 'react';
import { getAuthToken, clearAuthToken, isAuthenticated } from '../services/auth/authUtils';

/**
 * Custom hook for managing authentication token
 * Now uses Supabase tokens directly instead of localStorage
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Load authentication status on initial mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await isAuthenticated();
        setAuthenticated(authStatus);
        
        if (authStatus) {
          const currentToken = await getAuthToken();
          setToken(currentToken);
        } else {
          setToken(null);
        }
      } catch (error) {
        setToken(null);
        setAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Function to refresh the token (gets fresh token from Supabase)
  const refreshToken = async () => {
    try {
      const freshToken = await getAuthToken();
      setToken(freshToken);
      setAuthenticated(true);
      return freshToken;
    } catch (error) {
      setToken(null);
      setAuthenticated(false);
      throw error;
    }
  };

  // Function to clear the token (logout)
  const clearToken = () => {
    clearAuthToken();
    setToken(null);
    setAuthenticated(false);
  };

  return {
    token,
    isLoading,
    isAuthenticated: authenticated,
    refreshToken,
    clearToken,
    // Deprecated: keeping for backward compatibility
    setAuthToken: (newToken: string) => {
      setToken(newToken);
    }
  };
}
