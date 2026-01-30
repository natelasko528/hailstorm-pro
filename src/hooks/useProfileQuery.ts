import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService, NotificationPrefs } from '../lib/profileService'

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  notifications: () => [...profileKeys.all, 'notifications'] as const,
}

// Fetch current user profile
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for profile
  })
}

// Fetch notification preferences
export function useNotificationPrefs() {
  return useQuery({
    queryKey: profileKeys.notifications(),
    queryFn: () => profileService.getNotificationPrefs(),
    staleTime: 5 * 60 * 1000,
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (updates: {
      full_name?: string
      company_name?: string
      phone?: string
      business_address?: string
      avatar_url?: string
    }) => profileService.updateProfile(updates),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile)
    },
  })
}

// Update notification preferences mutation
export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPrefs>) =>
      profileService.updateNotificationPrefs(prefs),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.current(), updatedProfile)
      queryClient.invalidateQueries({ queryKey: profileKeys.notifications() })
    },
  })
}

// Update password mutation
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      profileService.updatePassword(currentPassword, newPassword),
  })
}

// Upload avatar mutation
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}

// Ensure profile exists mutation
export function useEnsureProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => profileService.ensureProfile(),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.current(), profile)
    },
  })
}
