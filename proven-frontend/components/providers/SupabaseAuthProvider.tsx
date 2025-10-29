'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

interface SupabaseAuthProviderProps {
  children: ReactNode
}

export default function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const auth = useSupabaseAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
} 