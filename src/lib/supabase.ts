import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
const isConfigured = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder')

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'See .env.example for reference.'
  )
}

// Create the Supabase client without generic Database type
// This avoids complex type inference issues while still being type-safe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Export configuration status for runtime checks
export const isSupabaseConfigured = isConfigured

// Helper to check if we can make real database calls
export function requireSupabase(): void {
  if (!isConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
}
