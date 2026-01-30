import { useState, useEffect, useMemo, useRef } from 'react'
import { User, Bell, Lock, CreditCard, Mail, Save, Loader2, CheckCircle, AlertCircle, Check, X, Camera, Upload, Zap, Link, Search, ChevronDown, ChevronUp, Star, Building2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { profileService, Profile, NotificationPrefs, AVAILABLE_STATES, DEFAULT_TARGET_STATE } from '../lib/profileService'
import { useAuthStore } from '../store/authStore'

// Phone number validation and formatting
const PHONE_REGEX = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

// Password strength checker
function getPasswordStrength(password: string): { 
  score: number; 
  label: string; 
  color: string;
  requirements: { met: boolean; label: string }[]
} {
  const requirements = [
    { met: password.length >= 6, label: 'At least 6 characters' },
    { met: password.length >= 8, label: 'At least 8 characters (recommended)' },
    { met: /[A-Z]/.test(password), label: 'Contains uppercase letter' },
    { met: /[a-z]/.test(password), label: 'Contains lowercase letter' },
    { met: /[0-9]/.test(password), label: 'Contains number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'Contains special character' },
  ]

  const score = requirements.filter(r => r.met).length
  
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', requirements }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500', requirements }
  if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500', requirements }
  return { score, label: 'Strong', color: 'bg-green-500', requirements }
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  
  // Notification state (includes app settings like target state)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    email_storm_alerts: true,
    email_lead_updates: true,
    email_weekly_reports: true,
    sms_urgent_alerts: false,
    target_state: DEFAULT_TARGET_STATE,
  })
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  
  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Integration connection state
  const [integrationConnections, setIntegrationConnections] = useState<Record<string, boolean>>({
    gohighlevel: false,
    mailchimp: false,
    zapier: false,
    stripe: false,
    batchdata: false,
  })
  const [integrationConfigs, setIntegrationConfigs] = useState<Record<string, { apiKey: string; webhookUrl: string }>>({
    gohighlevel: { apiKey: '', webhookUrl: '' },
    mailchimp: { apiKey: '', webhookUrl: '' },
    zapier: { apiKey: '', webhookUrl: '' },
    stripe: { apiKey: '', webhookUrl: '' },
    batchdata: { apiKey: '', webhookUrl: '' },
  })
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  // Validation state
  const phoneValid = !phone || PHONE_REGEX.test(phone.replace(/\D/g, '').padStart(10, '0').slice(-10))
  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const passwordsMatch = newPassword === confirmPassword
  const newPasswordValid = newPassword.length >= 6

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Mail },
  ]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const profileData = await profileService.getProfile()
      if (profileData) {
        setProfile(profileData)
        const [first, ...rest] = (profileData.full_name || '').split(' ')
        setFirstName(first || '')
        setLastName(rest.join(' ') || '')
        setPhone(profileData.phone || '')
        setCompanyName(profileData.company_name || '')
        setBusinessAddress(profileData.business_address || '')
        setAvatarUrl(profileData.avatar_url || null)
      }
      
      const prefs = await profileService.getNotificationPrefs()
      setNotificationPrefs(prefs)
    } catch (err) {
      console.error('Error loading profile:', err)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle avatar file selection and upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 2MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const url = await profileService.uploadAvatar(file)
      setAvatarUrl(url)
      toast.success('Avatar uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Save profile data
      await profileService.updateProfile({
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
        company_name: companyName,
        business_address: businessAddress,
      })
      
      // Also save the target state setting
      if (notificationPrefs.target_state) {
        await profileService.updateTargetState(notificationPrefs.target_state)
      }
      
      toast.success('Profile saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await profileService.updateNotificationPrefs(notificationPrefs)
      toast.success('Notification preferences saved!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notifications')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      await profileService.updatePassword(currentPassword, newPassword)
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }

  const toggleNotification = (key: keyof NotificationPrefs) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    {/* Avatar with upload overlay */}
                    <div className="relative group">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile avatar"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                          {firstName.charAt(0)}{lastName.charAt(0) || firstName.charAt(1) || ''}
                        </div>
                      )}
                      {/* Upload overlay */}
                      <button
                        onClick={triggerAvatarUpload}
                        disabled={uploadingAvatar}
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        aria-label="Change profile photo"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" aria-hidden="true" />
                        ) : (
                          <Camera className="w-8 h-8 text-white" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <div>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                        aria-label="Upload avatar image"
                      />
                      <button 
                        onClick={triggerAvatarUpload}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        aria-label="Change profile photo"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Upload className="w-4 h-4" aria-hidden="true" />
                        )}
                        {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG, GIF, or WebP. Max size 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || profile?.email || ''}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                          aria-invalid={!phoneValid && phone.length > 0}
                          aria-describedby={!phoneValid && phone.length > 0 ? "phone-error" : undefined}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10 ${
                            !phoneValid && phone.length > 0
                              ? 'border-red-300 bg-red-50'
                              : phone.length > 0 && phoneValid
                              ? 'border-green-300'
                              : 'border-gray-300'
                          }`}
                          placeholder="(555) 123-4567"
                        />
                        {phone.length > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {phoneValid ? (
                              <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                            )}
                          </div>
                        )}
                      </div>
                      {!phoneValid && phone.length > 0 && (
                        <p id="phone-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                          <AlertCircle className="w-4 h-4" aria-hidden="true" />
                          Please enter a valid phone number
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Your Roofing Company LLC"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Address
                      </label>
                      <input
                        type="text"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="123 Main St, City, State ZIP"
                      />
                    </div>
                  </div>

                  {/* Storm Tracking Settings */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Storm Tracking Settings</h3>
                    <div className="max-w-md">
                      <label htmlFor="target-state" className="block text-sm font-medium text-gray-700 mb-2">
                        Target State for Storm Tracking
                      </label>
                      <select
                        id="target-state"
                        value={notificationPrefs.target_state || DEFAULT_TARGET_STATE}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, target_state: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        aria-label="Select state to track storms in"
                      >
                        {AVAILABLE_STATES.map(state => (
                          <option key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Storm paths and property data will be filtered to this state. 
                        Note: Property lookup is currently only available for Wisconsin.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={loadProfile}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">New Storm Alerts</p>
                          <p className="text-sm text-gray-500">Get notified when a hail storm is detected in your area</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('email_storm_alerts')}
                          className={`relative w-12 h-6 rounded-full transition ${
                            notificationPrefs.email_storm_alerts ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            notificationPrefs.email_storm_alerts ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Lead Updates</p>
                          <p className="text-sm text-gray-500">Receive updates when lead status changes</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('email_lead_updates')}
                          className={`relative w-12 h-6 rounded-full transition ${
                            notificationPrefs.email_lead_updates ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            notificationPrefs.email_lead_updates ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Weekly Reports</p>
                          <p className="text-sm text-gray-500">Get a weekly summary of your leads and activity</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('email_weekly_reports')}
                          className={`relative w-12 h-6 rounded-full transition ${
                            notificationPrefs.email_weekly_reports ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            notificationPrefs.email_weekly_reports ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Urgent Storm Alerts</p>
                          <p className="text-sm text-gray-500">Text messages for severe storms only</p>
                        </div>
                        <button
                          onClick={() => toggleNotification('sms_urgent_alerts')}
                          className={`relative w-12 h-6 rounded-full transition ${
                            notificationPrefs.sms_urgent_alerts ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${
                            notificationPrefs.sms_urgent_alerts ? 'right-0.5' : 'left-0.5'
                          }`}></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleSaveNotifications} 
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          aria-label="Enter your current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onFocus={() => setShowPasswordStrength(true)}
                            onBlur={() => setShowPasswordStrength(false)}
                            aria-invalid={newPassword.length > 0 && !newPasswordValid}
                            aria-describedby={showPasswordStrength ? "password-strength-settings" : undefined}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10 ${
                              newPassword.length > 0 && !newPasswordValid
                                ? 'border-red-300 bg-red-50'
                                : newPassword.length > 0 && newPasswordValid
                                ? 'border-green-300'
                                : 'border-gray-300'
                            }`}
                            aria-label="Enter your new password"
                          />
                          {newPassword.length > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {newPasswordValid ? (
                                <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Password strength indicator */}
                        {showPasswordStrength && newPassword && (
                          <div id="password-strength-settings" className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200" role="status" aria-live="polite">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${
                                passwordStrength.label === 'Weak' ? 'text-red-600' :
                                passwordStrength.label === 'Fair' ? 'text-yellow-600' :
                                passwordStrength.label === 'Good' ? 'text-blue-600' :
                                'text-green-600'
                              }`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {passwordStrength.requirements.slice(0, 4).map((req, i) => (
                                <li key={i} className={`text-xs flex items-center gap-1.5 ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                                  {req.met ? (
                                    <Check className="w-3 h-3" aria-hidden="true" />
                                  ) : (
                                    <X className="w-3 h-3" aria-hidden="true" />
                                  )}
                                  {req.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                            aria-describedby={confirmPassword.length > 0 && !passwordsMatch ? "confirm-password-error" : undefined}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10 ${
                              confirmPassword.length > 0 && !passwordsMatch
                                ? 'border-red-300 bg-red-50'
                                : confirmPassword.length > 0 && passwordsMatch
                                ? 'border-green-300'
                                : 'border-gray-300'
                            }`}
                            aria-label="Confirm your new password"
                          />
                          {confirmPassword.length > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {passwordsMatch ? (
                                <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                              )}
                            </div>
                          )}
                        </div>
                        {confirmPassword.length > 0 && !passwordsMatch && (
                          <p id="confirm-password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-4 h-4" aria-hidden="true" />
                            Passwords do not match
                          </p>
                        )}
                      </div>

                      <button 
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPasswordValid || !passwordsMatch}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
                        aria-busy={changingPassword}
                      >
                        {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
                    <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscription</h2>

                {/* Plan Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Free Plan */}
                  <div className="relative bg-white rounded-xl border-2 border-blue-500 p-6 shadow-sm">
                    <div className="absolute -top-3 left-4">
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                        Current Plan
                      </span>
                    </div>
                    <div className="mt-2 mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Free</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$0</span>
                        <span className="text-gray-500 text-sm">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-6">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Unlimited storm tracking
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Up to 100 leads
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        Basic reporting
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        1 state tracking
                      </li>
                    </ul>
                    <button
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  </div>

                  {/* Pro Plan */}
                  <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-purple-200 p-6 shadow-md">
                    <div className="absolute -top-3 left-4">
                      <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Recommended
                      </span>
                    </div>
                    <div className="mt-2 mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Pro</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$99</span>
                        <span className="text-gray-500 text-sm">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-6">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Unlimited leads
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Advanced analytics
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Skip trace credits (100/mo)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Multi-state tracking
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Priority support
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        API access
                      </li>
                    </ul>
                    <button
                      onClick={() => toast.success('Upgrade flow coming soon!')}
                      className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      Upgrade to Pro
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="absolute -top-3 left-4">
                      <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Enterprise
                      </span>
                    </div>
                    <div className="mt-2 mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Enterprise</h3>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-gray-900">Custom</span>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-6">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        Custom limits
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        Dedicated support
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        Custom integrations
                      </li>
                    </ul>
                    <button
                      onClick={() => toast.success('Our sales team will reach out shortly!')}
                      className="w-full px-4 py-2.5 border-2 border-gray-800 text-gray-800 rounded-lg font-semibold hover:bg-gray-800 hover:text-white transition"
                    >
                      Contact Sales
                    </button>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                  <div className="space-y-5">
                    {/* Leads Used */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">Leads Used</span>
                        <span className="text-sm text-gray-500">42 / 100</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: '42%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">58 leads remaining this month</p>
                    </div>

                    {/* Skip Traces */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">Skip Traces</span>
                        <span className="text-sm text-gray-500">0 / 0</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: '0%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upgrade to Pro for 100 skip traces per month</p>
                    </div>

                    {/* States Tracked */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">States Tracked</span>
                        <span className="text-sm text-gray-500">1 of 1</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upgrade to Pro for multi-state tracking</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
                <p className="text-gray-500 mb-6">Connect your favorite tools to streamline your workflow</p>

                <div className="space-y-4">
                  {[
                    { id: 'gohighlevel', name: 'GoHighLevel', description: 'CRM and marketing automation', icon: Zap, iconColor: 'text-orange-500', iconBg: 'bg-orange-50' },
                    { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing platform', icon: Mail, iconColor: 'text-yellow-600', iconBg: 'bg-yellow-50' },
                    { id: 'zapier', name: 'Zapier', description: 'Connect with 3,000+ apps', icon: Link, iconColor: 'text-orange-600', iconBg: 'bg-orange-50' },
                    { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: CreditCard, iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
                    { id: 'batchdata', name: 'BatchData', description: 'Skip tracing and property data enrichment', icon: Search, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
                  ].map((integration) => {
                    const isConnected = integrationConnections[integration.id]
                    const isExpanded = expandedIntegration === integration.id
                    const config = integrationConfigs[integration.id]
                    const IconComponent = integration.icon

                    return (
                      <div
                        key={integration.id}
                        className={`border rounded-xl transition overflow-hidden ${
                          isConnected ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${integration.iconBg} rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`w-6 h-6 ${integration.iconColor}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isConnected
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{integration.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isConnected && (
                              <button
                                onClick={() => setExpandedIntegration(isExpanded ? null : integration.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 transition"
                                aria-label={isExpanded ? 'Collapse configuration' : 'Expand configuration'}
                              >
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const newState = !isConnected
                                setIntegrationConnections(prev => ({ ...prev, [integration.id]: newState }))
                                if (newState) {
                                  toast.success(`${integration.name} connected successfully!`)
                                  setExpandedIntegration(integration.id)
                                } else {
                                  toast.success(`${integration.name} disconnected`)
                                  setExpandedIntegration(null)
                                  setIntegrationConfigs(prev => ({
                                    ...prev,
                                    [integration.id]: { apiKey: '', webhookUrl: '' },
                                  }))
                                }
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                                isConnected
                                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isConnected ? 'Disconnect' : 'Connect'}
                            </button>
                          </div>
                        </div>

                        {/* Configuration Section */}
                        {isConnected && isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                            <div className="bg-white rounded-lg p-4 space-y-4">
                              <h5 className="text-sm font-semibold text-gray-700">Configuration</h5>
                              <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                  API Key
                                </label>
                                <div className="relative">
                                  <input
                                    type={showApiKey[integration.id] ? 'text' : 'password'}
                                    value={config.apiKey}
                                    onChange={(e) =>
                                      setIntegrationConfigs(prev => ({
                                        ...prev,
                                        [integration.id]: { ...prev[integration.id], apiKey: e.target.value },
                                      }))
                                    }
                                    placeholder={`Enter your ${integration.name} API key`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                                  />
                                  <button
                                    onClick={() => setShowApiKey(prev => ({ ...prev, [integration.id]: !prev[integration.id] }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    aria-label={showApiKey[integration.id] ? 'Hide API key' : 'Show API key'}
                                  >
                                    {showApiKey[integration.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                  Webhook URL
                                </label>
                                <input
                                  type="url"
                                  value={config.webhookUrl}
                                  onChange={(e) =>
                                    setIntegrationConfigs(prev => ({
                                      ...prev,
                                      [integration.id]: { ...prev[integration.id], webhookUrl: e.target.value },
                                    }))
                                  }
                                  placeholder="https://your-webhook-url.com/endpoint"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    toast.success(`${integration.name} configuration saved!`)
                                    setExpandedIntegration(null)
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  Save Configuration
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Coming Soon:</strong> More integrations are being developed.
                    Contact support if you need a specific integration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
