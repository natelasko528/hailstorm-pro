export interface Storm {
  id: string
  event_id: string
  event_name?: string
  event_date: string
  state: string
  county?: string
  severity: 1 | 2 | 3 | 4
  max_hail_size?: number
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
  severity?: number[]
  minHailSize?: number
}

export const SEVERITY_LABELS = {
  1: 'Light',
  2: 'Moderate',
  3: 'Severe',
  4: 'Extreme'
} as const

export const SEVERITY_COLORS = {
  1: '#fef3c7',
  2: '#fbbf24',
  3: '#f97316',
  4: '#dc2626'
} as const
