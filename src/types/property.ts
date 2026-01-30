// Matches properties table (database row)
export interface Property {
  id: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
  county: string | null
  latitude: number | null
  longitude: number | null
  parcel_geometry: GeoJSON.Geometry | Record<string, unknown> | null
  arcgis_parcel_id: string | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  estimated_value: number | null
  created_at: string
  updated_at: string
}

export type PropertyStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'appointment'
  | 'proposal'
  | 'won'
  | 'lost'

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  appointment: 'Appointment Set',
  proposal: 'Proposal Sent',
  won: 'Won',
  lost: 'Lost'
}

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  appointment: 'bg-green-100 text-green-800',
  proposal: 'bg-indigo-100 text-indigo-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800'
}

export interface PropertyFilters {
  state?: string
  arcgis_parcel_id?: string
  limit?: number
}
