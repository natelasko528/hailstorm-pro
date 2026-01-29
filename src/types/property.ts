export interface Property {
  id: string
  user_id: string
  storm_id: string
  
  // Location
  address: string
  city?: string
  state: string
  zip_code?: string
  county?: string
  coordinates?: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  
  // Property details
  parcel_id?: string
  property_type?: string
  year_built?: number
  square_footage?: number
  estimated_value?: number
  roof_age?: number
  roof_material?: string
  
  // Contact information
  owner_name?: string
  owner_phone?: string
  owner_email?: string
  mailing_address?: string
  
  // Lead scoring
  lead_score?: number
  score_factors?: Record<string, any>
  
  // Status
  status: PropertyStatus
  contacted_at?: string
  appointment_at?: string
  
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
  status?: PropertyStatus[]
  minScore?: number
  maxScore?: number
  propertyType?: string[]
  hasContact?: boolean
}
