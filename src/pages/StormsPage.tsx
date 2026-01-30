import { useState, useEffect, useCallback, useMemo } from 'react'
import StormMap, { StormPath, PropertyMarker } from '../components/map/StormMap'
import StormListPanel from '../components/storms/StormListPanel'
import PropertiesListPanel from '../components/storms/PropertiesListPanel'
import FilterBar, { StormFilters, PropertyFilters } from '../components/storms/FilterBar'
import PropertyDetailModal from '../components/storms/PropertyDetailModal'
import { StormEvent } from '../types/database'
import { Home, Loader2, X, MapPin, Calendar, Ruler } from 'lucide-react'
import toast from 'react-hot-toast'
import { stormService } from '../lib/stormService'
import { arcgisService, ArcGISParcel } from '../lib/arcgisService'
import { leadService } from '../lib/leadService'
import { propertyService } from '../lib/propertyService'
import { profileService, DEFAULT_TARGET_STATE } from '../lib/profileService'
import { useViewModeStore } from '../store/viewModeStore'
import type { SkipTraceResult } from '../lib/skipTraceService'

export default function StormsPage() {
  // View mode store
  const {
    mode,
    selectedStormPath,
    selectedProperties,
    loadedProperties,
    isLoadingProperties,
    enterLeadMode,
    exitLeadMode,
    setLoadedProperties,
    togglePropertySelection,
    selectAllProperties,
    clearPropertySelection,
    markPropertiesAsLeads,
    setLoadingProperties,
    getCachedProperties,
    cacheProperties,
  } = useViewModeStore()

  // Storm events (point data from NOAA)
  const [storms, setStorms] = useState<StormEvent[]>([])
  const [filteredStorms, setFilteredStorms] = useState<StormEvent[]>([])
  const [selectedStorm, setSelectedStorm] = useState<StormEvent | null>(null)
  
  // Storm paths (polygon data from shapefiles)
  const [stormPaths, setStormPaths] = useState<StormPath[]>([])
  
  // Property detail modal
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null)
  const [isAddingLead, setIsAddingLead] = useState(false)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  
  // UI State
  const [loading, setLoading] = useState(true)
  
  // Target state for filtering (from user preferences)
  const [targetState, setTargetState] = useState<string>(DEFAULT_TARGET_STATE)
  
  // Storm filters
  const [stormFilters, setStormFilters] = useState<StormFilters>({
    searchQuery: '',
    severityFilter: [],
    dateRange: { start: '', end: '' },
    showPaths: true,
    showPoints: true,
  })

  // Property filters
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({
    searchQuery: '',
    hailSizeFilter: [],
    valueRange: { min: null, max: null },
    leadStatusFilter: 'all',
    propertyClassFilter: [],
  })

  // Load target state preference on mount
  useEffect(() => {
    const loadTargetState = async () => {
      try {
        const state = await profileService.getTargetState()
        setTargetState(state)
      } catch (error) {
        console.error('Error loading target state:', error)
        // Keep default state
      }
    }
    loadTargetState()
  }, [])

  // Load data on mount and when target state changes
  useEffect(() => {
    loadStorms()
    loadStormPaths()
  }, [targetState])

  // Filter storms when filters change
  useEffect(() => {
    filterStorms()
  }, [storms, stormFilters])

  // Load storm events
  const loadStorms = async () => {
    try {
      setLoading(true)
      const data = await stormService.getStorms({ limit: 1000 })
      setStorms(data)
      setFilteredStorms(data)
      setLoading(false)
      toast.success(`Loaded ${data.length} storm events`)
    } catch (error) {
      console.error('Error loading storms:', error)
      toast.error('Failed to load storms')
      setLoading(false)
    }
  }

  // Load storm paths for the user's target state
  const loadStormPaths = useCallback(async () => {
    try {
      const paths = await stormService.getStormPaths({ state: targetState, limit: 200 })
      setStormPaths(paths)
      if (paths.length > 0) {
        toast.success(`Loaded ${paths.length} storm paths for ${targetState}`)
      }
    } catch (error) {
      console.error('Error loading storm paths:', error)
    }
  }, [targetState])

  // Load affected properties for a storm path
  const loadAffectedProperties = useCallback(async (stormPath: StormPath) => {
    if (!stormPath.geometry) return

    // Check cache first
    const cached = getCachedProperties(stormPath.id)
    if (cached) {
      setLoadedProperties(cached)
      toast.success(`Loaded ${cached.length} properties from cache`)
      return
    }

    try {
      setLoadingProperties(true)
      toast.loading('Finding affected properties...', { id: 'loading-properties' })
      
      const parcels = await arcgisService.findParcelsInStormPath(stormPath.geometry, {
        limit: 500,
        propertyClass: 'Residential'
      })
      
      // Convert to PropertyMarker format
      const properties: PropertyMarker[] = parcels.map((parcel: ArcGISParcel) => ({
        id: parcel.stateId || parcel.id,
        address: parcel.address || 'Unknown address',
        ownerName: parcel.ownerName,
        latitude: parcel.latitude,
        longitude: parcel.longitude,
        estimatedValue: parcel.estimatedValue,
        parcelGeometry: parcel.geometry,
        isLead: false
      }))
      
      // Cache the results
      cacheProperties(stormPath.id, properties)
      setLoadedProperties(properties)
      toast.success(`Found ${properties.length} affected properties`, { id: 'loading-properties' })
    } catch (error) {
      console.error('Error loading affected properties:', error)
      toast.error('Failed to load affected properties', { id: 'loading-properties' })
      setLoadedProperties([])
    } finally {
      setLoadingProperties(false)
    }
  }, [getCachedProperties, cacheProperties, setLoadedProperties, setLoadingProperties])

  // Filter storms based on current filters
  const filterStorms = () => {
    let filtered = [...storms]

    if (stormFilters.searchQuery) {
      const query = stormFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(storm =>
        storm.name?.toLowerCase().includes(query) ||
        storm.state?.toLowerCase().includes(query) ||
        storm.county?.toLowerCase().includes(query)
      )
    }

    if (stormFilters.severityFilter.length > 0) {
      filtered = filtered.filter(storm => stormFilters.severityFilter.includes(storm.severity || ''))
    }

    if (stormFilters.dateRange.start) {
      filtered = filtered.filter(storm => new Date(storm.date) >= new Date(stormFilters.dateRange.start))
    }

    if (stormFilters.dateRange.end) {
      filtered = filtered.filter(storm => new Date(storm.date) <= new Date(stormFilters.dateRange.end))
    }

    setFilteredStorms(filtered)
  }

  // Filter loaded properties based on property filters
  const filteredProperties = useMemo(() => {
    let filtered = [...loadedProperties]

    if (propertyFilters.searchQuery) {
      const query = propertyFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(property =>
        property.address?.toLowerCase().includes(query) ||
        property.ownerName?.toLowerCase().includes(query)
      )
    }

    if (propertyFilters.valueRange.min !== null) {
      filtered = filtered.filter(property => 
        (property.estimatedValue || 0) >= propertyFilters.valueRange.min!
      )
    }

    if (propertyFilters.valueRange.max !== null) {
      filtered = filtered.filter(property => 
        (property.estimatedValue || 0) <= propertyFilters.valueRange.max!
      )
    }

    if (propertyFilters.leadStatusFilter === 'leads') {
      filtered = filtered.filter(property => property.isLead)
    } else if (propertyFilters.leadStatusFilter === 'not_leads') {
      filtered = filtered.filter(property => !property.isLead)
    }

    return filtered
  }, [loadedProperties, propertyFilters])

  // Export storms to CSV
  const exportStorms = () => {
    const csv = [
      ['Event ID', 'Location', 'State', 'County', 'Date', 'Severity', 'Hail Size (inches)', 'Month', 'Year'],
      ...filteredStorms.map(s => [
        s.event_id,
        s.name,
        s.state,
        s.county || '',
        new Date(s.date).toLocaleDateString(),
        s.severity || '',
        s.magnitude || '',
        s.month_name || '',
        s.year || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wisconsin-hail-storms-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exported storms to CSV')
  }

  // State for showing path selection when multiple paths found
  const [nearbyPaths, setNearbyPaths] = useState<StormPath[]>([])
  const [showPathSelector, setShowPathSelector] = useState(false)
  const [isSearchingPath, setIsSearchingPath] = useState(false)

  // Handle storm path selection - transition to lead mode
  // IMPORTANT: This must be defined BEFORE handleStormSelect which depends on it
  const handlePathSelect = useCallback((path: StormPath) => {
    enterLeadMode(path)
    loadAffectedProperties(path)
  }, [enterLeadMode, loadAffectedProperties])

  // Handle storm point selection (in storm mode)
  // This now automatically finds the corresponding storm path and loads properties
  const handleStormSelect = useCallback(async (storm: StormEvent) => {
    setSelectedStorm(storm)
    setIsSearchingPath(true)

    try {
      // First, try to find a matching storm path by event_id
      if (storm.event_id) {
        const path = await stormService.getStormPathByEventId(storm.event_id)
        if (path && path.geometry) {
          setIsSearchingPath(false)
          // Found exact match - select it and load properties
          handlePathSelect(path)
          return
        }
      }

      // Fallback: find storm paths near the storm point location
      const paths = await stormService.getStormPathsNearLocation(
        storm.latitude,
        storm.longitude,
        15, // 15km radius
        5   // max 5 results
      )

      setIsSearchingPath(false)

      if (paths.length === 1 && paths[0].geometry) {
        // Only one path found - auto-select it
        handlePathSelect(paths[0])
      } else if (paths.length > 1) {
        // Multiple paths found - show selector
        setNearbyPaths(paths.filter(p => p.geometry))
        setShowPathSelector(true)
      } else {
        // No paths found - show a message
        toast('No storm path data available for this location', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error('Error finding storm path:', error)
      setIsSearchingPath(false)
      toast.error('Failed to find storm path data')
    }
  }, [handlePathSelect])

  // Handle property click - show detail modal
  const handlePropertyClick = useCallback((property: PropertyMarker) => {
    setSelectedProperty(property)
  }, [])

  // Handle property toggle (for multi-select)
  const handlePropertyToggle = useCallback((property: PropertyMarker) => {
    togglePropertySelection(property)
  }, [togglePropertySelection])

  // Add single property to leads (upsert to properties table, then create lead with property_id, storm_path_id, storm_id)
  const handleAddToLeads = useCallback(async (property: PropertyMarker, skipTraceData?: SkipTraceResult) => {
    setIsAddingLead(true)
    try {
      const exists = await leadService.leadExistsForAddress(property.address)
      if (exists) {
        toast.error('A lead for this property already exists')
        setIsAddingLead(false)
        return
      }
      const savedProperty = await propertyService.upsertPropertyFromMarker(property)
      await leadService.createLeadFromProperty({
        property: {
          id: property.id,
          stateId: property.id,
          address: property.address,
          ownerName: property.ownerName,
          latitude: property.latitude,
          longitude: property.longitude,
          estimatedValue: property.estimatedValue,
          geometry: property.parcelGeometry
        },
        propertyId: savedProperty.id,
        stormPathId: selectedStormPath?.id ?? null,
        stormEventId: selectedStorm?.event_id ?? null,
        skipTraceResult: skipTraceData
      })
      markPropertiesAsLeads([property.id])
      toast.success('Lead created successfully!')
      setSelectedProperty(null)
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error('Failed to create lead')
    } finally {
      setIsAddingLead(false)
    }
  }, [selectedStormPath, selectedStorm, markPropertiesAsLeads])

  // Bulk add selected properties to leads (optimized with batch insert)
  const handleBulkAddToLeads = useCallback(async () => {
    const nonLeadProperties = selectedProperties.filter(p => !p.isLead)
    if (nonLeadProperties.length === 0) {
      toast.error('No new properties to add as leads')
      return
    }

    setIsBulkActionLoading(true)

    try {
      // Upsert each property to properties table and collect ids (same order)
      const propertyIds: (string | null)[] = []
      for (const p of nonLeadProperties) {
        const saved = await propertyService.upsertPropertyFromMarker(p)
        propertyIds.push(saved.id)
      }
      const propertiesToConvert = nonLeadProperties.map(property => ({
        id: property.id,
        stateId: property.id,
        address: property.address,
        ownerName: property.ownerName,
        latitude: property.latitude,
        longitude: property.longitude,
        estimatedValue: property.estimatedValue,
        geometry: property.parcelGeometry
      }))
      const result = await leadService.bulkCreateLeadsFromProperties(
        propertiesToConvert,
        {
          propertyIds,
          stormPathId: selectedStormPath?.id ?? null,
          stormEventId: selectedStorm?.event_id ?? null,
          skipDuplicateCheck: false
        }
      )

      // Mark successfully created leads in the UI
      if (result.created.length > 0) {
        markPropertiesAsLeads(result.created.map(lead => 
          // Find the property ID that corresponds to this lead
          nonLeadProperties.find(p => 
            p.address.toLowerCase() === lead.address.toLowerCase()
          )?.id || ''
        ).filter(id => id !== ''))
      }

      // Show appropriate toast messages
      if (result.created.length > 0 && result.skipped === 0 && result.failed === 0) {
        toast.success(`Added ${result.created.length} properties to leads`)
      } else if (result.created.length > 0) {
        const skippedMsg = result.skipped > 0 ? `${result.skipped} duplicates skipped` : ''
        const failedMsg = result.failed > 0 ? `${result.failed} failed` : ''
        const details = [skippedMsg, failedMsg].filter(Boolean).join(', ')
        toast.success(`Added ${result.created.length} leads (${details})`)
      } else if (result.skipped > 0) {
        toast.error('No new leads created - all properties already exist as leads')
      } else {
        toast.error('Failed to create leads')
      }

      // Log any errors for debugging
      if (result.errors.length > 0) {
        console.error('Bulk lead creation errors:', result.errors)
      }
    } catch (error) {
      console.error('Error bulk creating leads:', error)
      toast.error('Failed to create leads')
    } finally {
      setIsBulkActionLoading(false)
      clearPropertySelection()
    }
  }, [selectedProperties, selectedStormPath, selectedStorm, markPropertiesAsLeads, clearPropertySelection])

  // Bulk skip trace placeholder
  const handleBulkSkipTrace = useCallback(() => {
    toast('Skip trace for multiple properties coming soon!', { icon: '📞' })
  }, [])

  // Exit lead mode and go back to storms
  const handleBackToStorms = useCallback(() => {
    exitLeadMode()
    setSelectedStorm(null)
  }, [exitLeadMode])

  // Handle storm double click
  const handleStormDoubleClick = useCallback((storm: StormEvent) => {
    setSelectedStorm(storm)
  }, [])

  // Refresh data
  const handleRefresh = useCallback(() => {
    if (mode === 'storms') {
      loadStorms()
      loadStormPaths()
    } else if (selectedStormPath) {
      loadAffectedProperties(selectedStormPath)
    }
  }, [mode, selectedStormPath, loadAffectedProperties])

  // Handle filter changes
  const handleStormFiltersChange = useCallback((updates: Partial<StormFilters>) => {
    setStormFilters(prev => ({ ...prev, ...updates }))
  }, [])

  const handlePropertyFiltersChange = useCallback((updates: Partial<PropertyFilters>) => {
    setPropertyFilters(prev => ({ ...prev, ...updates }))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NOAA storm data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Dynamic Filter Bar */}
      <FilterBar
        mode={mode}
        selectedStormPath={selectedStormPath}
        stormFilters={stormFilters}
        onStormFiltersChange={handleStormFiltersChange}
        stormCount={filteredStorms.length}
        totalStormCount={storms.length}
        propertyFilters={propertyFilters}
        onPropertyFiltersChange={handlePropertyFiltersChange}
        propertyCount={filteredProperties.length}
        selectedPropertyCount={selectedProperties.length}
        onRefresh={handleRefresh}
        onExport={mode === 'storms' ? exportStorms : undefined}
        onBackToStorms={handleBackToStorms}
      />

      {/* Map - Takes most of the space */}
      <div className="flex-1 relative min-h-0">
        <StormMap 
          storms={mode === 'storms' ? filteredStorms : []}
          selectedStorm={selectedStorm}
          onStormSelect={handleStormSelect}
          stormPaths={mode === 'storms' ? stormPaths : (selectedStormPath ? [selectedStormPath] : [])}
          selectedPath={selectedStormPath}
          onPathSelect={handlePathSelect}
          properties={mode === 'leads' ? filteredProperties : []}
          onPropertyClick={handlePropertyClick}
          showPointMarkers={mode === 'storms' && stormFilters.showPoints}
          showPaths={mode === 'storms' ? stormFilters.showPaths : true}
          showProperties={mode === 'leads'}
          // New props for lead mode
          viewMode={mode}
          selectedProperties={selectedProperties}
          onPropertyToggle={handlePropertyToggle}
        />
        
        {/* Overlay info cards */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Storm mode info */}
          {mode === 'storms' && (
            <>
              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-900">
                  {filteredStorms.length} storm reports
                </span>
                {filteredStorms.length !== storms.length && (
                  <span className="text-sm text-gray-500 ml-1">
                    of {storms.length}
                  </span>
                )}
              </div>
              
              {stormPaths.length > 0 && (
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-900">
                    {stormPaths.length} storm path swaths
                  </span>
                </div>
              )}
            </>
          )}
          
          {/* Lead mode info */}
          {mode === 'leads' && (
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {isLoadingProperties ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Home className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {isLoadingProperties 
                    ? 'Finding properties...' 
                    : `${filteredProperties.length} affected properties`
                  }
                </span>
              </div>
              {selectedProperties.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedProperties.length} selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Selected path info (lead mode) */}
        {mode === 'leads' && selectedStormPath && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
            <h4 className="font-semibold text-gray-900 mb-1">
              Selected Storm Path
            </h4>
            <p className="text-sm text-gray-600">
              {selectedStormPath.county}, {selectedStormPath.state}
            </p>
            {selectedStormPath.begin_date && (
              <p className="text-sm text-gray-500">
                {new Date(selectedStormPath.begin_date).toLocaleDateString()}
              </p>
            )}
            {selectedStormPath.magnitude && (
              <p className="text-sm text-gray-700 mt-1">
                Hail size: {selectedStormPath.magnitude}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Panel - Storm List or Properties List */}
      {mode === 'storms' ? (
        <StormListPanel
          storms={filteredStorms}
          selectedStorm={selectedStorm}
          onStormSelect={handleStormSelect}
          onStormDoubleClick={handleStormDoubleClick}
        />
      ) : (
        <PropertiesListPanel
          properties={filteredProperties}
          selectedProperties={selectedProperties}
          stormPath={selectedStormPath}
          loading={isLoadingProperties}
          onPropertySelect={handlePropertyClick}
          onPropertyToggle={handlePropertyToggle}
          onSelectAll={selectAllProperties}
          onClearSelection={clearPropertySelection}
          onBulkAddToLeads={handleBulkAddToLeads}
          onBulkSkipTrace={handleBulkSkipTrace}
          isBulkActionLoading={isBulkActionLoading}
        />
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          stormInfo={selectedStormPath ? {
            date: selectedStormPath.begin_date,
            severity: selectedStormPath.severity,
            magnitude: selectedStormPath.magnitude
          } : undefined}
          onClose={() => setSelectedProperty(null)}
          onAddToLeads={handleAddToLeads}
          isAddingLead={isAddingLead}
        />
      )}

      {/* Storm Path Selector Modal - shown when multiple paths found near a storm point */}
      {showPathSelector && nearbyPaths.length > 0 && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPathSelector(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Select Storm Path</h2>
                <p className="text-sm text-gray-500">
                  {nearbyPaths.length} storm paths found near this location
                </p>
              </div>
              <button
                onClick={() => setShowPathSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Path List */}
            <div className="max-h-[400px] overflow-y-auto">
              {nearbyPaths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => {
                    setShowPathSelector(false)
                    setNearbyPaths([])
                    handlePathSelect(path)
                  }}
                  className="w-full px-6 py-4 flex items-start gap-4 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow"
                      style={{ 
                        backgroundColor: path.severity === 'extreme' ? '#dc2626' 
                          : path.severity === 'severe' ? '#f97316'
                          : path.severity === 'moderate' ? '#eab308'
                          : '#22c55e'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {path.county || 'Unknown'}, {path.state || 'WI'}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        path.severity === 'extreme' ? 'bg-red-100 text-red-800'
                        : path.severity === 'severe' ? 'bg-orange-100 text-orange-800'
                        : path.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                        {(path.severity || 'moderate').charAt(0).toUpperCase() + (path.severity || 'moderate').slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      {path.begin_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(path.begin_date).toLocaleDateString()}
                        </span>
                      )}
                      {path.magnitude && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5" />
                          {path.magnitude}" hail
                        </span>
                      )}
                      {'distance_km' in path && (path as StormPath & { distance_km?: number }).distance_km !== undefined && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {((path as StormPath & { distance_km?: number }).distance_km!).toFixed(1)} km away
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Click a storm path to view affected properties
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Searching Path Loading Overlay */}
      {isSearchingPath && (
        <div className="fixed inset-0 z-[1999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-lg px-6 py-4 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700">Finding storm path data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
