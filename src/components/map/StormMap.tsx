import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Storm } from '../../types/storm'
import { SEVERITY_COLORS } from '../../types/storm'

mapboxgl.accessToken = (import.meta.env?.VITE_MAPBOX_TOKEN as string) || ''

interface StormMapProps {
  storms: Storm[]
  onStormSelect?: (storm: Storm) => void
  selectedStorm?: Storm | null
}

export default function StormMap({ storms, onStormSelect, selectedStorm }: StormMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-89.4, 43.8], // Wisconsin center
      zoom: 6,
    })

    map.current.on('load', () => {
      setMapLoaded(true)

      // Add navigation controls
      map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Add fullscreen control
      map.current?.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Add storm markers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || storms.length === 0) return

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.storm-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Add new markers
    storms.forEach((storm) => {
      if (!storm.geometry || !map.current) return

      // Get center of polygon
      const coordinates = storm.geometry.coordinates[0]
      const center = coordinates.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
      ).map(sum => sum / coordinates.length) as [number, number]

      // Create marker
      const el = document.createElement('div')
      el.className = 'storm-marker'
      el.style.width = '30px'
      el.style.height = '30px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = SEVERITY_COLORS[storm.severity || 'mild'] || '#fef3c7'
      el.style.border = '3px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'

      new mapboxgl.Marker(el)
        .setLngLat(center)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${storm.county || storm.state}</h3>
              <p class="text-sm">${storm.date}</p>
              <p class="text-sm">Hail: ${storm.hail_size || 'N/A'}"</p>
            </div>
          `)
        )
        .addTo(map.current)

      el.addEventListener('click', () => {
        onStormSelect?.(storm)
      })
    })
  }, [storms, mapLoaded, onStormSelect])

  // Highlight selected storm
  useEffect(() => {
    if (!map.current || !selectedStorm?.geometry) return

    // Add or update selected storm polygon
    if (map.current.getSource('selected-storm')) {
      (map.current.getSource('selected-storm') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: selectedStorm.geometry,
        properties: {}
      })
    } else {
      map.current.addSource('selected-storm', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: selectedStorm.geometry,
          properties: {}
        }
      })

      map.current.addLayer({
        id: 'selected-storm-fill',
        type: 'fill',
        source: 'selected-storm',
        paint: {
          'fill-color': SEVERITY_COLORS[selectedStorm.severity || 'mild'] || '#fef3c7',
          'fill-opacity': 0.3
        }
      })

      map.current.addLayer({
        id: 'selected-storm-outline',
        type: 'line',
        source: 'selected-storm',
        paint: {
          'line-color': SEVERITY_COLORS[selectedStorm.severity || 'mild'] || '#fef3c7',
          'line-width': 3
        }
      })
    }

    // Fit map to storm bounds
    const coordinates = selectedStorm.geometry.coordinates[0]
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
    )
    map.current.fitBounds(bounds, { padding: 50 })
  }, [selectedStorm])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold text-sm mb-3">Storm Severity</h4>
        <div className="space-y-2">
          {[
            { level: 'mild', label: 'Light', color: SEVERITY_COLORS['mild'] },
            { level: 'moderate', label: 'Moderate', color: SEVERITY_COLORS['moderate'] },
            { level: 'severe', label: 'Severe', color: SEVERITY_COLORS['severe'] },
            { level: 'extreme', label: 'Extreme', color: SEVERITY_COLORS['extreme'] },
          ].map((item) => (
            <div key={item.level} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
