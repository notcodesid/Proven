'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import axios from 'axios'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  // Auto-logout scheduler based on Supabase session expiry
  type TimeoutId = ReturnType<typeof setTimeout>
  const logoutTimerRef = useRef<TimeoutId | null>(null)

  // Track if save-user request is in progress to prevent race conditions
  const saveInProgressRef = useRef<boolean>(false)

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }

  const verifyAndMaybeSignOut = async () => {
    // Check the freshest session; if expired, sign out, else reschedule
    const { data: { session: current } } = await supabase.auth.getSession()
    const expiresAtMs = current?.expires_at ? current.expires_at * 1000 : 0
    const msLeft = expiresAtMs - Date.now()
    if (!current || msLeft <= 0) {
      // Token really expired and was not refreshed → sign out
      try {
        await supabase.auth.signOut()
      } catch (err) {
      }
      return
    }
    // Token got refreshed → schedule again
    scheduleLogoutForSession(current)
  }

  const scheduleLogoutForSession = (session: Session | null) => {
    clearLogoutTimer()
    if (!session?.expires_at) return
    // Buffer a couple seconds to avoid race conditions
    const targetMs = session.expires_at * 1000 - Date.now() - 2000
    if (targetMs <= 0) {
      void verifyAndMaybeSignOut()
      return
    }
    logoutTimerRef.current = setTimeout(() => {
      void verifyAndMaybeSignOut()
    }, targetMs)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
      }
      
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
      })

      // Schedule auto logout for the current session
      scheduleLogoutForSession(session ?? null)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
        })

        // Handle sign in event
        if (event === 'SIGNED_IN' && session?.user) {
          await saveUserToBackend(session.user, session)
        }

        // Reset auto-logout timer for any session change
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          scheduleLogoutForSession(session ?? null)
        }

        // Handle sign out event - clean up saved flags
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('user_saved_to_backend')
          saveInProgressRef.current = false
          clearLogoutTimer()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Save user to backend (simplified - no token generation)
  const saveUserToBackend = async (user: User, session: Session) => {
    // Guard: prevent duplicate saves
    if (saveInProgressRef.current || localStorage.getItem('user_saved_to_backend')) {
      return
    }

    // Mark as in-progress BEFORE starting API call to prevent race conditions
    saveInProgressRef.current = true

    try {
      const backendResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/api/auth/save-user`,
        {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata
          },
          accessToken: session.access_token
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (backendResponse.data.success) {
        localStorage.setItem('user_saved_to_backend', 'true')
      }
    } catch (error) {
      // Even on error, clear the in-progress flag to allow retry
    } finally {
      // Always clear in-progress flag when done
      saveInProgressRef.current = false
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  }

  // Enhanced sign out
  const signOut = async () => {
    try {
      
      // Sign out from Supabase (this will trigger the auth state change)
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      clearLogoutTimer()
    } catch (error) {
      throw error
    }
  }

  // Switch account - forces account selection
  const switchAccount = async () => {
    try {
      
      // Sign out from current session
      await signOut()
      
      // Wait for sign out to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Sign in with forced account selection
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account consent', // Force account selection
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signInWithGoogle,
    signOut,
    switchAccount,
    isAuthenticated: !!authState.user,
  }
} 
