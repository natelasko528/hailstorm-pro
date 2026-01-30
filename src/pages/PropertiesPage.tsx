import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, DollarSign, Phone, Mail, MessageSquare, Star, Download, ExternalLink, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadService, Lead, LeadNote } from '../lib/leadService'
import { stormService } from '../lib/stormService'
import type { StormEvent } from '../types/database'

export default function PropertiesPage() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [storm, setStorm] = useState<StormEvent | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  // Sample property images (in production, these would come from storage)
  const propertyImages = [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  ]

  useEffect(() => {
    if (id) {
      loadLead()
    }
  }, [id])

  const loadLead = async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const leadData = await leadService.getLead(id)
      setLead(leadData)
      
      // Load associated storm if exists
      if (leadData.storm_id) {
        try {
          const storms = await stormService.getStorms({ limit: 1 })
          const matchingStorm = storms.find(s => s.event_id === leadData.storm_id)
          if (matchingStorm) setStorm(matchingStorm)
        } catch (e) {
          console.warn('Could not load storm data:', e)
        }
      }
      
      // Load notes
      try {
        const notesData = await leadService.getLeadNotes(id)
        setNotes(notesData)
      } catch (e) {
        console.warn('Could not load notes:', e)
      }
    } catch (err: any) {
      console.error('Error loading lead:', err)
      setError(err.message || 'Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: Lead['status']) => {
    if (!lead) return
    
    setUpdatingStatus(true)
    try {
      const updated = await leadService.updateLeadStatus(lead.id, newStatus)
      setLead(updated)
      toast.success('Status updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return
    
    setSavingNote(true)
    try {
      const note = await leadService.addLeadNote(lead.id, newNote.trim())
      setNotes([note, ...notes])
      setNewNote('')
      toast.success('Note added!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await leadService.deleteLeadNote(noteId)
      setNotes(notes.filter(n => n.id !== noteId))
      toast.success('Note deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete note')
    }
  }

  const handleCall = () => {
    if (lead?.phone) {
      window.open(`tel:${lead.phone}`, '_self')
    } else {
      toast.error('No phone number available')
    }
  }

  const handleEmail = () => {
    if (lead?.email) {
      window.open(`mailto:${lead.email}`, '_self')
    } else {
      toast.error('No email address available')
    }
  }

  const handleSMS = () => {
    if (lead?.phone) {
      window.open(`sms:${lead.phone}`, '_self')
    } else {
      toast.error('No phone number available')
    }
  }

  const handleGenerateReport = () => {
    toast.success('Report generation coming soon!')
  }

  // Calculate damage probability based on lead data
  const calculateDamageProbability = () => {
    if (!lead) return 0
    let prob = 50
    if (lead.damage_severity === 'severe') prob += 30
    else if (lead.damage_severity === 'moderate') prob += 15
    if (lead.roof_age && lead.roof_age > 15) prob += 15
    if (storm?.magnitude && storm.magnitude > 1.5) prob += 10
    return Math.min(prob, 99)
  }

  // Calculate estimated repair cost
  const calculateRepairCost = () => {
    if (!lead) return 0
    const baseValue = lead.property_value || 200000
    let multiplier = 0.03 // 3% of property value
    if (lead.damage_severity === 'severe') multiplier = 0.05
    else if (lead.damage_severity === 'moderate') multiplier = 0.04
    return Math.round(baseValue * multiplier)
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <Link 
          to="/app/leads"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Property Not Found</h2>
          <p className="text-red-600">{error || 'The requested property could not be found.'}</p>
          <Link 
            to="/app/leads"
            className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Return to Leads
          </Link>
        </div>
      </div>
    )
  }

  const damageProbability = calculateDamageProbability()
  const estimatedRepairCost = calculateRepairCost()
  const severityLevel = lead.damage_severity === 'severe' ? 4 : lead.damage_severity === 'moderate' ? 3 : 2

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Back Button */}
      <Link 
        to="/app/leads"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images Gallery */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative h-96 bg-gray-900">
              <img 
                src={propertyImages[selectedImage]} 
                alt="Property view"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm font-medium">
                {selectedImage + 1} / {propertyImages.length}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50">
              {propertyImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Property Type</p>
                  <p className="text-base font-semibold text-gray-900">Residential</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="text-base font-semibold text-gray-900">{lead.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">City/State</p>
                  <p className="text-base font-semibold text-gray-900">{lead.city}, {lead.state} {lead.zip}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Property Value</p>
                  <p className="text-base font-semibold text-gray-900">
                    {lead.property_value ? `$${lead.property_value.toLocaleString()}` : 'Not available'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Roof Age</p>
                  <p className="text-base font-semibold text-gray-900">
                    {lead.roof_age ? `${lead.roof_age} years` : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Damage Severity</p>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {lead.damage_severity || 'Not assessed'}
                  </p>
                </div>
                {storm && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Storm Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(storm.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Hail Size</p>
                      <p className="text-base font-semibold text-gray-900">{storm.magnitude}"</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Damage Assessment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Damage Assessment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Damage Probability</p>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{damageProbability}%</p>
                <p className="text-xs text-gray-600 mt-1">
                  {damageProbability > 70 ? 'High likelihood' : damageProbability > 50 ? 'Moderate likelihood' : 'Lower likelihood'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Severity Level</p>
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{severityLevel}/4</p>
                <p className="text-xs text-gray-600 mt-1 capitalize">{lead.damage_severity || 'Unknown'} damage</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Est. Repair Cost</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">${(estimatedRepairCost / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-600 mt-1">Average estimate</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Inspection Recommended</h4>
                  <p className="text-sm text-yellow-800">
                    Based on the {storm?.magnitude || '1.0'}" hail size and {lead.roof_age || 'unknown'} year old roof, 
                    we highly recommend scheduling an in-person inspection to assess potential damage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Timeline</h2>
            
            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activity notes yet. Add the first note below.</p>
              ) : (
                notes.map((note, idx) => (
                  <div key={note.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      {idx < notes.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">Note</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600">{note.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this lead..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
              />
              <button 
                onClick={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  '+ Add Note'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Owner Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Owner Information</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="text-base font-semibold text-gray-900">{lead.owner_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-900">
                    {lead.address}<br />
                    {lead.city}, {lead.state} {lead.zip}
                  </p>
                </div>
              </div>

              {lead.phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {lead.phone}
                  </a>
                </div>
              )}

              {lead.email && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium break-all">
                    {lead.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lead Score */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-bold mb-2">Lead Score</h3>
            <div className="text-5xl font-bold mb-2">{lead.lead_score || 0}</div>
            <p className="text-blue-100 text-sm">
              {(lead.lead_score || 0) >= 80 ? 'High priority lead' : 
               (lead.lead_score || 0) >= 60 ? 'Medium priority lead' : 'Lower priority lead'}
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-blue-100 mb-2">Score Factors:</p>
              <ul className="space-y-1 text-sm">
                {damageProbability > 70 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>High damage probability</span>
                  </li>
                )}
                {lead.roof_age && lead.roof_age > 15 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Older roof ({lead.roof_age} years)</span>
                  </li>
                )}
                {storm?.magnitude && storm.magnitude > 1.5 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Large hail size ({storm.magnitude}")</span>
                  </li>
                )}
                {lead.property_value && lead.property_value > 250000 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>High property value</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={handleCall}
                disabled={!lead.phone}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Owner
              </button>

              <button 
                onClick={handleEmail}
                disabled={!lead.email}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send Email
              </button>

              <button 
                onClick={handleSMS}
                disabled={!lead.phone}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Send SMS
              </button>

              <button 
                onClick={handleGenerateReport}
                className="w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Generate Report
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address + ' ' + lead.city + ' ' + lead.state)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                View on Maps
              </a>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
            
            <select 
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as Lead['status'])}
              disabled={updatingStatus}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3 disabled:opacity-50"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="appointment">Appointment Set</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {updatingStatus ? 'Updating...' : `Last updated: ${new Date(lead.updated_at).toLocaleDateString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
