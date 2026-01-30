import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Calendar, MapPin, CloudRain, ArrowUpDown } from 'lucide-react'
import type { StormEvent } from '../../types/database'

type SortField = 'date' | 'severity' | 'magnitude' | 'location'
type SortDirection = 'asc' | 'desc'

interface StormListPanelProps {
  storms: StormEvent[]
  selectedStorm: StormEvent | null
  onStormSelect: (storm: StormEvent) => void
  onStormDoubleClick?: (storm: StormEvent) => void
}

const severityOrder = { extreme: 4, severe: 3, moderate: 2, light: 1 }

export default function StormListPanel({
  storms,
  selectedStorm,
  onStormSelect,
  onStormDoubleClick,
}: StormListPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedStorms = useMemo(() => {
    return [...storms].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'severity':
          comparison = (severityOrder[a.severity as keyof typeof severityOrder] || 0) - 
                       (severityOrder[b.severity as keyof typeof severityOrder] || 0)
          break
        case 'magnitude':
          comparison = (a.magnitude || 0) - (b.magnitude || 0)
          break
        case 'location':
          comparison = (a.county || '').localeCompare(b.county || '')
          break
      }
      
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [storms, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-100 text-red-700 border-red-200'
      case 'severe': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'light': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

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
          <span className="font-semibold text-gray-900">
            Storms ({storms.length})
          </span>
        </div>
        
        {/* Sort Controls - Only show when expanded */}
        {expanded && (
          <div 
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-gray-500 mr-1">Sort by:</span>
            <SortButton field="date" label="Date" />
            <SortButton field="severity" label="Severity" />
            <SortButton field="magnitude" label="Size" />
            <SortButton field="location" label="Location" />
          </div>
        )}
      </div>

      {/* Storm List - Expandable */}
      {expanded && (
        <div className="overflow-y-auto max-h-[35vh] border-t border-gray-100">
          {sortedStorms.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <p>No storms found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedStorms.map((storm) => (
                <div
                  key={storm.id}
                  onClick={() => onStormSelect(storm)}
                  onDoubleClick={() => onStormDoubleClick?.(storm)}
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                    selectedStorm?.id === storm.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Storm Name & Location */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-sm">
                      {storm.name}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{storm.county}, {storm.state}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                    <Calendar className="w-3 h-3" />
                    {new Date(storm.date).toLocaleDateString()}
                  </div>

                  {/* Magnitude */}
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-700 whitespace-nowrap w-16">
                    <CloudRain className="w-3 h-3" />
                    {storm.magnitude ? `${storm.magnitude}"` : 'N/A'}
                  </div>

                  {/* Severity Badge */}
                  <span className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${getSeverityColor(storm.severity || 'light')}`}>
                    {(storm.severity || 'light').charAt(0).toUpperCase() + (storm.severity || 'light').slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
