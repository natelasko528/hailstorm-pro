import { supabase } from './supabase'
import type { StormEvent } from '../types/database'
import type { StormPath } from '../components/map/StormMap'

/**
 * Sanitize string for Supabase text search to prevent injection
 * Escapes special characters used in PostgREST filter syntax
 */
function sanitizeSearchTerm(value: string): string {
  if (!value) return ''
  return value
    .replace(/\\/g, '\\\\')        // Escape backslashes first
    .replace(/%/g, '\\%')          // Escape percent signs (LIKE wildcards)
    .replace(/_/g, '\\_')          // Escape underscores (LIKE wildcards)
    .replace(/'/g, "''")           // Escape single quotes
    .replace(/"/g, '\\"')          // Escape double quotes
    .replace(/\(/g, '\\(')         // Escape parentheses
    .replace(/\)/g, '\\)')
    .replace(/\./g, '\\.')         // Escape dots
    .replace(/,/g, '\\,')          // Escape commas (used in OR conditions)
    .trim()
}

// Helper to determine severity from hail magnitude
function getSeverityFromMagnitude(magnitude: number | null): string {
  if (!magnitude) return 'moderate'
  if (magnitude >= 2.0) return 'extreme'
  if (magnitude >= 1.5) return 'severe'
  if (magnitude >= 1.0) return 'moderate'
  return 'light'
}

// Database row interface for storms table
interface StormRow {
  id: string
  event_id: string
  name: string
  state: string
  county: string | null
  date: string
  severity: string | null
  hail_size: number | null
  affected_properties: number | null
  estimated_damage: number | null
  latitude: number
  longitude: number
  narrative: string | null
  timezone: string | null
  created_at: string
}

// Database row interface for storm_paths
interface StormPathRow {
  id: string
  event_id: string | null
  begin_date: string | null
  state: string | null
  county: string | null
  magnitude: number | null
  severity: string | null
  geometry: unknown
  properties: unknown
}

// RPC function response row (geometry is already GeoJSON)
interface StormPathRpcRow {
  id: string
  event_id: string | null
  om_id: number | null
  begin_date: string | null
  end_date: string | null
  year: number | null
  month: number | null
  day: number | null
  state: string | null
  state_fips: string | null
  county: string | null
  county_fips: string | null
  magnitude: number | null
  severity: string | null
  geometry_geojson: unknown // Already converted to GeoJSON by RPC
  centroid_lat: number | null
  centroid_lon: number | null
  properties: unknown
  source: string | null
  created_at: string | null
  updated_at: string | null
}

// Haversine distance formula for calculating distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Normalize geometry from RPC response (JSONB can arrive as object or string).
 * Unwraps GeoJSON Feature if present. Returns valid GeoJSON.Geometry or null.
 */
function normalizeGeometry(geometry_geojson: unknown): GeoJSON.Geometry | null {
  if (geometry_geojson == null) return null
  let geom: unknown = geometry_geojson
  if (typeof geometry_geojson === 'string') {
    try {
      geom = JSON.parse(geometry_geojson)
    } catch {
      return null
    }
  }
  if (typeof geom !== 'object' || geom === null) return null
  const g = geom as Record<string, unknown>
  // Unwrap GeoJSON Feature so we only validate Geometry
  if (g.type === 'Feature' && g.geometry != null && typeof g.geometry === 'object') {
    geom = g.geometry
  }
  const inner = geom as Record<string, unknown>
  const validTypes = ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString', 'Point', 'MultiPoint']
  if (!validTypes.includes(inner.type as string)) return null
  if (inner.coordinates === undefined) return null
  return geom as GeoJSON.Geometry
}

export const stormService = {
  /**
   * Fetch all storms with optional filtering
   * Uses storms table with NOAA hail data
   */
  async getStorms(filters?: {
    state?: string
    severity?: string
    startDate?: string
    endDate?: string
    limit?: number
  }) {
    let query = supabase
      .from('storms')
      .select('*')
      .order('date', { ascending: false })

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    // Filter by severity directly
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100) // Default limit
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching storms:', error)
      throw error
    }

    // Transform to StormEvent-compatible format
    return ((data || []) as StormRow[]).map(storm => ({
      id: storm.id,
      event_id: storm.event_id,
      name: storm.name,
      date: storm.date,
      state: storm.state,
      county: storm.county,
      latitude: Number(storm.latitude),
      longitude: Number(storm.longitude),
      severity: (storm.severity || 'moderate') as StormEvent['severity'],
      magnitude: storm.hail_size ? Number(storm.hail_size) : null,
      event_narrative: storm.narrative,
      source: null,
      year: new Date(storm.date).getFullYear(),
      month_name: new Date(storm.date).toLocaleString('en-US', { month: 'long' }),
    })) as StormEvent[]
  },

  /**
   * Fetch a single storm by ID
   */
  async getStorm(id: string) {
    const { data, error } = await supabase
      .from('storms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching storm:', error)
      throw error
    }

    const storm = data as StormRow
    return {
      id: storm.id,
      event_id: storm.event_id,
      name: storm.name,
      date: storm.date,
      state: storm.state,
      county: storm.county,
      latitude: Number(storm.latitude),
      longitude: Number(storm.longitude),
      severity: (storm.severity || 'moderate') as StormEvent['severity'],
      magnitude: storm.hail_size ? Number(storm.hail_size) : null,
      event_narrative: storm.narrative,
      source: null,
      year: new Date(storm.date).getFullYear(),
      month_name: new Date(storm.date).toLocaleString('en-US', { month: 'long' }),
    } as StormEvent
  },

  /**
   * Get storms within a geographic bounding box
   */
  async getStormsInBounds(bounds: {
    north: number
    south: number
    east: number
    west: number
  }) {
    const { data, error } = await supabase
      .from('storms')
      .select('*')
      .gte('latitude', bounds.south)
      .lte('latitude', bounds.north)
      .gte('longitude', bounds.west)
      .lte('longitude', bounds.east)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching storms in bounds:', error)
      throw error
    }

    return ((data || []) as StormRow[]).map(storm => ({
      id: storm.id,
      event_id: storm.event_id,
      name: storm.name,
      date: storm.date,
      state: storm.state,
      county: storm.county,
      latitude: Number(storm.latitude),
      longitude: Number(storm.longitude),
      severity: (storm.severity || 'moderate') as StormEvent['severity'],
      magnitude: storm.hail_size ? Number(storm.hail_size) : null,
      event_narrative: storm.narrative,
    })) as StormEvent[]
  },

  /**
   * Search storms by text
   * Uses sanitized search term to prevent SQL injection
   */
  async searchStorms(searchTerm: string) {
    // Sanitize the search term to prevent injection
    const sanitized = sanitizeSearchTerm(searchTerm)
    
    // Use Supabase's filter with properly sanitized term
    const filterString = `name.ilike.*${sanitized}*,state.ilike.*${sanitized}*,county.ilike.*${sanitized}*`
    
    const { data, error } = await supabase
      .from('storms')
      .select('*')
      .or(filterString)
      .order('date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error searching storms:', error)
      throw error
    }

    return ((data || []) as StormRow[]).map(storm => ({
      id: storm.id,
      event_id: storm.event_id,
      name: storm.name,
      date: storm.date,
      state: storm.state,
      county: storm.county,
      latitude: Number(storm.latitude),
      longitude: Number(storm.longitude),
      severity: (storm.severity || 'moderate') as StormEvent['severity'],
      magnitude: storm.hail_size ? Number(storm.hail_size) : null,
    })) as StormEvent[]
  },

  /**
   * Get storm statistics
   */
  async getStats() {
    const { count: totalStorms } = await supabase
      .from('storms')
      .select('*', { count: 'exact', head: true })

    const { data: recentStorms } = await supabase
      .from('storms')
      .select('*')
      .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    const { data: severeStorms } = await supabase
      .from('storms')
      .select('*')
      .in('severity', ['severe', 'extreme'])

    return {
      total: totalStorms || 0,
      recent: recentStorms?.length || 0,
      severe: severeStorms?.length || 0,
    }
  },

  // ============================================
  // STORM PATHS (from shapefiles)
  // ============================================

  /**
   * Fetch storm paths with optional filtering
   * Uses RPC function to get geometry as GeoJSON (PostGIS converts binary to JSON)
   */
  async getStormPaths(filters?: {
    state?: string
    severity?: string
    startDate?: string
    endDate?: string
    year?: number
    limit?: number
  }): Promise<StormPath[]> {
    // Prefer buffered polygon RPC (map + overlap); fallback to raw GeoJSON RPC
    let data: StormPathRpcRow[] | null = null
    const rpcParams = {
      filter_state: filters?.state || null,
      filter_severity: filters?.severity || null,
      filter_year: filters?.year || null,
      filter_start_date: filters?.startDate || null,
      filter_end_date: filters?.endDate || null,
      max_results: filters?.limit || 100
    }
    const buffered = await supabase.rpc('get_storm_paths_as_geojson_buffered', { ...rpcParams, buffer_meters: 500 })
    if (buffered.error) {
      const raw = await supabase.rpc('get_storm_paths_as_geojson', rpcParams)
      if (raw.error) {
        if (raw.error.code === '42883' || raw.error.message?.includes('function')) {
          return this.getStormPathsFallback(filters)
        }
        if (raw.error.code === '42P01') return []
        throw raw.error
      }
      data = raw.data as StormPathRpcRow[]
    } else {
      data = buffered.data as StormPathRpcRow[]
    }

    const paths: StormPath[] = []
    for (const row of (data || []) as StormPathRpcRow[]) {
      const geometry = normalizeGeometry(row.geometry_geojson)
      if (!geometry) continue
      paths.push({
        id: row.id,
        event_id: row.event_id || undefined,
        begin_date: row.begin_date || undefined,
        state: row.state || undefined,
        county: row.county || undefined,
        magnitude: row.magnitude ?? undefined,
        severity: row.severity || getSeverityFromMagnitude(row.magnitude ?? null),
        geometry,
        properties: (row.properties || {}) as Record<string, unknown>
      })
    }
    return paths
  },

  /**
   * Fallback method for fetching storm paths (used if RPC not available)
   */
  async getStormPathsFallback(filters?: {
    state?: string
    severity?: string
    startDate?: string
    endDate?: string
    year?: number
    limit?: number
  }): Promise<StormPath[]> {
    let query = supabase
      .from('storm_paths')
      .select('*')
      .order('begin_date', { ascending: false })

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters?.year) {
      query = query.eq('year', filters.year)
    }

    if (filters?.startDate) {
      query = query.gte('begin_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('begin_date', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching storm paths (fallback):', error)
      if (error.code === '42P01') return []
      throw error
    }

    return ((data || []) as StormPathRow[]).map((row) => {
      // Try to parse geometry - it might be stored as JSON string or as object
      let geometry: GeoJSON.Geometry | null = null
      if (row.geometry) {
        if (typeof row.geometry === 'string') {
          try {
            geometry = JSON.parse(row.geometry)
          } catch {
            console.warn('Failed to parse geometry string for path:', row.id)
          }
        } else if (typeof row.geometry === 'object') {
          geometry = row.geometry as unknown as GeoJSON.Geometry
        }
      }
      
      return {
        id: row.id,
        event_id: row.event_id || undefined,
        begin_date: row.begin_date || undefined,
        state: row.state || undefined,
        county: row.county || undefined,
        magnitude: row.magnitude || undefined,
        severity: row.severity || getSeverityFromMagnitude(row.magnitude || null),
        geometry: geometry as GeoJSON.Geometry,
        properties: (row.properties || {}) as Record<string, unknown>
      }
    }).filter(path => path.geometry !== null) as StormPath[]
  },

  /**
   * Fetch a single storm path by ID
   * Uses RPC function to get geometry as GeoJSON
   */
  async getStormPath(id: string): Promise<StormPath | null> {
    const { data, error } = await supabase.rpc('get_storm_path_by_id', {
      path_id: id
    })

    if (error) {
      console.error('Error fetching storm path:', error)
      // Fallback to direct query
      if (error.code === '42883' || error.message?.includes('function')) {
        return this.getStormPathFallback(id)
      }
      return null
    }

    if (!data || data.length === 0) return null

    const row = data[0] as StormPathRpcRow
    const geometry = normalizeGeometry(row.geometry_geojson)
    if (!geometry) return null
    return {
      id: row.id,
      event_id: row.event_id || undefined,
      begin_date: row.begin_date || undefined,
      state: row.state || undefined,
      county: row.county || undefined,
      magnitude: row.magnitude ?? undefined,
      severity: row.severity || getSeverityFromMagnitude(row.magnitude ?? null),
      geometry,
      properties: (row.properties || {}) as Record<string, unknown>
    }
  },

  /**
   * Fallback for fetching single storm path
   */
  async getStormPathFallback(id: string): Promise<StormPath | null> {
    const { data, error } = await supabase
      .from('storm_paths')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching storm path (fallback):', error)
      return null
    }

    const row = data as StormPathRow
    let geometry: GeoJSON.Geometry | null = null
    if (row.geometry) {
      if (typeof row.geometry === 'string') {
        try {
          geometry = JSON.parse(row.geometry)
        } catch {
          console.warn('Failed to parse geometry string')
        }
      } else if (typeof row.geometry === 'object') {
        geometry = row.geometry as unknown as GeoJSON.Geometry
      }
    }

    if (!geometry) return null

    return {
      id: row.id,
      event_id: row.event_id || undefined,
      begin_date: row.begin_date || undefined,
      state: row.state || undefined,
      county: row.county || undefined,
      magnitude: row.magnitude || undefined,
      severity: row.severity || getSeverityFromMagnitude(row.magnitude || null),
      geometry,
      properties: (row.properties || {}) as Record<string, unknown>
    }
  },

  /**
   * Find storm path by NOAA event ID
   */
  async getStormPathByEventId(eventId: string): Promise<StormPath | null> {
    const { data, error } = await supabase.rpc('get_storm_path_by_event_id', {
      p_event_id: eventId
    })

    if (error) {
      console.error('Error fetching storm path by event ID:', error)
      // Fallback to direct query
      if (error.code === '42883' || error.message?.includes('function')) {
        return this.getStormPathByEventIdFallback(eventId)
      }
      return null
    }

    if (!data || data.length === 0) return null

    const row = data[0] as StormPathRpcRow
    const geometry = normalizeGeometry(row.geometry_geojson)
    if (!geometry) return null
    return {
      id: row.id,
      event_id: row.event_id || undefined,
      begin_date: row.begin_date || undefined,
      state: row.state || undefined,
      county: row.county || undefined,
      magnitude: row.magnitude ?? undefined,
      severity: row.severity || getSeverityFromMagnitude(row.magnitude ?? null),
      geometry,
      properties: (row.properties || {}) as Record<string, unknown>
    }
  },

  /**
   * Fallback for finding storm path by event ID
   */
  async getStormPathByEventIdFallback(eventId: string): Promise<StormPath | null> {
    const { data, error } = await supabase
      .from('storm_paths')
      .select('*')
      .eq('event_id', eventId)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      console.error('Error fetching storm path by event ID (fallback):', error)
      return null
    }

    const row = data as StormPathRow
    let geometry: GeoJSON.Geometry | null = null
    if (row.geometry) {
      if (typeof row.geometry === 'string') {
        try {
          geometry = JSON.parse(row.geometry)
        } catch {
          console.warn('Failed to parse geometry string')
        }
      } else if (typeof row.geometry === 'object') {
        geometry = row.geometry as unknown as GeoJSON.Geometry
      }
    }

    if (!geometry) return null

    return {
      id: row.id,
      event_id: row.event_id || undefined,
      begin_date: row.begin_date || undefined,
      state: row.state || undefined,
      county: row.county || undefined,
      magnitude: row.magnitude || undefined,
      severity: row.severity || getSeverityFromMagnitude(row.magnitude || null),
      geometry,
      properties: (row.properties || {}) as Record<string, unknown>
    }
  },

  /**
   * Find storm paths near a geographic location
   * @param lat Latitude
   * @param lon Longitude  
   * @param radiusKm Search radius in kilometers (default 10km)
   * @param limit Max results to return (default 10)
   */
  async getStormPathsNearLocation(
    lat: number, 
    lon: number, 
    radiusKm: number = 10,
    limit: number = 10
  ): Promise<(StormPath & { distance_km?: number })[]> {
    const { data, error } = await supabase.rpc('get_storm_paths_near_location', {
      p_latitude: lat,
      p_longitude: lon,
      radius_km: radiusKm,
      max_results: limit
    })

    if (error) {
      console.error('Error fetching storm paths near location:', error)
      // Fallback to centroid-based search
      if (error.code === '42883' || error.message?.includes('function')) {
        return this.getStormPathsNearLocationFallback(lat, lon, radiusKm, limit)
      }
      return []
    }

    const paths: (StormPath & { distance_km?: number })[] = []
    for (const row of (data || []) as (StormPathRpcRow & { distance_km?: number })[]) {
      const geometry = normalizeGeometry(row.geometry_geojson)
      if (!geometry) continue
      paths.push({
        id: row.id,
        event_id: row.event_id || undefined,
        begin_date: row.begin_date || undefined,
        state: row.state || undefined,
        county: row.county || undefined,
        magnitude: row.magnitude ?? undefined,
        severity: row.severity || getSeverityFromMagnitude(row.magnitude ?? null),
        geometry,
        properties: (row.properties || {}) as Record<string, unknown>,
        distance_km: row.distance_km
      })
    }
    return paths
  },

  /**
   * Fallback for finding storm paths near location using centroid
   */
  async getStormPathsNearLocationFallback(
    lat: number,
    lon: number,
    radiusKm: number = 10,
    limit: number = 10
  ): Promise<(StormPath & { distance_km?: number })[]> {
    // Convert radius to approximate degrees (rough approximation)
    const radiusDeg = radiusKm / 111 // ~111km per degree

    const { data, error } = await supabase
      .from('storm_paths')
      .select('*')
      .gte('centroid_lat', lat - radiusDeg)
      .lte('centroid_lat', lat + radiusDeg)
      .gte('centroid_lon', lon - radiusDeg)
      .lte('centroid_lon', lon + radiusDeg)
      .limit(limit)

    if (error) {
      console.error('Error fetching storm paths near location (fallback):', error)
      return []
    }

    return ((data || []) as StormPathRow[])
      .map((row) => {
        let geometry: GeoJSON.Geometry | null = null
        if (row.geometry) {
          if (typeof row.geometry === 'string') {
            try {
              geometry = JSON.parse(row.geometry)
            } catch {
              console.warn('Failed to parse geometry string')
            }
          } else if (typeof row.geometry === 'object') {
            geometry = row.geometry as unknown as GeoJSON.Geometry
          }
        }

        if (!geometry) return null

        // Calculate approximate distance using Haversine
        const centroidLat = (row as unknown as { centroid_lat?: number }).centroid_lat
        const centroidLon = (row as unknown as { centroid_lon?: number }).centroid_lon
        let distance_km: number | undefined
        if (centroidLat && centroidLon) {
          distance_km = haversineDistance(lat, lon, centroidLat, centroidLon)
        }

        return {
          id: row.id,
          event_id: row.event_id || undefined,
          begin_date: row.begin_date || undefined,
          state: row.state || undefined,
          county: row.county || undefined,
          magnitude: row.magnitude || undefined,
          severity: row.severity || getSeverityFromMagnitude(row.magnitude || null),
          geometry,
          properties: (row.properties || {}) as Record<string, unknown>,
          distance_km
        }
      })
      .filter((path): path is Exclude<typeof path, null> => path !== null)
      .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
  },

  /**
   * Get storm paths statistics
   */
  async getStormPathsStats(): Promise<{
    total: number
    byState: Record<string, number>
    bySeverity: Record<string, number>
  }> {
    const { count: total } = await supabase
      .from('storm_paths')
      .select('*', { count: 'exact', head: true })

    const { data: stateData } = await supabase
      .from('storm_paths')
      .select('state')

    const { data: severityData } = await supabase
      .from('storm_paths')
      .select('severity')

    const byState: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    stateData?.forEach(row => {
      const state = (row as { state?: string }).state || 'Unknown'
      byState[state] = (byState[state] || 0) + 1
    })

    severityData?.forEach(row => {
      const severity = (row as { severity?: string }).severity || 'Unknown'
      bySeverity[severity] = (bySeverity[severity] || 0) + 1
    })

    return {
      total: total || 0,
      byState,
      bySeverity
    }
  },
}
