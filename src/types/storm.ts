export interface Storm {
  id: string
  event_id: string
  name?: string
  date: string
  state: string
  county?: string
  severity?: string
  hail_size?: number
  affected_properties?: number
  estimated_damage?: number
  latitude?: number
  longitude?: number
  geometry?: GeoJSON.Polygon
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StormFilters {
  dateFrom?: string
  dateTo?: string
  states?: string[]
  severity?: string[]
  minHailSize?: number
}

export const SEVERITY_LABELS: Record<string, string> = {
  mild: 'Light',
  moderate: 'Moderate',
  severe: 'Severe',
  extreme: 'Extreme'
}

export const SEVERITY_COLORS: Record<string, string> = {
  mild: '#fef3c7',
  moderate: '#fbbf24',
  severe: '#f97316',
  extreme: '#dc2626'
}
