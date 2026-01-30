import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Home, User, MapPin, DollarSign, Phone, Mail, Loader2, UserPlus, Search } from 'lucide-react'
import type { PropertyMarker } from '../map/StormMap'
import { skipTraceService, SkipTraceResult } from '../../lib/skipTraceService'
import toast from 'react-hot-toast'

interface PropertyDetailModalProps {
  property: PropertyMarker
  stormInfo?: {
    date?: string
    severity?: string
    magnitude?: number
  }
  onClose: () => void
  onAddToLeads: (property: PropertyMarker, skipTraceData?: SkipTraceResult) => void
  isAddingLead?: boolean
}

/**
 * Custom hook for focus trap within a modal
 * Keeps focus within the modal while it's open
 */
function useFocusTrap(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the modal when it opens
    const modal = modalRef.current
    if (modal) {
      // Find all focusable elements within the modal
      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      // Focus the first focusable element
      firstFocusable?.focus()

      // Handle tab key to trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          // Shift + Tab: if on first element, move to last
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else {
          // Tab: if on last element, move to first
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        // Restore focus to the previously focused element
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen])

  return modalRef
}

export default function PropertyDetailModal({
  property,
  stormInfo,
  onClose,
  onAddToLeads,
  isAddingLead = false
}: PropertyDetailModalProps) {
  const [skipTraceResult, setSkipTraceResult] = useState<SkipTraceResult | null>(null)
  const [isSkipTracing, setIsSkipTracing] = useState(false)
  const [showSkipTraceWarning, setShowSkipTraceWarning] = useState(false)
  
  // Use focus trap hook
  const modalRef = useFocusTrap(true)

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleSkipTrace = async () => {
    if (!skipTraceService.isConfigured()) {
      toast.error('Skip tracing is not configured. Set VITE_BATCHDATA_API_KEY in .env')
      return
    }

    // Show warning about cost
    if (!showSkipTraceWarning) {
      setShowSkipTraceWarning(true)
      return
    }

    setIsSkipTracing(true)
    setShowSkipTraceWarning(false)

    try {
      // Parse address components
      const addressParts = property.address.split(',').map(s => s.trim())
      const street = addressParts[0] || property.address
      
      const result = await skipTraceService.skipTrace({
        firstName: property.ownerName,
        address: street,
        city: '', // Would need to be passed from ArcGIS data
        state: 'WI',
        zip: ''
      })

      setSkipTraceResult(result)

      if (result.success && (result.phones.length > 0 || result.emails.length > 0)) {
        toast.success('Skip trace completed!')
      } else if (!result.success) {
        toast.error(result.error || 'Skip trace failed')
      } else {
        toast('No contact information found', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error('Skip trace error:', error)
      toast.error('Failed to skip trace')
    } finally {
      setIsSkipTracing(false)
    }
  }

  const handleAddToLeads = () => {
    onAddToLeads(property, skipTraceResult || undefined)
  }

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
      aria-describedby="property-modal-description"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center" aria-hidden="true">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 id="property-modal-title" className="text-lg font-semibold text-gray-900">Property Details</h2>
              <p id="property-modal-description" className="text-sm text-gray-500">Potential lead from storm damage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close property details modal"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Property Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{property.address}</p>
              </div>
            </div>

            {property.ownerName && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium text-gray-900">{property.ownerName}</p>
                </div>
              </div>
            )}

            {property.estimatedValue && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Estimated Value</p>
                  <p className="font-medium text-gray-900">
                    ${property.estimatedValue.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Storm Info */}
          {stormInfo && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 mb-2">Storm Exposure</h4>
              <div className="text-sm text-amber-800 space-y-1">
                {stormInfo.date && (
                  <p>Date: {new Date(stormInfo.date).toLocaleDateString()}</p>
                )}
                {stormInfo.severity && (
                  <p>Severity: {stormInfo.severity.charAt(0).toUpperCase() + stormInfo.severity.slice(1)}</p>
                )}
                {stormInfo.magnitude && (
                  <p>Hail Size: {stormInfo.magnitude}"</p>
                )}
              </div>
            </div>
          )}

          {/* Skip Trace Results */}
          {skipTraceResult && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Contact Information</h4>
              
              {skipTraceResult.phones.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-green-700 uppercase font-medium mb-2">Phone Numbers</p>
                  <div className="space-y-2">
                    {skipTraceResult.phones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        <a 
                          href={`tel:${phone.number.replace(/\D/g, '')}`}
                          className="text-green-800 hover:text-green-900 font-medium"
                        >
                          {phone.number}
                        </a>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          {phone.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skipTraceResult.emails.length > 0 && (
                <div>
                  <p className="text-xs text-green-700 uppercase font-medium mb-2">Email Addresses</p>
                  <div className="space-y-2">
                    {skipTraceResult.emails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <a 
                          href={`mailto:${email.address}`}
                          className="text-green-800 hover:text-green-900 font-medium"
                        >
                          {email.address}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skipTraceResult.phones.length === 0 && skipTraceResult.emails.length === 0 && (
                <p className="text-sm text-green-700">No contact information found.</p>
              )}
            </div>
          )}

          {/* Skip Trace Warning */}
          {showSkipTraceWarning && (
            <div 
              className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              role="alert"
              aria-live="polite"
            >
              <h4 className="font-medium text-yellow-900 mb-2">Skip Trace Cost</h4>
              <p className="text-sm text-yellow-800 mb-3">
                Skip tracing uses a paid service (BatchData) and will incur a cost. 
                Are you sure you want to proceed?
              </p>
              <div className="flex gap-2" role="group" aria-label="Skip trace confirmation">
                <button
                  onClick={handleSkipTrace}
                  className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
                  aria-label="Confirm skip trace"
                >
                  Yes, Skip Trace
                </button>
                <button
                  onClick={() => setShowSkipTraceWarning(false)}
                  className="px-3 py-1.5 bg-white text-yellow-700 text-sm font-medium rounded-lg border border-yellow-300 hover:bg-yellow-50"
                  aria-label="Cancel skip trace"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3" role="group" aria-label="Property actions">
          {!skipTraceResult && !showSkipTraceWarning && (
            <button
              onClick={handleSkipTrace}
              disabled={isSkipTracing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              aria-label={isSkipTracing ? 'Skip trace in progress' : 'Run skip trace to find owner contact information'}
              aria-busy={isSkipTracing}
            >
              {isSkipTracing ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="w-4 h-4" aria-hidden="true" />
              )}
              {isSkipTracing ? 'Skip Tracing...' : 'Skip Trace'}
            </button>
          )}

          <button
            onClick={handleAddToLeads}
            disabled={isAddingLead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto"
            aria-label={isAddingLead ? 'Adding property to leads' : 'Add this property as a new lead'}
            aria-busy={isAddingLead}
          >
            {isAddingLead ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="w-4 h-4" aria-hidden="true" />
            )}
            {isAddingLead ? 'Adding...' : 'Add to Leads'}
          </button>
        </div>
      </div>
    </div>
  )
}
