import { useState, useEffect, useRef, useCallback } from 'react'
import { X, User, MapPin, Phone, Mail, DollarSign, Home, Calendar, FileText, Loader2, Save } from 'lucide-react'
import type { Lead, LeadStatus, DamageSeverity } from '../../types/database'
import { leadService } from '../../lib/leadService'
import toast from 'react-hot-toast'

interface EditLeadModalProps {
  lead: Lead
  onClose: () => void
  onSave: (updatedLead: Lead) => void
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const DAMAGE_OPTIONS: { value: DamageSeverity | ''; label: string }[] = [
  { value: '', label: 'Not assessed' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
]

/**
 * Custom hook for focus trap within a modal
 */
function useFocusTrap(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement

    const modal = modalRef.current
    if (modal) {
      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      firstFocusable?.focus()

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen])

  return modalRef
}

export default function EditLeadModal({ lead, onClose, onSave }: EditLeadModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    owner_name: lead.owner_name,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    zip: lead.zip,
    phone: lead.phone || '',
    email: lead.email || '',
    status: lead.status,
    damage_severity: lead.damage_severity || '',
    roof_age: lead.roof_age?.toString() || '',
    property_value: lead.property_value?.toString() || '',
    lead_score: lead.lead_score?.toString() || '',
    notes: lead.notes || '',
  })

  const modalRef = useFocusTrap(true)

  // Track changes
  useEffect(() => {
    const changed = 
      formData.owner_name !== lead.owner_name ||
      formData.address !== lead.address ||
      formData.city !== lead.city ||
      formData.state !== lead.state ||
      formData.zip !== lead.zip ||
      formData.phone !== (lead.phone || '') ||
      formData.email !== (lead.email || '') ||
      formData.status !== lead.status ||
      formData.damage_severity !== (lead.damage_severity || '') ||
      formData.roof_age !== (lead.roof_age?.toString() || '') ||
      formData.property_value !== (lead.property_value?.toString() || '') ||
      formData.lead_score !== (lead.lead_score?.toString() || '') ||
      formData.notes !== (lead.notes || '')
    
    setHasChanges(changed)
  }, [formData, lead])

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (hasChanges) {
        if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
          onClose()
        }
      } else {
        onClose()
      }
    }
  }, [onClose, hasChanges])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasChanges) {
      onClose()
      return
    }

    setIsSaving(true)

    try {
      // Build update object with proper types
      const updates: Partial<Lead> = {
        owner_name: formData.owner_name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        phone: formData.phone || null,
        email: formData.email || null,
        status: formData.status as LeadStatus,
        damage_severity: formData.damage_severity ? formData.damage_severity as DamageSeverity : null,
        roof_age: formData.roof_age ? parseInt(formData.roof_age, 10) : null,
        property_value: formData.property_value ? parseInt(formData.property_value.replace(/,/g, ''), 10) : null,
        lead_score: formData.lead_score ? parseInt(formData.lead_score, 10) : null,
        notes: formData.notes || null,
      }

      const updatedLead = await leadService.updateLead(lead.id, updates)
      toast.success('Lead updated successfully')
      onSave(updatedLead)
      onClose()
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-lead-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 id="edit-lead-title" className="text-lg font-semibold text-gray-900">Edit Lead</h2>
              <p className="text-sm text-gray-500">{lead.address}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Owner Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Owner Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => handleChange('owner_name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="owner@email.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      required
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP *
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => handleChange('zip', e.target.value)}
                      required
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-400" />
                Property Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="damage_severity" className="block text-sm font-medium text-gray-700 mb-1">
                    Damage Severity
                  </label>
                  <select
                    id="damage_severity"
                    value={formData.damage_severity}
                    onChange={(e) => handleChange('damage_severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DAMAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="roof_age" className="block text-sm font-medium text-gray-700 mb-1">
                    Roof Age (years)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      id="roof_age"
                      value={formData.roof_age}
                      onChange={(e) => handleChange('roof_age', e.target.value)}
                      min="0"
                      max="100"
                      placeholder="e.g. 15"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="property_value" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Value
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="property_value"
                      value={formData.property_value}
                      onChange={(e) => handleChange('property_value', e.target.value.replace(/[^0-9,]/g, ''))}
                      placeholder="e.g. 250,000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Score */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Lead Score
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="lead_score"
                  value={formData.lead_score || 50}
                  onChange={(e) => handleChange('lead_score', e.target.value)}
                  min="0"
                  max="100"
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold min-w-[60px] text-center ${
                  parseInt(formData.lead_score || '0') >= 70 ? 'bg-green-100 text-green-800'
                  : parseInt(formData.lead_score || '0') >= 40 ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                  {formData.lead_score || 0}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Notes
              </h3>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                placeholder="Add any notes about this lead..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between sticky bottom-0">
            <div className="text-sm text-gray-500">
              {hasChanges ? (
                <span className="text-amber-600 font-medium">Unsaved changes</span>
              ) : (
                <span>No changes</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
