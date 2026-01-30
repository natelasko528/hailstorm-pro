import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted above all imports, so we must use vi.hoisted() to define
// the mock functions that the factory references.
const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignUp,
  mockSignOut,
  mockSignInWithOAuth,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  mockOnAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      signInWithOAuth: mockSignInWithOAuth,
    },
  },
  isSupabaseConfigured: true,
}))

// Import after mocking
import { useAuthStore } from '../authStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the store state between tests
    useAuthStore.setState({ user: null, loading: true })
  })

  describe('initial state', () => {
    it('has user as null', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })

    it('has loading as true', () => {
      useAuthStore.setState({ loading: true })
      const state = useAuthStore.getState()
      expect(state.loading).toBe(true)
    })
  })

  describe('signIn', () => {
    it('calls supabase signInWithPassword with email and password', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null })

      await useAuthStore.getState().signIn('test@example.com', 'password123')

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('throws when supabase returns an error', async () => {
      const authError = new Error('Invalid credentials')
      mockSignInWithPassword.mockResolvedValue({ error: authError })

      await expect(
        useAuthStore.getState().signIn('bad@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signUp', () => {
    it('calls supabase signUp with email and password', async () => {
      mockSignUp.mockResolvedValue({ error: null })

      await useAuthStore.getState().signUp('new@example.com', 'newpass')

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpass',
      })
    })

    it('throws when supabase returns an error', async () => {
      const authError = new Error('Email already in use')
      mockSignUp.mockResolvedValue({ error: authError })

      await expect(
        useAuthStore.getState().signUp('dup@example.com', 'pass')
      ).rejects.toThrow('Email already in use')
    })
  })

  describe('signOut', () => {
    it('calls supabase signOut and clears user', async () => {
      mockSignOut.mockResolvedValue({ error: null })
      // Simulate an existing user
      useAuthStore.setState({ user: { id: '123' } as any })

      await useAuthStore.getState().signOut()

      expect(mockSignOut).toHaveBeenCalled()
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('throws when supabase signOut fails', async () => {
      const signOutError = new Error('Network error')
      mockSignOut.mockResolvedValue({ error: signOutError })

      await expect(useAuthStore.getState().signOut()).rejects.toThrow('Network error')
    })
  })

  describe('initialize', () => {
    it('sets user from existing session', async () => {
      const mockUser = { id: 'user-1', email: 'user@test.com' }
      mockGetSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })

      await useAuthStore.getState().initialize()

      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('sets user to null when no session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })

      await useAuthStore.getState().initialize()

      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('handles initialization failure gracefully', async () => {
      mockGetSession.mockRejectedValue(new Error('Connection failed'))

      await useAuthStore.getState().initialize()

      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().loading).toBe(false)
    })

    it('subscribes to auth state changes', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })

      await useAuthStore.getState().initialize()

      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })
  })
})
