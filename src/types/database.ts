export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type StormSeverity = 'light' | 'mild' | 'moderate' | 'severe' | 'extreme'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'appointment' | 'won' | 'lost'
export type DamageSeverity = 'minor' | 'moderate' | 'severe'

export interface Database {
  public: {
    Tables: {
      // storm_events table - NOAA hail data
      storm_events: {
        Row: {
          id: string
          event_id: string | null
          state: string | null
          county: string | null
          location: string | null
          begin_date_time: string | null
          end_date_time: string | null
          magnitude: number | null
          latitude: number | null
          longitude: number | null
          event_narrative: string | null
          source: string | null
          year: number | null
          month_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          state?: string | null
          county?: string | null
          location?: string | null
          begin_date_time?: string | null
          end_date_time?: string | null
          magnitude?: number | null
          latitude?: number | null
          longitude?: number | null
          event_narrative?: string | null
          source?: string | null
          year?: number | null
          month_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          state?: string | null
          county?: string | null
          location?: string | null
          begin_date_time?: string | null
          end_date_time?: string | null
          magnitude?: number | null
          latitude?: number | null
          longitude?: number | null
          event_narrative?: string | null
          source?: string | null
          year?: number | null
          month_name?: string | null
          created_at?: string
        }
      }
      // storm_paths table - GeoJSON storm polygons from shapefiles
      storm_paths: {
        Row: {
          id: string
          event_id: string | null
          om_id: number | null           // SPC storm report ID
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
          geometry: Json | null
          centroid_lat: number | null
          centroid_lon: number | null
          properties: Json | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          om_id?: number | null
          begin_date?: string | null
          end_date?: string | null
          year?: number | null
          month?: number | null
          day?: number | null
          state?: string | null
          state_fips?: string | null
          county?: string | null
          county_fips?: string | null
          magnitude?: number | null
          severity?: string | null
          geometry?: Json | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          properties?: Json | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          om_id?: number | null
          begin_date?: string | null
          end_date?: string | null
          year?: number | null
          month?: number | null
          day?: number | null
          state?: string | null
          state_fips?: string | null
          county?: string | null
          county_fips?: string | null
          magnitude?: number | null
          severity?: string | null
          geometry?: Json | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          properties?: Json | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // properties table - parcels/addresses (geocoded); overlap with storm_path → potential lead
      properties: {
        Row: {
          id: string
          address: string
          city: string | null
          state: string | null
          zip: string | null
          county: string | null
          latitude: number | null
          longitude: number | null
          parcel_geometry: Json | null
          arcgis_parcel_id: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_email: string | null
          estimated_value: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          city?: string | null
          state?: string | null
          zip?: string | null
          county?: string | null
          latitude?: number | null
          longitude?: number | null
          parcel_geometry?: Json | null
          arcgis_parcel_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          estimated_value?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          city?: string | null
          state?: string | null
          zip?: string | null
          county?: string | null
          latitude?: number | null
          longitude?: number | null
          parcel_geometry?: Json | null
          arcgis_parcel_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          estimated_value?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      // Legacy storms table (kept for compatibility)
      storms: {
        Row: {
          id: string
          event_id: string
          name: string
          state: string
          county: string | null
          date: string
          severity: StormSeverity | null
          hail_size: number | null
          affected_properties: number
          estimated_damage: number
          latitude: number
          longitude: number
          narrative: string | null
          timezone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          state: string
          county?: string | null
          date: string
          severity?: StormSeverity | null
          hail_size?: number | null
          affected_properties?: number
          estimated_damage?: number
          latitude: number
          longitude: number
          narrative?: string | null
          timezone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          state?: string
          county?: string | null
          date?: string
          severity?: StormSeverity | null
          hail_size?: number | null
          affected_properties?: number
          estimated_damage?: number
          latitude?: number
          longitude?: number
          narrative?: string | null
          timezone?: string | null
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          property_id: string | null        // Link to properties table
          storm_id: string | null
          storm_path_id: string | null      // Link to storm_paths table
          owner_name: string
          address: string
          city: string
          state: string
          zip: string
          phone: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          lead_score: number | null
          status: LeadStatus
          damage_severity: DamageSeverity | null
          roof_age: number | null
          property_value: number | null
          notes: string | null
          arcgis_parcel_id: string | null   // Wisconsin parcel STATEID
          parcel_geometry: Json | null       // Cached parcel geometry
          owner_phone: string | null         // Skip traced phone
          owner_email: string | null         // Skip traced email
          skip_traced_at: string | null      // When skip trace was performed
          estimated_value: number | null     // Estimated property value from ArcGIS
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          storm_id?: string | null
          storm_path_id?: string | null
          owner_name: string
          address: string
          city: string
          state: string
          zip: string
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          lead_score?: number | null
          status?: LeadStatus
          damage_severity?: DamageSeverity | null
          roof_age?: number | null
          property_value?: number | null
          notes?: string | null
          arcgis_parcel_id?: string | null
          parcel_geometry?: Json | null
          owner_phone?: string | null
          owner_email?: string | null
          skip_traced_at?: string | null
          estimated_value?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          storm_id?: string | null
          storm_path_id?: string | null
          owner_name?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          lead_score?: number | null
          status?: LeadStatus
          damage_severity?: DamageSeverity | null
          roof_age?: number | null
          property_value?: number | null
          notes?: string | null
          arcgis_parcel_id?: string | null
          parcel_geometry?: Json | null
          owner_phone?: string | null
          owner_email?: string | null
          skip_traced_at?: string | null
          estimated_value?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          avatar_url: string | null
          business_address: string | null
          notification_prefs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          business_address?: string | null
          notification_prefs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          business_address?: string | null
          notification_prefs?: Json
          created_at?: string
          updated_at?: string
        }
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

// Storm Event type matching storm_events table (NOAA hail data)
export interface StormEvent {
  id: string
  event_id: string
  name: string
  date: string
  state: string
  county: string | null
  latitude: number
  longitude: number
  severity: 'light' | 'moderate' | 'severe' | 'extreme'
  magnitude: number | null
  event_narrative?: string | null
  source?: string | null
  year?: number | null
  month_name?: string | null
}

// Convenience types for use in components
export type Storm = Database['public']['Tables']['storms']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type LeadNote = Database['public']['Tables']['lead_notes']['Row']
