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
        Relationships: []
      }
      storms: {
        Row: {
          id: string
          event_id: string | null
          name: string | null
          date: string
          state: string
          county: string | null
          severity: string | null
          hail_size: number | null
          affected_properties: number | null
          estimated_damage: number | null
          latitude: number | null
          longitude: number | null
          geometry: Json | null
          bounds: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          name?: string | null
          date: string
          state: string
          county?: string | null
          severity?: string | null
          hail_size?: number | null
          affected_properties?: number | null
          estimated_damage?: number | null
          latitude?: number | null
          longitude?: number | null
          geometry?: Json | null
          bounds?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          name?: string | null
          date?: string
          state?: string
          county?: string | null
          severity?: string | null
          hail_size?: number | null
          affected_properties?: number | null
          estimated_damage?: number | null
          latitude?: number | null
          longitude?: number | null
          geometry?: Json | null
          bounds?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          storm_id: string | null
          owner_name: string
          address: string
          city: string
          state: string
          zip: string
          phone: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          lead_score: number
          status: string
          damage_severity: string | null
          roof_age: number | null
          property_value: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          storm_id?: string | null
          owner_name: string
          address: string
          city: string
          state: string
          zip: string
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          lead_score?: number
          status?: string
          damage_severity?: string | null
          roof_age?: number | null
          property_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          storm_id?: string | null
          owner_name?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          lead_score?: number
          status?: string
          damage_severity?: string | null
          roof_age?: number | null
          property_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
