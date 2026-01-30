import { useEffect, useRef, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StormEvent } from '../../types/database'

// Types for storm paths (from PostGIS/shapefiles)
export interface StormPath {
  id: string
  event_id?: string
  begin_date?: string
  state?: string
  county?: string
  magnitude?: number
  severity?: string
  geometry: GeoJSON.Geometry
  properties?: Record<string, unknown>
}

// Types for property/parcel data (from ArcGIS)
export interface PropertyMarker {
  id: string
  address: string
  ownerName?: string
  latitude: number
  longitude: number
  estimatedValue?: number
  parcelGeometry?: GeoJSON.Geometry
  isLead?: boolean
}

// Severity colors based on hail magnitude
const SEVERITY_COLORS: Record<string, string> = {
  light: '#22c55e',    // Green for < 1"
  moderate: '#eab308', // Yellow for 1-1.5"
  severe: '#f97316',   // Orange for 1.5-2"
  extreme: '#dc2626'   // Red for 2"+
}

// Property marker colors based on status in lead mode
const PROPERTY_COLORS = {
  default: '#3b82f6',  // Blue - not a lead yet
  lead: '#10b981',     // Green - added as lead
  selected: '#8b5cf6', // Purple - selected for bulk action
}

interface StormMapProps {
  // Point markers (current storm events from NOAA)
  storms: StormEvent[]
  selectedStorm?: StormEvent | null
  onStormSelect?: (storm: StormEvent) => void
  
  // Storm paths (polygons from shapefiles)
  stormPaths?: StormPath[]
  selectedPath?: StormPath | null
  onPathSelect?: (path: StormPath) => void
  
  // Property markers (from ArcGIS query)
  properties?: PropertyMarker[]
  onPropertyClick?: (property: PropertyMarker) => void
  
  // Multi-select support
  selectedProperties?: PropertyMarker[]
  onPropertyToggle?: (property: PropertyMarker) => void
  
  // Display options
  showPointMarkers?: boolean
  showPaths?: boolean
  showProperties?: boolean
  
  // View mode
  viewMode?: 'storms' | 'leads'
}

