import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Provider } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
      })
    } catch (error) {
      console.warn('Auth initialization failed (Supabase may not be configured):', error)
      set({ user: null, loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error('Google OAuth error:', error)
      throw error
    }
    
    // Log OAuth URL for debugging (will be null if provider not enabled)
    if (!data?.url) {
      console.error('No OAuth URL returned - Google provider may not be enabled in Supabase')
      throw new Error('Google sign-in is not configured. Please enable Google OAuth in your Supabase dashboard.')
    }
    
    // The browser will redirect to data.url automatically
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null })
  },
}))

// Initialize auth on app load
useAuthStore.getState().initialize()
