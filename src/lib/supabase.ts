import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient<Database>

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Database features will be unavailable.')
  supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export { supabase }
