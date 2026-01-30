import { useState } from 'react'
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  X, 
  RefreshCw, 
  Download, 
  ArrowLeft,
  Home,
  DollarSign,
  Filter,
  CloudRain
} from 'lucide-react'
import type { StormPath } from '../map/StormMap'

// Storm filter state
export interface StormFilters {
  searchQuery: string
  severityFilter: string[]
  dateRange: { start: string; end: string }
  showPaths: boolean
  showPoints: boolean
}

// Property filter state  
export interface PropertyFilters {
  searchQuery: string
  hailSizeFilter: string[]
  valueRange: { min: number | null; max: number | null }
  leadStatusFilter: 'all' | 'leads' | 'not_leads'
  propertyClassFilter: string[]
}

interface FilterBarProps {
  // View mode
  mode: 'storms' | 'leads'
  
  // Selected storm path (for lead mode header)
  selectedStormPath?: StormPath | null
  
  // Storm mode props
  stormFilters?: StormFilters
  onStormFiltersChange?: (filters: Partial<StormFilters>) => void
  stormCount?: number
  totalStormCount?: number
  
  // Property/Lead mode props
  propertyFilters?: PropertyFilters
  onPropertyFiltersChange?: (filters: Partial<PropertyFilters>) => void
  propertyCount?: number
  selectedPropertyCount?: number
  
  // Actions
  onRefresh?: () => void
  onExport?: () => void
  onBackToStorms?: () => void
}

const SEVERITY_OPTIONS = ['light', 'moderate', 'severe', 'extreme'] as const
const HAIL_SIZE_OPTIONS = [
  { value: 'light', label: '<1"', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'moderate', label: '1-1.5"', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'severe', label: '1.5-2"', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'extreme', label: '2"+', color: 'bg-red-100 text-red-700 border-red-200' },
]
// Property class options for future use
// const PROPERTY_CLASS_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Agricultural']

