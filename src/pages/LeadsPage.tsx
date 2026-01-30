import { useState, useEffect, useMemo } from 'react'
import { Search, Download, Phone, Mail, MapPin, Star, ChevronLeft, ChevronRight, Loader2, Trash2, Edit2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { leadService, type Lead } from '../lib/leadService'
import { SkeletonTable } from '../components/ui/Skeleton'
import { useDebounce } from '../lib/utils'
import EditLeadModal from '../components/leads/EditLeadModal'

const PAGE_SIZE = 25
const STATUS_OPTIONS: Lead['status'][] = ['new', 'contacted', 'qualified', 'appointment', 'won', 'lost']

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // Debounce search by 300ms
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'all'>('all')
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'value'>('score')
  
  // Bulk action states
  const [bulkStatusValue, setBulkStatusValue] = useState<Lead['status']>('contacted')
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  
  // Edit modal state
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadLeads()
  }, [currentPage, statusFilter, scoreFilter, sortBy])

  // Reset to first page when filters change (use debounced search query)
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, scoreFilter, sortBy, debouncedSearchQuery])

  const loadLeads = async () => {
    try {
      setLoading(true)
      
      // Build filters for the API
      const filters: Parameters<typeof leadService.getLeadsPaginated>[0] = {
        page: currentPage,
        pageSize: PAGE_SIZE,
        sortBy: sortBy === 'score' ? 'lead_score' : sortBy === 'date' ? 'created_at' : 'property_value',
        sortOrder: 'desc',
      }
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }
      
      if (scoreFilter === 'high') {
        filters.minScore = 70
      } else if (scoreFilter === 'medium') {
        filters.minScore = 40
      }

      const result = await leadService.getLeadsPaginated(filters)
      setLeads(result.leads)
      setTotalCount(result.total)
      setLoading(false)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads. Check Supabase connection.')
      setLoading(false)
    }
  }

  // Client-side search filtering (applied after pagination) with debounced query
  const filteredLeads = useMemo(() => {
    if (!debouncedSearchQuery) return leads
    
    const query = debouncedSearchQuery.toLowerCase()
    return leads.filter(lead =>
      lead.owner_name.toLowerCase().includes(query) ||
      lead.address.toLowerCase().includes(query) ||
      lead.city.toLowerCase().includes(query)
    )
  }, [leads, debouncedSearchQuery])

  // Filter for medium score (40-69) client-side
  const displayLeads = useMemo(() => {
    if (scoreFilter === 'medium') {
      return filteredLeads.filter(lead => (lead.lead_score || 0) < 70)
    }
    if (scoreFilter === 'low') {
      return filteredLeads.filter(lead => (lead.lead_score || 0) < 40)
    }
    return filteredLeads
  }, [filteredLeads, scoreFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await leadService.updateLeadStatus(leadId, newStatus)
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ))
      toast.success('Lead status updated')
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead status')
    }
  }

  // Handle lead edit save
  const handleLeadSave = (updatedLead: Lead) => {
    setLeads(leads.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    ))
  }

  const getScoreColor = (score: number | null) => {
    const s = score || 0
    if (s >= 70) return 'text-green-600 bg-green-100'
    if (s >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800 border-blue-300',
      contacted: 'bg-purple-100 text-purple-800 border-purple-300',
      qualified: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      appointment: 'bg-orange-100 text-orange-800 border-orange-300',
      won: 'bg-green-100 text-green-800 border-green-300',
      lost: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colors[status]
  }

  const exportLeads = async () => {
    try {
      // Fetch all leads for export (without pagination)
      const allLeads = await leadService.getLeads({ limit: 5000 })
      
      const csv = [
        ['Owner', 'Address', 'City', 'State', 'Zip', 'Phone', 'Email', 'Score', 'Status', 'Damage', 'Property Value'],
        ...allLeads.map(l => [
          l.owner_name,
          l.address,
          l.city,
          l.state,
          l.zip,
          l.phone || '',
          l.email || '',
          l.lead_score || '',
          l.status,
          l.damage_severity || '',
          l.property_value || ''
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success(`Exported ${allLeads.length} leads to CSV`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export leads')
    }
  }

  const toggleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const selectAllLeads = () => {
    if (selectedLeads.size === displayLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(displayLeads.map(l => l.id)))
    }
  }

  // Bulk status update handler
  const handleBulkStatusUpdate = async () => {
    if (selectedLeads.size === 0) return

    setIsBulkUpdating(true)
    try {
      const leadIds = Array.from(selectedLeads)
      const result = await leadService.bulkUpdateStatus(leadIds, bulkStatusValue)
      
      if (result.updated > 0) {
        // Update local state
        setLeads(leads.map(lead => 
          selectedLeads.has(lead.id) ? { ...lead, status: bulkStatusValue } : lead
        ))
        toast.success(`Updated ${result.updated} lead(s) to "${bulkStatusValue}"`)
        setSelectedLeads(new Set())
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to update ${result.failed} lead(s)`)
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error('Failed to update leads')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return

    setIsBulkDeleting(true)
    try {
      const leadIds = Array.from(selectedLeads)
      const result = await leadService.bulkDelete(leadIds)
      
      if (result.deleted > 0) {
        // Remove deleted leads from local state
        setLeads(leads.filter(lead => !selectedLeads.has(lead.id)))
        setTotalCount(prev => prev - result.deleted)
        toast.success(`Deleted ${result.deleted} lead(s)`)
        setSelectedLeads(new Set())
        setShowBulkDeleteConfirm(false)
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to delete ${result.failed} lead(s)`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete leads')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setSelectedLeads(new Set()) // Clear selection on page change
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    pages.push(1)
    
    if (currentPage > 3) {
      pages.push('...')
    }
    
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...')
    }
    
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }

  if (loading && leads.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-500 mt-1">Loading leads...</p>
        </div>
        <SkeletonTable rows={10} />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
            <p className="text-gray-500 mt-1">
              {totalCount.toLocaleString()} total leads
              {displayLeads.length !== leads.length && ` • ${displayLeads.length} shown`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportLeads}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, address, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="appointment">Appointment</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Scores</option>
            <option value="high">High (70+)</option>
            <option value="medium">Medium (40-69)</option>
            <option value="low">Low (&lt;40)</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Sort by Score</option>
            <option value="date">Sort by Date</option>
            <option value="value">Sort by Value</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedLeads.size} lead(s) selected
              </span>
              
              {/* Bulk Status Update */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="bulk-status" className="text-sm text-blue-800">
                    Change status to:
                  </label>
                  <select
                    id="bulk-status"
                    value={bulkStatusValue}
                    onChange={(e) => setBulkStatusValue(e.target.value as Lead['status'])}
                    className="px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    aria-label="Select new status for selected leads"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={isBulkUpdating}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    aria-busy={isBulkUpdating}
                  >
                    {isBulkUpdating && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    Apply
                  </button>
                </div>
                
                <div className="w-px h-6 bg-blue-200" aria-hidden="true" />
                
                {/* Bulk Delete */}
                {showBulkDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    <span className="text-sm text-red-800">Delete {selectedLeads.size} leads?</span>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                      aria-busy={isBulkDeleting}
                    >
                      {isBulkDeleting && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteConfirm(false)}
                      className="px-3 py-1 text-sm font-medium text-red-700 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                    aria-label={`Delete ${selectedLeads.size} selected leads`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete
                  </button>
                )}
                
                <div className="w-px h-6 bg-blue-200" aria-hidden="true" />
                
                <button
                  onClick={() => {
                    setSelectedLeads(new Set())
                    setShowBulkDeleteConfirm(false)
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
                  aria-label="Clear selection"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === displayLeads.length && displayLeads.length > 0}
                    onChange={selectAllLeads}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-gray-500 mt-2">Loading...</p>
                  </td>
                </tr>
              ) : (
                displayLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{lead.owner_name}</p>
                        <p className="text-sm text-gray-500">{lead.address}</p>
                        {(lead.storm_id || lead.storm_path_id) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {lead.storm_id && <span>Storm: {lead.storm_id}</span>}
                            {lead.storm_id && lead.storm_path_id && ' · '}
                            {lead.storm_path_id && <span>Path linked</span>}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{lead.city}, {lead.state} {lead.zip}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-sm font-semibold ${getScoreColor(lead.lead_score)}`}>
                          {lead.lead_score || 0}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor((lead.lead_score || 0) / 20)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(lead.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="appointment">Appointment</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        ${lead.property_value?.toLocaleString() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit lead"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <Link
                          to={`/app/properties/${lead.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {displayLeads.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} leads
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {getPageNumbers().map((page, idx) => (
                typeof page === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} className="px-2 text-gray-400">...</span>
                )
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={handleLeadSave}
        />
      )}
    </div>
  )
}
