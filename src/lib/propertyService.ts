import { supabase } from './supabase'
import type { Property } from '../types/property'
import type { ArcGISParcel } from './arcgisService'

export const propertyService = {
  /**
   * Fetch properties with optional filters
   */
  async getProperties(filters?: {
    state?: string
    arcgis_parcel_id?: string
    limit?: number
  }): Promise<Property[]> {
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }
    if (filters?.arcgis_parcel_id) {
      query = query.eq('arcgis_parcel_id', filters.arcgis_parcel_id)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(500)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching properties:', error)
      throw error
    }
    return (data || []) as Property[]
  },

  /**
   * Fetch a single property by ID
   */
  async getPropertyById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching property:', error)
      throw error
    }
    return data as Property
  },

  /**
   * Upsert property (insert or update by arcgis_parcel_id if present)
   */
  async upsertProperty(property: Partial<Property> & { address: string }): Promise<Property> {
    const row = {
      address: property.address,
      city: property.city ?? null,
      state: property.state ?? null,
      zip: property.zip ?? null,
      county: property.county ?? null,
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
      parcel_geometry: property.parcel_geometry ?? null,
      arcgis_parcel_id: property.arcgis_parcel_id ?? null,
      owner_name: property.owner_name ?? null,
      owner_phone: property.owner_phone ?? null,
      owner_email: property.owner_email ?? null,
      estimated_value: property.estimated_value ?? null,
      updated_at: new Date().toISOString(),
    }

    if (property.arcgis_parcel_id) {
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('arcgis_parcel_id', property.arcgis_parcel_id)
        .limit(1)
        .maybeSingle()

      if (existing) {
        const { data: updated, error } = await supabase
          .from('properties')
          .update(row)
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return updated as Property
      }
    }

    const { data: inserted, error } = await supabase
      .from('properties')
      .insert({ ...row, id: property.id ?? undefined })
      .select()
      .single()
    if (error) throw error
    return inserted as Property
  },

  /**
   * Get properties that overlap a storm path (by path_id).
   * Uses point_in_storm_path for each property with lat/lon.
   */
  async getPropertiesInStormPath(pathId: string): Promise<Property[]> {
    const properties = await this.getProperties({ limit: 5000 })
    const results: Property[] = []
    for (const p of properties) {
      if (p.latitude != null && p.longitude != null) {
        const { data: within, error } = await supabase.rpc('point_in_storm_path', {
          p_latitude: p.latitude,
          p_longitude: p.longitude,
          path_id: pathId,
        })
        if (!error && within) results.push(p)
      }
    }
    return results
  },

  /**
   * Create or update property from ArcGIS parcel; returns property with id
   */
  async createPropertyFromArcGISParcel(parcel: ArcGISParcel): Promise<Property> {
    return this.upsertProperty({
      address: parcel.address,
      city: parcel.city ?? null,
      state: parcel.state ?? 'WI',
      zip: parcel.zip ?? null,
      county: parcel.county ?? null,
      latitude: parcel.latitude ?? null,
      longitude: parcel.longitude ?? null,
      arcgis_parcel_id: parcel.stateId ?? parcel.id,
      owner_name: parcel.ownerName ?? null,
      estimated_value: parcel.estimatedValue ?? null,
      parcel_geometry: parcel.geometry ?? null,
    })
  },

  /**
   * Upsert property from map PropertyMarker (e.g. from ArcGIS affected properties)
   */
  async upsertPropertyFromMarker(marker: {
    id: string
    address: string
    ownerName?: string
    latitude: number
    longitude: number
    estimatedValue?: number
    parcelGeometry?: GeoJSON.Geometry
  }): Promise<Property> {
    return this.upsertProperty({
      address: marker.address,
      state: 'WI',
      latitude: marker.latitude,
      longitude: marker.longitude,
      arcgis_parcel_id: marker.id,
      owner_name: marker.ownerName ?? null,
      estimated_value: marker.estimatedValue ?? null,
      parcel_geometry: marker.parcelGeometry ?? null,
    })
  },
}
