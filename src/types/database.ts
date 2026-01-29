export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      storms: {
        Row: {
          id: string
          event_id: string | null
          event_name: string | null
          event_date: string
          state: string
          county: string | null
          severity: number | null
          max_hail_size: number | null
          geometry: Json | null
          bounds: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          event_name?: string | null
          event_date: string
          state: string
          county?: string | null
          severity?: number | null
          max_hail_size?: number | null
          geometry?: Json | null
          bounds?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          event_name?: string | null
          event_date?: string
          state?: string
          county?: string | null
          severity?: number | null
          max_hail_size?: number | null
          geometry?: Json | null
          bounds?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          user_id: string
          storm_id: string
          address: string
          city: string | null
          state: string
          zip_code: string | null
          county: string | null
          coordinates: Json | null
          parcel_id: string | null
          property_type: string | null
          year_built: number | null
          square_footage: number | null
          estimated_value: number | null
          roof_age: number | null
          roof_material: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_email: string | null
          mailing_address: string | null
          lead_score: number | null
          score_factors: Json | null
          status: string
          contacted_at: string | null
          appointment_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storm_id: string
          address: string
          city?: string | null
          state: string
          zip_code?: string | null
          county?: string | null
          coordinates?: Json | null
          parcel_id?: string | null
          property_type?: string | null
          year_built?: number | null
          square_footage?: number | null
          estimated_value?: number | null
          roof_age?: number | null
          roof_material?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          mailing_address?: string | null
          lead_score?: number | null
          score_factors?: Json | null
          status?: string
          contacted_at?: string | null
          appointment_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          storm_id?: string
          address?: string
          city?: string | null
          state?: string
          zip_code?: string | null
          county?: string | null
          coordinates?: Json | null
          parcel_id?: string | null
          property_type?: string | null
          year_built?: number | null
          square_footage?: number | null
          estimated_value?: number | null
          roof_age?: number | null
          roof_material?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          mailing_address?: string | null
          lead_score?: number | null
          score_factors?: Json | null
          status?: string
          contacted_at?: string | null
          appointment_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