export default function StormMap({ 
  storms, 
  selectedStorm, 
  onStormSelect,
  stormPaths = [],
  selectedPath,
  onPathSelect,
  properties = [],
  onPropertyClick,
  selectedProperties = [],
  onPropertyToggle,
  showPointMarkers = true,
  showPaths = true,
  showProperties = true,
  viewMode = 'storms',
}: StormMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  
  // Separate layer groups for different data types
  const pointMarkersLayer = useRef<L.LayerGroup | null>(null)
  const pathsLayer = useRef<L.GeoJSON | null>(null)
  const propertiesLayer = useRef<L.LayerGroup | null>(null)

  // Create a Set of selected property IDs for fast lookup
  const selectedPropertyIds = useMemo(() => 
    new Set(selectedProperties.map(p => p.id)), 
    [selectedProperties]
  )

  // Get hail size color for a property based on storm magnitude
  const getPropertyHailColor = useCallback((magnitude?: number) => {
    if (!magnitude) return SEVERITY_COLORS.moderate
    if (magnitude >= 2.0) return SEVERITY_COLORS.extreme
    if (magnitude >= 1.5) return SEVERITY_COLORS.severe
    if (magnitude >= 1.0) return SEVERITY_COLORS.moderate
    return SEVERITY_COLORS.light
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Create the map centered on Wisconsin
    mapRef.current = L.map(mapContainer.current, {
      center: [44.5, -89.5],
      zoom: 7,
      zoomControl: true,
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current)

    // Create layer groups in z-order (bottom to top)
    // pathsLayer is created dynamically in its effect
    propertiesLayer.current = L.layerGroup().addTo(mapRef.current)
    pointMarkersLayer.current = L.layerGroup().addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Get severity color
  const getSeverityColor = useCallback((severity?: string, magnitude?: number) => {
    if (severity && SEVERITY_COLORS[severity]) {
      return SEVERITY_COLORS[severity]
    }
    // Calculate from magnitude if no severity
    if (magnitude !== undefined) {
      if (magnitude >= 2.0) return SEVERITY_COLORS.extreme
      if (magnitude >= 1.5) return SEVERITY_COLORS.severe
      if (magnitude >= 1.0) return SEVERITY_COLORS.moderate
      return SEVERITY_COLORS.light
    }
    return SEVERITY_COLORS.moderate
  }, [])

  // Update storm paths (polygons)
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing paths layer if any
    if (pathsLayer.current) {
      pathsLayer.current.remove()
    }

    if (!showPaths || stormPaths.length === 0) {
      pathsLayer.current = null
      return
    }

    // Convert paths to GeoJSON FeatureCollection — only include paths with valid geometry
    const features: GeoJSON.Feature[] = stormPaths
      .filter((path) => {
        if (!path.geometry || typeof path.geometry !== 'object' || !('type' in path.geometry)) return false
        const g = path.geometry as GeoJSON.Geometry
        return 'coordinates' in g && Array.isArray(g.coordinates)
      })
      .map((path) => ({
        type: 'Feature' as const,
        geometry: path.geometry,
        properties: {
          id: path.id,
          event_id: path.event_id,
          magnitude: path.magnitude,
          severity: path.severity,
          begin_date: path.begin_date,
          state: path.state,
          county: path.county,
          ...path.properties
        }
      }))

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features
    }

    const newLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const props = feature?.properties || {}
        const isSelected = selectedPath?.id === props.id
        const color = getSeverityColor(props.severity, props.magnitude)
        const geomType = feature?.geometry?.type
        const isLine = geomType === 'LineString' || geomType === 'MultiLineString'
        if (isLine) {
          return {
            color: isSelected ? '#1e40af' : color,
            weight: isSelected ? 4 : 3,
            opacity: isSelected ? 1 : 0.9,
            fillOpacity: 0,
          }
        }
        return {
          fillColor: color,
          color: isSelected ? '#1e40af' : color,
          weight: isSelected ? 3 : 2,
          opacity: isSelected ? 1 : 0.8,
          fillOpacity: isSelected ? 0.5 : 0.35,
        }
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {}
        
        // Popup
        const popupContent = `
          <div style="min-width: 200px; font-family: system-ui, sans-serif;">
            <h3 style="font-weight: bold; color: #1f2937; margin: 0 0 4px 0; font-size: 14px;">
              Storm Path ${props.event_id || ''}
            </h3>
            <p style="color: #6b7280; margin: 0 0 2px 0; font-size: 12px;">
              ${props.county || 'Unknown'}, ${props.state || ''}
            </p>
            <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 12px;">
              ${props.begin_date ? new Date(props.begin_date).toLocaleDateString() : 'Date unknown'}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 13px; font-weight: 500;">
                Hail: ${props.magnitude || 'N/A'}"
              </span>
              <span style="padding: 2px 8px; font-size: 11px; border-radius: 9999px; font-weight: 500; 
                background-color: ${getSeverityColor(props.severity, props.magnitude)}20; 
                color: ${getSeverityColor(props.severity, props.magnitude)};">
                ${(props.severity || 'moderate').charAt(0).toUpperCase()}${(props.severity || 'moderate').slice(1)}
              </span>
            </div>
            <button onclick="window.selectStormPath && window.selectStormPath('${props.id}')"
              style="margin-top: 8px; width: 100%; padding: 6px; background: #2563eb; color: white; 
                border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
              View Affected Properties
            </button>
          </div>
        `
        
        layer.bindPopup(popupContent)
        
        // Hover effects
        layer.on('mouseover', (e) => {
          const l = e.target as L.Path
          l.setStyle({
            weight: 3,
            fillOpacity: 0.5,
          })
        })
        
        layer.on('mouseout', (e) => {
          const l = e.target as L.Path
          if (selectedPath?.id !== props.id) {
            l.setStyle({
              weight: 2,
              fillOpacity: 0.35,
            })
          }
        })
        
        // Click handler
        layer.on('click', () => {
          const pathData = stormPaths.find(p => p.id === props.id)
          if (pathData && onPathSelect) {
            onPathSelect(pathData)
          }
        })
      }
    }).addTo(mapRef.current)
    
    pathsLayer.current = newLayer

    // Fit map to show all storm paths so every path is visible (fixes "only one visible")
    if (features.length > 0) {
      const bounds = newLayer.getBounds()
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
      }
    }

    // Expose path selection to popup button
    const win = window as unknown as { selectStormPath?: (id: string) => void }
    win.selectStormPath = (id: string) => {
      const pathData = stormPaths.find(p => p.id === id)
      if (pathData && onPathSelect) {
        onPathSelect(pathData)
      }
    }

    return () => {
      delete (window as unknown as { selectStormPath?: (id: string) => void }).selectStormPath
    }
  }, [stormPaths, selectedPath, showPaths, onPathSelect, getSeverityColor])

  // Update point markers (current storm events)
  useEffect(() => {
    if (!mapRef.current || !pointMarkersLayer.current) return

    pointMarkersLayer.current.clearLayers()

    if (!showPointMarkers || storms.length === 0) return

    storms.forEach((storm) => {
      if (!storm.latitude || !storm.longitude) return

      const color = getSeverityColor(storm.severity, storm.magnitude ?? undefined)
      const isSelected = selectedStorm?.id === storm.id
      
      const marker = L.circleMarker([storm.latitude, storm.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        color: isSelected ? '#1e40af' : '#fff',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      })

      const popupContent = `
        <div style="min-width: 180px; font-family: system-ui, sans-serif;">
          <h3 style="font-weight: bold; color: #1f2937; margin: 0 0 4px 0; font-size: 14px;">${storm.name}</h3>
          <p style="color: #6b7280; margin: 0 0 2px 0; font-size: 12px;">${storm.county}, ${storm.state}</p>
          <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 12px;">${new Date(storm.date).toLocaleDateString()}</p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 13px; font-weight: 500;">Hail: ${storm.magnitude || 'N/A'}"</span>
            <span style="padding: 2px 8px; font-size: 11px; border-radius: 9999px; font-weight: 500; background-color: ${color}20; color: ${color};">
              ${storm.severity?.charAt(0).toUpperCase()}${storm.severity?.slice(1) || 'Unknown'}
            </span>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -5],
      })

      // Only change radius on hover, don't open popup (prevents disappearing icon issue)
      marker.on('mouseover', () => {
        if (!isSelected) marker.setRadius(12)
      })
      marker.on('mouseout', () => {
        if (!isSelected) marker.setRadius(8)
      })

      // Open popup on click instead of hover to prevent interference
      marker.on('click', () => {
        marker.openPopup()
        onStormSelect?.(storm)
      })

      pointMarkersLayer.current?.addLayer(marker)
    })
  }, [storms, selectedStorm, showPointMarkers, onStormSelect, getSeverityColor])

  // Update property markers with multi-select and hail-size coloring
  useEffect(() => {
    if (!mapRef.current || !propertiesLayer.current) return

    propertiesLayer.current.clearLayers()

    if (!showProperties || properties.length === 0) return

    // Get storm magnitude for hail size coloring
    const stormMagnitude = selectedPath?.magnitude

    // Use explicit for loop to avoid potential type issues
    for (const property of properties) {
      const isSelected = selectedPropertyIds.has(property.id)
      
      // Determine marker color based on state
      let fillColor: string
      let borderColor: string
      let radius: number
      
      if (viewMode === 'leads') {
        // In lead mode, color by hail size, with selection/lead overlay
        if (isSelected) {
          // Selected properties get purple border
          fillColor = getPropertyHailColor(stormMagnitude)
          borderColor = PROPERTY_COLORS.selected
          radius = 10
        } else if (property.isLead) {
          // Already a lead - green with check
          fillColor = PROPERTY_COLORS.lead
          borderColor = '#fff'
          radius = 7
        } else {
          // Not selected, not a lead - color by hail size
          fillColor = getPropertyHailColor(stormMagnitude)
          borderColor = '#fff'
          radius = 6
        }
      } else {
        // Storm mode - simple blue/green
        fillColor = property.isLead ? PROPERTY_COLORS.lead : PROPERTY_COLORS.default
        borderColor = '#fff'
        radius = 6
      }
      
      const marker = L.circleMarker([property.latitude, property.longitude], {
        radius,
        fillColor,
        color: borderColor,
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        fillOpacity: 0.85,
        className: isSelected ? 'property-selected' : '',
      })

      // Build popup content
      const hailInfo = viewMode === 'leads' && stormMagnitude 
        ? `<p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">
            Estimated Hail: <strong>${stormMagnitude}"</strong>
          </p>` 
        : ''
      
      const statusBadge = property.isLead 
        ? '<span style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #10b981; color: white; border-radius: 4px; margin-bottom: 4px;">LEAD</span>'
        : ''
      
      const actionButton = property.isLead
        ? `<button onclick="window.selectProperty && window.selectProperty('${property.id}')"
            style="width: 100%; padding: 6px; background: #10b981; color: white; 
              border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
            View Lead Details
          </button>`
        : `<div style="display: flex; gap: 4px;">
            <button onclick="window.togglePropertySelection && window.togglePropertySelection('${property.id}')"
              style="flex: 1; padding: 6px; background: ${isSelected ? '#8b5cf6' : '#f3f4f6'}; color: ${isSelected ? 'white' : '#374151'}; 
                border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">
              ${isSelected ? '✓ Selected' : 'Select'}
            </button>
            <button onclick="window.selectProperty && window.selectProperty('${property.id}')"
              style="flex: 1; padding: 6px; background: #2563eb; color: white; 
                border: none; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">
              Add to Leads
            </button>
          </div>`

      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
          ${statusBadge}
          <h3 style="font-weight: bold; color: #1f2937; margin: 0 0 4px 0; font-size: 14px;">
            ${property.address}
          </h3>
          ${property.ownerName ? `
            <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 12px;">
              Owner: ${property.ownerName}
            </p>
          ` : ''}
          ${hailInfo}
          ${property.estimatedValue ? `
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 12px;">
              Est. Value: <strong>$${property.estimatedValue.toLocaleString()}</strong>
            </p>
          ` : ''}
          ${actionButton}
        </div>
      `

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -5],
      })

      // Only change radius on hover, open popup on click
      marker.on('mouseover', () => {
        marker.setRadius(radius + 4)
      })
      marker.on('mouseout', () => {
        marker.setRadius(radius)
      })

      // Click handler - toggle selection with Ctrl, otherwise open detail
      marker.on('click', (e) => {
        marker.openPopup() // Open popup on click
        const originalEvent = e.originalEvent as MouseEvent
        if (originalEvent.ctrlKey || originalEvent.metaKey) {
          // Ctrl+click toggles selection
          onPropertyToggle?.(property)
        } else {
          // Regular click opens detail modal
          onPropertyClick?.(property)
        }
      })

      propertiesLayer.current?.addLayer(marker)
    }

    // Expose property selection to popup buttons
    (window as unknown as { selectProperty?: (id: string) => void }).selectProperty = (id: string) => {
      const propertyData = properties.find(p => p.id === id)
      if (propertyData && onPropertyClick) {
        onPropertyClick(propertyData)
      }
    }

    (window as unknown as { togglePropertySelection?: (id: string) => void }).togglePropertySelection = (id: string) => {
      const propertyData = properties.find(p => p.id === id)
      if (propertyData && onPropertyToggle) {
        onPropertyToggle(propertyData)
      }
    }

    return () => {
      delete (window as unknown as { selectProperty?: (id: string) => void }).selectProperty
      delete (window as unknown as { togglePropertySelection?: (id: string) => void }).togglePropertySelection
    }
  }, [properties, showProperties, onPropertyClick, onPropertyToggle, selectedPropertyIds, viewMode, selectedPath, getPropertyHailColor])

  // Center on selected storm
  useEffect(() => {
    if (!mapRef.current || !selectedStorm?.latitude || !selectedStorm?.longitude) return

    mapRef.current.flyTo([selectedStorm.latitude, selectedStorm.longitude], 10, {
      duration: 1,
    })
  }, [selectedStorm])

  // Fit bounds to selected path
  useEffect(() => {
    if (!mapRef.current || !selectedPath?.geometry || !pathsLayer.current) return

    try {
      const feature: GeoJSON.Feature = {
        type: 'Feature',
        geometry: selectedPath.geometry,
        properties: {}
      }
      const geoJsonLayer = L.geoJSON(feature)
      const bounds = geoJsonLayer.getBounds()
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    } catch {
      // Ignore bounds errors
    }
  }, [selectedPath])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
        <h4 className="font-semibold text-sm mb-3">Legend</h4>
        
        {/* Hail Severity (used for both storm paths and properties in lead mode) */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">
            {viewMode === 'leads' ? 'Hail Damage Risk' : 'Storm Severity'}
          </p>
          <div className="space-y-1.5">
            {[
              { level: 'light', label: 'Light (<1")', color: SEVERITY_COLORS['light'] },
              { level: 'moderate', label: 'Moderate (1-1.5")', color: SEVERITY_COLORS['moderate'] },
              { level: 'severe', label: 'Severe (1.5-2")', color: SEVERITY_COLORS['severe'] },
              { level: 'extreme', label: 'Extreme (2"+)', color: SEVERITY_COLORS['extreme'] },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Property Markers (lead mode) */}
        {viewMode === 'leads' && showProperties && properties.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Properties</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{ backgroundColor: SEVERITY_COLORS.moderate, borderColor: PROPERTY_COLORS.selected }}
                ></div>
                <span className="text-xs text-gray-700">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: PROPERTY_COLORS.lead }}
                ></div>
                <span className="text-xs text-gray-700">Added as Lead</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Ctrl+Click to multi-select
            </p>
          </div>
        )}

        {/* Storm mode property markers */}
        {viewMode === 'storms' && showProperties && properties.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Properties</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: PROPERTY_COLORS.default }}
                ></div>
                <span className="text-xs text-gray-700">Affected Property</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: PROPERTY_COLORS.lead }}
                ></div>
                <span className="text-xs text-gray-700">Added as Lead</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
