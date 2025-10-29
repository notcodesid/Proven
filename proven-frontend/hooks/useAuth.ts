'use client';

import { User, Session } from '@supabase/supabase-js';
import { useAuth as useSupabaseAuth } from '../components/providers/SupabaseAuthProvider';

interface AuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Auth hook that uses Supabase authentication
 * Provides a clean interface for authentication throughout the app
 */
export const useAuth = (): AuthReturn => {
  return useSupabaseAuth();
}; 