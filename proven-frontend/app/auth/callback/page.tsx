'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const AuthCallbackHandler = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasExchangedRef = useRef(false)

  useEffect(() => {
    const errorDescription = searchParams.get('error_description') || searchParams.get('error')
    const code = searchParams.get('code')

    if (errorDescription) {
      router.replace(`/login?error=${encodeURIComponent(errorDescription)}`)
      return
    }

    if (!code) {
      router.replace('/login')
      return
    }

    if (hasExchangedRef.current) {
      return
    }

    hasExchangedRef.current = true

    const exchangeSession = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`)
        return
      }

      router.replace('/dashboard')
    }

    void exchangeSession()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}

const AuthCallbackPage = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    }
  >
    <AuthCallbackHandler />
  </Suspense>
)

export default AuthCallbackPage