export default function FilterBar({
  mode,
  selectedStormPath,
  stormFilters,
  onStormFiltersChange,
  stormCount = 0,
  totalStormCount = 0,
  propertyFilters,
  onPropertyFiltersChange,
  propertyCount = 0,
  selectedPropertyCount = 0,
  onRefresh,
  onExport,
  onBackToStorms,
}: FilterBarProps) {
  const [showExpandedFilters, setShowExpandedFilters] = useState(false)

  // Storm mode filter helpers
  const getSeverityColor = (severity: string, isActive: boolean) => {
    if (!isActive) return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    switch (severity) {
      case 'extreme': return 'bg-red-100 text-red-800 border-red-300'
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'light': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const toggleSeverityFilter = (severity: string) => {
    if (!stormFilters || !onStormFiltersChange) return
    const newFilter = stormFilters.severityFilter.includes(severity)
      ? stormFilters.severityFilter.filter(s => s !== severity)
      : [...stormFilters.severityFilter, severity]
    onStormFiltersChange({ severityFilter: newFilter })
  }

  const toggleHailSizeFilter = (size: string) => {
    if (!propertyFilters || !onPropertyFiltersChange) return
    const newFilter = propertyFilters.hailSizeFilter.includes(size)
      ? propertyFilters.hailSizeFilter.filter(s => s !== size)
      : [...propertyFilters.hailSizeFilter, size]
    onPropertyFiltersChange({ hailSizeFilter: newFilter })
  }

  const activeFilterCount = mode === 'storms'
    ? (stormFilters?.severityFilter.length || 0) + 
      (stormFilters?.dateRange.start ? 1 : 0) + 
      (stormFilters?.dateRange.end ? 1 : 0)
    : (propertyFilters?.hailSizeFilter.length || 0) +
      (propertyFilters?.valueRange.min !== null ? 1 : 0) +
      (propertyFilters?.valueRange.max !== null ? 1 : 0) +
      (propertyFilters?.leadStatusFilter !== 'all' ? 1 : 0)

  const clearFilters = () => {
    if (mode === 'storms' && onStormFiltersChange) {
      onStormFiltersChange({
        searchQuery: '',
        severityFilter: [],
        dateRange: { start: '', end: '' }
      })
    } else if (mode === 'leads' && onPropertyFiltersChange) {
      onPropertyFiltersChange({
        searchQuery: '',
        hailSizeFilter: [],
        valueRange: { min: null, max: null },
        leadStatusFilter: 'all',
        propertyClassFilter: []
      })
    }
  }

  // ===== STORM MODE UI =====
  if (mode === 'storms') {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0" role="search" aria-label="Storm filters">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, state, or county..."
              value={stormFilters?.searchQuery || ''}
              onChange={(e) => onStormFiltersChange?.({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search storms by name, state, or county"
            />
            {stormFilters?.searchQuery && (
              <button
                onClick={() => onStormFiltersChange?.({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Date Range */}
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Date range filter</legend>
            <Calendar className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="date"
              value={stormFilters?.dateRange.start || ''}
              onChange={(e) => onStormFiltersChange?.({ 
                dateRange: { ...stormFilters?.dateRange, start: e.target.value, end: stormFilters?.dateRange.end || '' }
              })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Start date"
            />
            <span className="text-gray-400" aria-hidden="true">to</span>
            <input
              type="date"
              value={stormFilters?.dateRange.end || ''}
              onChange={(e) => onStormFiltersChange?.({ 
                dateRange: { ...stormFilters?.dateRange, end: e.target.value, start: stormFilters?.dateRange.start || '' }
              })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="End date"
            />
          </fieldset>

          {/* View Toggles */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="Map layer toggles">
            <button
              onClick={() => onStormFiltersChange?.({ showPaths: !stormFilters?.showPaths })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                stormFilters?.showPaths ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={stormFilters?.showPaths}
              aria-label="Toggle storm path polygons on map"
              title="Toggle storm paths"
            >
              Paths
            </button>
            <button
              onClick={() => onStormFiltersChange?.({ showPoints: !stormFilters?.showPoints })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                stormFilters?.showPoints ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={stormFilters?.showPoints}
              aria-label="Toggle storm point markers on map"
              title="Toggle storm points"
            >
              Points
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowExpandedFilters(!showExpandedFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showExpandedFilters || activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            aria-expanded={showExpandedFilters}
            aria-controls="severity-filters"
            aria-label={`${activeFilterCount > 0 ? `${activeFilterCount} active filters, ` : ''}${showExpandedFilters ? 'Hide' : 'Show'} severity filters`}
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full" aria-hidden="true">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto" role="group" aria-label="Storm actions">
            <span className="text-sm text-gray-500" aria-live="polite">
              {stormCount} of {totalStormCount} storms
            </span>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              aria-label="Refresh storm data"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Refresh
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              aria-label="Export storms to CSV"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {showExpandedFilters && (
          <div id="severity-filters" className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4" role="group" aria-label="Severity filters">
            <span id="severity-label" className="text-sm text-gray-600">Severity:</span>
            <div className="flex gap-2" role="group" aria-labelledby="severity-label">
              {SEVERITY_OPTIONS.map(severity => {
                const isActive = stormFilters?.severityFilter.includes(severity) || false
                return (
                  <button
                    key={severity}
                    onClick={() => toggleSeverityFilter(severity)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                      getSeverityColor(severity, isActive)
                    }`}
                    aria-pressed={isActive}
                    aria-label={`Filter by ${severity} severity${isActive ? ' (active)' : ''}`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                )
              })}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
                aria-label="Clear all active filters"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // ===== LEAD MODE UI =====
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      {/* Header with Back Button and Storm Info */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onBackToStorms}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Storms
        </button>
        
        {/* Selected Storm Info */}
        {selectedStormPath && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <div>
              <span className="font-medium text-blue-900">
                {selectedStormPath.county}, {selectedStormPath.state}
              </span>
              <span className="mx-2 text-blue-400">|</span>
              <span className="text-sm text-blue-700">
                {selectedStormPath.begin_date && new Date(selectedStormPath.begin_date).toLocaleDateString()}
              </span>
              <span className="mx-2 text-blue-400">|</span>
              <span className="text-sm text-blue-700">
                {selectedStormPath.magnitude}" hail
              </span>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">
            <Home className="w-4 h-4 inline mr-1" />
            {propertyCount} properties
            {selectedPropertyCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedPropertyCount} selected)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Property Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address or owner name..."
            value={propertyFilters?.searchQuery || ''}
            onChange={(e) => onPropertyFiltersChange?.({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {propertyFilters?.searchQuery && (
            <button
              onClick={() => onPropertyFiltersChange?.({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hail Size Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hail Size:</span>
          <div className="flex gap-1">
            {HAIL_SIZE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => toggleHailSizeFilter(option.value)}
                className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                  propertyFilters?.hailSizeFilter.includes(option.value)
                    ? option.color
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Value Range */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="Min"
            value={propertyFilters?.valueRange.min ?? ''}
            onChange={(e) => onPropertyFiltersChange?.({ 
              valueRange: { 
                ...propertyFilters?.valueRange, 
                min: e.target.value ? Number(e.target.value) : null,
                max: propertyFilters?.valueRange.max ?? null
              }
            })}
            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={propertyFilters?.valueRange.max ?? ''}
            onChange={(e) => onPropertyFiltersChange?.({ 
              valueRange: { 
                ...propertyFilters?.valueRange, 
                max: e.target.value ? Number(e.target.value) : null,
                min: propertyFilters?.valueRange.min ?? null
              }
            })}
            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lead Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={propertyFilters?.leadStatusFilter || 'all'}
            onChange={(e) => onPropertyFiltersChange?.({ 
              leadStatusFilter: e.target.value as 'all' | 'leads' | 'not_leads'
            })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Properties</option>
            <option value="not_leads">Not Added as Leads</option>
            <option value="leads">Already Leads</option>
          </select>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
