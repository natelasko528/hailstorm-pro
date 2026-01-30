/**
 * Error Monitoring Service
 * 
 * A centralized error handling utility that can be configured to use
 * external services like Sentry, LogRocket, or custom backends.
 * 
 * To enable Sentry:
 * 1. npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in your .env
 * 3. Uncomment the Sentry initialization code below
 * 
 * Example .env:
 * VITE_SENTRY_DSN=https://your-dsn@sentry.io/project
 */

// Error severity levels
export type ErrorSeverity = 'error' | 'warning' | 'info'

// Error context for additional information
export interface ErrorContext {
  userId?: string
  email?: string
  component?: string
  action?: string
  extra?: Record<string, unknown>
}

// Check if Sentry DSN is configured
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const IS_PRODUCTION = import.meta.env.PROD

// Initialize error monitoring (Sentry commented out - uncomment when ready)
/*
import * as Sentry from '@sentry/react'

if (SENTRY_DSN && IS_PRODUCTION) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
*/

// In-memory error log for development
const errorLog: Array<{
  timestamp: Date
  severity: ErrorSeverity
  message: string
  error?: Error
  context?: ErrorContext
}> = []

/**
 * Capture and report an error
 */
export function captureError(
  error: Error | string,
  severity: ErrorSeverity = 'error',
  context?: ErrorContext
): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  const message = errorObj.message

  // Log to console in development
  if (!IS_PRODUCTION) {
    console.group(`[${severity.toUpperCase()}] ${message}`)
    console.error(errorObj)
    if (context) {
      console.log('Context:', context)
    }
    console.groupEnd()
  }

  // Store in error log
  errorLog.push({
    timestamp: new Date(),
    severity,
    message,
    error: errorObj,
    context,
  })

  // Keep only last 100 errors in memory
  if (errorLog.length > 100) {
    errorLog.shift()
  }

  // Send to Sentry (uncomment when Sentry is configured)
  /*
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel(severity)
      
      if (context) {
        if (context.userId) scope.setUser({ id: context.userId, email: context.email })
        if (context.component) scope.setTag('component', context.component)
        if (context.action) scope.setTag('action', context.action)
        if (context.extra) scope.setExtras(context.extra)
      }
      
      Sentry.captureException(errorObj)
    })
  }
  */

  // Send to custom backend (example)
  if (IS_PRODUCTION && !SENTRY_DSN) {
    // You could send errors to your own backend here
    // sendErrorToBackend({ message, severity, context, stack: errorObj.stack })
  }
}

/**
 * Capture a message/warning without an error object
 */
export function captureMessage(
  message: string,
  severity: ErrorSeverity = 'info',
  context?: ErrorContext
): void {
  if (!IS_PRODUCTION) {
    console.log(`[${severity.toUpperCase()}] ${message}`, context || '')
  }

  errorLog.push({
    timestamp: new Date(),
    severity,
    message,
    context,
  })

  // Sentry message capture (uncomment when configured)
  /*
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel(severity)
      if (context) {
        if (context.component) scope.setTag('component', context.component)
        if (context.extra) scope.setExtras(context.extra)
      }
      Sentry.captureMessage(message)
    })
  }
  */
}

/**
 * Set user context for error reports
 * Call this after user logs in
 */
export function setUserContext(user: { id: string; email?: string }): void {
  // Sentry user context (uncomment when configured)
  /*
  if (SENTRY_DSN) {
    Sentry.setUser({ id: user.id, email: user.email })
  }
  */
  
  if (!IS_PRODUCTION) {
    console.log('[ErrorMonitoring] User context set:', user.id)
  }
}

/**
 * Clear user context
 * Call this after user logs out
 */
export function clearUserContext(): void {
  // Sentry clear user (uncomment when configured)
  /*
  if (SENTRY_DSN) {
    Sentry.setUser(null)
  }
  */
  
  if (!IS_PRODUCTION) {
    console.log('[ErrorMonitoring] User context cleared')
  }
}

/**
 * Get recent errors (for debugging/admin panels)
 */
export function getRecentErrors(limit: number = 10) {
  return errorLog.slice(-limit)
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0
}

/**
 * Wrap an async function with error capturing
 */
export function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  return fn().catch((error) => {
    captureError(error, 'error', context)
    throw error
  })
}

/**
 * Error boundary wrapper for React components
 * Use this to wrap components that might throw
 */
export function createErrorHandler(componentName: string) {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    captureError(error, 'error', {
      component: componentName,
      extra: { componentStack: errorInfo?.componentStack },
    })
  }
}

// Export for convenience
export const errorMonitoring = {
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  getRecentErrors,
  clearErrorLog,
  withErrorCapture,
  createErrorHandler,
}

export default errorMonitoring
