import { useState, useEffect } from 'react'
import StormMap from '../components/map/StormMap'
import { Storm } from '../types/storm'
import { Calendar, MapPin, Search, SlidersHorizontal, Download, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { stormService } from '../lib/stormService'

export default function StormsPage() {
  const [storms, setStorms] = useState<Storm[]>([])
  const [filteredStorms, setFilteredStorms] = useState<Storm[]>([])
  const [selectedStorm, setSelectedStorm] = useState<Storm | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string[]>([])
  const [stateFilter, setStateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadStorms()
  }, [])

  useEffect(() => {
    filterStorms()
  }, [storms, searchQuery, severityFilter, stateFilter])

  const loadStorms = async () => {
    try {
      setLoading(true)
      const data = await stormService.getStorms({ limit: 1000 })
      setStorms(data)
      setFilteredStorms(data)
      setLoading(false)
      toast.success(`Loaded ${data.length} storms from NOAA`)
    } catch (error) {
      console.error('Error loading storms:', error)
      toast.error('Failed to load storms. Check Supabase connection.')
      setLoading(false)
    }
  }

  const filterStorms = () => {
    let filtered = [...storms]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(storm =>
        storm.name?.toLowerCase().includes(query) ||
        storm.state?.toLowerCase().includes(query) ||
        storm.county?.toLowerCase().includes(query)
      )
    }

    if (severityFilter.length > 0) {
      filtered = filtered.filter(storm => severityFilter.includes(storm.severity || ''))
    }

    if (stateFilter) {
      filtered = filtered.filter(storm => storm.state === stateFilter)
    }

    setFilteredStorms(filtered)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-100 text-red-800 border-red-300'
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const getSeverityLabel = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1)
  }

  const exportStorms = () => {
    const csv = [
      ['Event ID', 'Name', 'State', 'County', 'Date', 'Severity', 'Hail Size', 'Properties', 'Damage'],
      ...filteredStorms.map(s => [
        s.event_id,
        s.name,
        s.state,
        s.county || '',
        new Date(s.date).toLocaleDateString(),
        s.severity || '',
        s.hail_size || '',
        s.affected_properties || 0,
        s.estimated_damage || 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storms-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exported storms to CSV')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NOAA storm data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Storm Tracker</h1>
            <p className="text-gray-500 text-sm">{filteredStorms.length} storms found</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadStorms}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={exportStorms}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search storms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {(severityFilter.length > 0 || stateFilter) && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {severityFilter.length + (stateFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <div className="flex flex-wrap gap-2">
                  {['mild', 'moderate', 'severe', 'extreme'].map(severity => (
                    <button
                      key={severity}
                      onClick={() => {
                        setSeverityFilter(prev =>
                          prev.includes(severity)
                            ? prev.filter(s => s !== severity)
                            : [...prev, severity]
                        )
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                        severityFilter.includes(severity)
                          ? getSeverityColor(severity)
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {getSeverityLabel(severity)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All States</option>
                  {Array.from(new Set(storms.map(s => s.state))).sort().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSeverityFilter([])
                  setStateFilter('')
                  setSearchQuery('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map and Storm List */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Storm List */}
        <div className="h-48 sm:h-64 lg:h-auto lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto shrink-0">
          <div className="p-4 space-y-2">
            {filteredStorms.map((storm) => (
              <div
                key={storm.id}
                onClick={() => setSelectedStorm(storm)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedStorm?.id === storm.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{storm.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(storm.severity || 'mild')}`}>
                    {getSeverityLabel(storm.severity || 'mild')}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{storm.county}, {storm.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(storm.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium">Hail: {storm.hail_size}"</span>
                    <span className="text-gray-500">{storm.affected_properties} properties</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredStorms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No storms found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <StormMap storms={filteredStorms} selectedStorm={selectedStorm} />
        </div>
      </div>
    </div>
  )
}
