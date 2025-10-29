import { createClient, type SupabaseClient as SupabaseJsClient } from '@supabase/supabase-js'

// CRITICAL: Always use environment variables for credentials
// Never hard-code sensitive keys in source code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const missingVars = [
  !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
  !supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
].filter(Boolean) as string[]

const missingEnvMessage =
  missingVars.length > 0
    ? `Supabase client not configured. Missing environment variable(s): ${missingVars.join(
        ', '
      )}. Please add them to your .env.local file.`
    : ''

const createMissingEnvProxy = (): SupabaseJsClient => {
  // Warn once during startup so devs know why Supabase calls fail
  if (process.env.NODE_ENV !== 'production') {
    console.warn(missingEnvMessage)
  }

  // Use a proxy so any Supabase method access clearly points to the missing configuration
  return new Proxy({} as SupabaseJsClient, {
    get() {
      throw new Error(missingEnvMessage)
    },
  })
}

export const supabase: SupabaseJsClient =
  missingVars.length === 0
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : createMissingEnvProxy()

// Types for better TypeScript support
export type SupabaseClient = SupabaseJsClient
