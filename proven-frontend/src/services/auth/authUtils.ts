import { supabase } from '../../../lib/supabase';

const AUTH_TOKEN_KEY = 'proven_auth_token';
const LEGACY_AUTH_TOKEN_KEYS = ['lockin_auth_token'];

/**
 * Get the stored authentication token from localStorage (deprecated)
 * @deprecated Use getAuthToken() instead which gets fresh tokens from Supabase
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check current token first
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    return token;
  }

  // Fallback to legacy keys (will be removed once migration is complete)
  for (const legacyKey of LEGACY_AUTH_TOKEN_KEYS) {
    const legacyToken = localStorage.getItem(legacyKey);
    if (legacyToken) {
      return legacyToken;
    }
  }

  return null;
}

/**
 * Save authentication token to localStorage (deprecated)
 * @deprecated Supabase handles token storage automatically
 */
export function saveAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  LEGACY_AUTH_TOKEN_KEYS.forEach((legacyKey) => localStorage.removeItem(legacyKey));
}

/**
 * Clear the authentication token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Clear legacy token
  const keysToClear = [AUTH_TOKEN_KEY, ...LEGACY_AUTH_TOKEN_KEYS, 'user_saved_to_backend'];
  keysToClear.forEach((key) => localStorage.removeItem(key));
}

/**
 * Get the current authentication token from Supabase session
 * This is the primary method for getting tokens - always returns fresh tokens
 */
export async function getAuthToken(): Promise<string> {
  // Get fresh token from Supabase session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error('Error getting session');
  }
  
  if (!session) {
    throw new Error('User not authenticated - no active session');
  }
  
  // Get the access token from Supabase session
  const token = session.access_token;
  
  if (!token) {
    throw new Error('No access token found in session');
  }
  
  return token;
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch (error) {
    return false;
  }
}
