import { supabase } from './supabase'
import type { Profile, Json } from '../types/database'

export type { Profile }

export interface NotificationPrefs {
  email_storm_alerts: boolean
  email_lead_updates: boolean
  email_weekly_reports: boolean
  sms_urgent_alerts: boolean
  // App settings stored with notification prefs
  target_state?: string  // State to filter storms by (e.g., 'WI', 'MN', 'IL')
}

// Available states for storm tracking (midwest region)
export const AVAILABLE_STATES = [
  { code: 'WI', name: 'Wisconsin' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IA', name: 'Iowa' },
  { code: 'MI', name: 'Michigan' },
  { code: 'IN', name: 'Indiana' },
  { code: 'OH', name: 'Ohio' },
  { code: 'MO', name: 'Missouri' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'KS', name: 'Kansas' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'TX', name: 'Texas' },
  { code: 'CO', name: 'Colorado' },
]

export const DEFAULT_TARGET_STATE = 'WI'

export const profileService = {
  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // Profile might not exist yet - will be created by trigger
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching profile:', error)
      throw error
    }

    return data
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(updates: {
    full_name?: string
    company_name?: string
    phone?: string
    business_address?: string
    avatar_url?: string
  }): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return data as Profile
  },

  /**
   * Get notification preferences (includes app settings)
   */
  async getNotificationPrefs(): Promise<NotificationPrefs> {
    const profile = await this.getProfile()
    
    const defaultPrefs: NotificationPrefs = {
      email_storm_alerts: true,
      email_lead_updates: true,
      email_weekly_reports: true,
      sms_urgent_alerts: false,
      target_state: DEFAULT_TARGET_STATE,
    }

    if (!profile?.notification_prefs) {
      return defaultPrefs
    }

    return {
      ...defaultPrefs,
      ...(profile.notification_prefs as Record<string, boolean | string>),
    }
  },

  /**
   * Get the user's target state for storm filtering
   */
  async getTargetState(): Promise<string> {
    try {
      const prefs = await this.getNotificationPrefs()
      return prefs.target_state || DEFAULT_TARGET_STATE
    } catch (error) {
      console.error('Error getting target state:', error)
      return DEFAULT_TARGET_STATE
    }
  },

  /**
   * Update the user's target state for storm filtering
   */
  async updateTargetState(state: string): Promise<Profile> {
    const currentPrefs = await this.getNotificationPrefs()
    return this.updateNotificationPrefs({
      ...currentPrefs,
      target_state: state,
    })
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current prefs first
    const currentPrefs = await this.getNotificationPrefs()
    const newPrefs = { ...currentPrefs, ...prefs }

    const { data, error } = await supabase
      .from('profiles')
      .update({ notification_prefs: newPrefs as unknown as Json })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification prefs:', error)
      throw error
    }

    return data as Profile
  },

  /**
   * Update password via Supabase Auth
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    // First verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error('Not authenticated')

    // Attempt to sign in with current password to verify
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      throw new Error('Current password is incorrect')
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Error updating password:', error)
      throw error
    }
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile with new avatar URL
    await this.updateProfile({ avatar_url: publicUrl })

    return publicUrl
  },

  /**
   * Create profile if it doesn't exist (fallback for edge cases)
   */
  async ensureProfile(): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Try to get existing profile
    let profile = await this.getProfile()
    
    if (!profile) {
      // Create profile manually (shouldn't happen if trigger works)
      const insertData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        throw error
      }

      profile = data as Profile
    }

    return profile
  },
}
