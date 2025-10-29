import { supabase } from '../../../lib/supabase';

const AUTH_TOKEN_KEY = 'lockin_auth_token'; // Keeping for backward compatibility cleanup

/**
 * Get the stored authentication token from localStorage (deprecated)
 * @deprecated Use getAuthToken() instead which gets fresh tokens from Supabase
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check for legacy token and warn
  const legacyToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (legacyToken) {
  }
  
  return legacyToken;
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
}

/**
 * Clear the authentication token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Clear legacy token
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('user_saved_to_backend');
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
