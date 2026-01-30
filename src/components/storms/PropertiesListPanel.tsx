import { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Home, 
  MapPin, 
  DollarSign, 
  ArrowUpDown,
  CheckSquare,
  Square,
  UserPlus,
  Phone,
  Loader2,
  CloudRain
} from 'lucide-react'
import type { PropertyMarker, StormPath } from '../map/StormMap'

type SortField = 'address' | 'value' | 'owner' | 'hailSize'
type SortDirection = 'asc' | 'desc'

interface PropertiesListPanelProps {
  properties: PropertyMarker[]
  selectedProperties: PropertyMarker[]
  stormPath?: StormPath | null
  loading?: boolean
  onPropertySelect: (property: PropertyMarker) => void
  onPropertyToggle: (property: PropertyMarker) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkAddToLeads: () => void
  onBulkSkipTrace: () => void
  isBulkActionLoading?: boolean
}

// Get hail size category for color coding
function getHailSizeCategory(magnitude?: number): 'light' | 'moderate' | 'severe' | 'extreme' {
  if (!magnitude) return 'moderate'
  if (magnitude >= 2.0) return 'extreme'
  if (magnitude >= 1.5) return 'severe'
  if (magnitude >= 1.0) return 'moderate'
  return 'light'
}

// Get color classes for hail size
function getHailSizeColor(category: string) {
  switch (category) {
    case 'extreme': return 'bg-red-100 text-red-700 border-red-200'
    case 'severe': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'light': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

// Get hail size label
function getHailSizeLabel(category: string) {
  switch (category) {
    case 'extreme': return '2"+'
    case 'severe': return '1.5-2"'
    case 'moderate': return '1-1.5"'
    case 'light': return '<1"'
    default: return 'N/A'
  }
}

export default function PropertiesListPanel({
  properties,
  selectedProperties,
  stormPath,
  loading = false,
  onPropertySelect,
  onPropertyToggle,
  onSelectAll,
  onClearSelection,
  onBulkAddToLeads,
  onBulkSkipTrace,
  isBulkActionLoading = false,
}: PropertiesListPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [sortField, setSortField] = useState<SortField>('value')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const selectedIds = useMemo(() => 
    new Set(selectedProperties.map(p => p.id)), 
    [selectedProperties]
  )

  const hailCategory = stormPath?.magnitude 
    ? getHailSizeCategory(stormPath.magnitude) 
    : 'moderate'

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'address':
          comparison = (a.address || '').localeCompare(b.address || '')
          break
        case 'value':
          comparison = (a.estimatedValue || 0) - (b.estimatedValue || 0)
          break
        case 'owner':
          comparison = (a.ownerName || '').localeCompare(b.ownerName || '')
          break
        case 'hailSize':
          // All properties in same storm path have same hail size, so secondary sort
          comparison = (a.estimatedValue || 0) - (b.estimatedValue || 0)
          break
      }
      
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [properties, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const selectedNonLeadCount = useMemo(() =>
    selectedProperties.filter(p => !p.isLead).length,
    [selectedProperties]
  )

  const allSelected = properties.length > 0 && selectedProperties.length === properties.length
  const someSelected = selectedProperties.length > 0 && !allSelected

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        sortField === field 
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
      {sortField === field && (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  )

  return (
    <div className="bg-white border-t border-gray-200 flex flex-col">
      {/* Panel Header - Always visible */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          )}
          <Home className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">
            Affected Properties ({properties.length})
          </span>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          )}
        </div>
        
        {/* Selection Info & Bulk Actions */}
        {expanded && (
          <div 
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Selection Controls */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
              <button
                onClick={allSelected ? onClearSelection : onSelectAll}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : someSelected ? (
                  <div className="w-4 h-4 border-2 border-blue-600 rounded bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-white" />
                  </div>
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs text-gray-500">
                {selectedProperties.length} selected
              </span>
            </div>

            {/* Bulk Actions */}
            {selectedProperties.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onBulkSkipTrace}
                  disabled={isBulkActionLoading || selectedNonLeadCount === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Skip Trace ({selectedNonLeadCount})
                </button>
                <button
                  onClick={onBulkAddToLeads}
                  disabled={isBulkActionLoading || selectedNonLeadCount === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  Add to Leads ({selectedNonLeadCount})
                </button>
              </div>
            )}

            {/* Sort Controls */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="text-xs text-gray-500">Sort:</span>
              <SortButton field="value" label="Value" />
              <SortButton field="address" label="Address" />
              <SortButton field="owner" label="Owner" />
            </div>
          </div>
        )}
      </div>

      {/* Property List - Expandable */}
      {expanded && (
        <div className="overflow-y-auto max-h-[35vh] border-t border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Finding affected properties...</span>
            </div>
          ) : sortedProperties.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <p>No properties found in this storm path.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedProperties.map((property) => {
                const isSelected = selectedIds.has(property.id)
                
                return (
                  <div
                    key={property.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    } ${property.isLead ? 'bg-green-50/50' : ''}`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPropertyToggle(property)
                      }}
                      className="flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Property Info - Click to view details */}
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => onPropertySelect(property)}
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {property.address}
                        </h4>
                        {property.isLead && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">
                            LEAD
                          </span>
                        )}
                      </div>
                      {property.ownerName && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          Owner: {property.ownerName}
                        </p>
                      )}
                    </div>

                    {/* Estimated Value */}
                    <div className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      {property.estimatedValue 
                        ? `$${property.estimatedValue.toLocaleString()}`
                        : 'N/A'
                      }
                    </div>

                    {/* Hail Size Badge */}
                    <div className="flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-gray-400" />
                      <span className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${getHailSizeColor(hailCategory)}`}>
                        {stormPath?.magnitude ? `${stormPath.magnitude}"` : getHailSizeLabel(hailCategory)}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">
                        {property.latitude?.toFixed(4)}, {property.longitude?.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
