import { useState, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CloudRain, Loader2, Check, X, AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

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

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [sendingResetEmail, setSendingResetEmail] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const { signIn, signUp, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  // Validation state
  const emailValid = EMAIL_REGEX.test(email)
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const passwordValid = password.length >= 6

  // Form is valid when email format is correct and password meets minimum requirements
  const formValid = emailValid && passwordValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({ email: true, password: true })
    
    // Validate before submitting
    if (!emailValid) {
      toast.error('Please enter a valid email address')
      return
    }
    
    if (!passwordValid) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        toast.success('Account created! Please check your email to verify.')
      } else {
        await signIn(email, password)
        toast.success('Welcome back!')
        navigate('/app')
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // OAuth will redirect to Google, so set a timeout to reset loading state
      // in case the redirect doesn't happen (e.g., OAuth not configured)
      setTimeout(() => {
        setGoogleLoading(false)
      }, 5000)
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      // Provide more helpful error message
      const message = error.message || 'Google sign-in failed'
      if (message.includes('provider') || message.includes('not enabled')) {
        toast.error('Google sign-in is not configured. Please use email/password or contact support.')
      } else {
        toast.error(message)
      }
      setGoogleLoading(false)
    }
  }

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!EMAIL_REGEX.test(forgotPasswordEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setSendingResetEmail(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured. Please set environment variables.')
      }
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      })

      if (error) throw error

      setResetEmailSent(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      console.error('Password reset error:', error)
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setSendingResetEmail(false)
    }
  }

  // Back to login from forgot password
  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setForgotPasswordEmail('')
    setResetEmailSent(false)
  }

  // Forgot Password UI
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 mt-2">
              {resetEmailSent 
                ? "Check your email for the reset link" 
                : "Enter your email to receive a password reset link"
              }
            </p>
          </div>

          {resetEmailSent ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Email sent!</p>
                    <p className="text-sm text-green-700 mt-1">
                      We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                      Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="you@company.com"
                  aria-label="Email address for password reset"
                />
              </div>

              <button
                type="submit"
                disabled={sendingResetEmail || !forgotPasswordEmail}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                aria-busy={sendingResetEmail}
              >
                {sendingResetEmail && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {sendingResetEmail ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
            <CloudRain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HailStorm Pro</h1>
          <p className="text-gray-600 mt-2">Automated Roofing Lead Generation</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Backend not connected</p>
                <p className="text-xs text-amber-700 mt-1">
                  Supabase environment variables are missing. Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your Vercel project settings under Environment Variables (enable for all environments: Production, Preview, Development).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {googleLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                required
                aria-invalid={touched.email && !emailValid}
                aria-describedby={touched.email && !emailValid ? "email-error" : undefined}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10 ${
                  touched.email && !emailValid 
                    ? 'border-red-300 bg-red-50' 
                    : touched.email && emailValid 
                    ? 'border-green-300' 
                    : 'border-gray-300'
                }`}
                placeholder="you@company.com"
              />
              {touched.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailValid ? (
                    <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                  )}
                </div>
              )}
            </div>
            {touched.email && !emailValid && email && (
              <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                Please enter a valid email address
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => isSignUp && setShowPasswordStrength(true)}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, password: true }))
                  setShowPasswordStrength(false)
                }}
                required
                minLength={6}
                aria-invalid={touched.password && !passwordValid}
                aria-describedby={isSignUp && showPasswordStrength ? "password-strength" : touched.password && !passwordValid ? "password-error" : undefined}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10 ${
                  touched.password && !passwordValid 
                    ? 'border-red-300 bg-red-50' 
                    : touched.password && passwordValid 
                    ? 'border-green-300' 
                    : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {touched.password && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {passwordValid ? (
                    <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                  )}
                </div>
              )}
            </div>
            
            {/* Password strength indicator for sign up */}
            {isSignUp && showPasswordStrength && password && (
              <div id="password-strength" className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200" role="status" aria-live="polite">
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
            
            {touched.password && !passwordValid && password && !showPasswordStrength && (
              <p id="password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                Password must be at least 6 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading || !formValid}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            aria-busy={loading}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {!isSignUp && (
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium block w-full"
            >
              Forgot your password?
            </button>
          )}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
