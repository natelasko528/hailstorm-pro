import { supabase } from './supabase'
import type { Lead, LeadNote, Json } from '../types/database'
import type { ArcGISParcel } from './arcgisService'
import type { SkipTraceResult } from './skipTraceService'

export type { Lead, LeadNote }

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

// Extended lead data for creating from property
export interface CreateLeadFromPropertyData {
  property: ArcGISParcel | {
    id: string
    stateId?: string
    address: string
    ownerName?: string
    city?: string
    state?: string
    zip?: string
    latitude?: number
    longitude?: number
    estimatedValue?: number
    geometry?: GeoJSON.Geometry
  }
  propertyId?: string | null   // Link to properties table (after upsert)
  stormPathId?: string | null
  stormEventId?: string | null
  skipTraceResult?: SkipTraceResult
}

export const leadService = {
  /**
   * Fetch all leads with optional filtering
   */
  async getLeads(filters?: {
    status?: string
    minScore?: number
    state?: string
    stormId?: string
    limit?: number
  }) {
    let query = supabase
      .from('leads')
      .select('*')
      .order('lead_score', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.minScore) {
      query = query.gte('lead_score', filters.minScore)
    }

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.stormId) {
      query = query.eq('storm_id', filters.stormId)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      throw error
    }

    return data as Lead[]
  },

  /**
   * Fetch a single lead by ID
   */
  async getLead(id: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lead:', error)
      throw error
    }

    return data as Lead
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: Lead['status']) {
    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead status:', error)
      throw error
    }

    return data as Lead
  },

  /**
   * Update lead
   */
  async updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      throw error
    }

    return data as Lead
  },

  /**
   * Create new lead
   */
  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      throw error
    }

    return data as Lead
  },

  /**
   * Delete lead
   */
  async deleteLead(id: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      throw error
    }

    return true
  },

  /**
   * Search leads by text
   * Uses sanitized search term to prevent SQL injection
   */
  async searchLeads(searchTerm: string) {
    // Sanitize the search term to prevent injection
    const sanitized = sanitizeSearchTerm(searchTerm)
    
    // Use Supabase's built-in filter methods which handle escaping
    // The .or() method with properly constructed filter string
    const filterString = `owner_name.ilike.*${sanitized}*,address.ilike.*${sanitized}*,city.ilike.*${sanitized}*`
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(filterString)
      .order('lead_score', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error searching leads:', error)
      throw error
    }

    return data as Lead[]
  },

  /**
   * Get lead statistics
   */
  async getStats() {
    const { count: total } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    const { count: newLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')

    const { count: qualified } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'qualified')

    const { count: won } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'won')

    return {
      total: total || 0,
      new: newLeads || 0,
      qualified: qualified || 0,
      won: won || 0,
    }
  },

  /**
   * Fetch leads with pagination
   */
  async getLeadsPaginated(filters?: {
    status?: string
    minScore?: number
    state?: string
    stormId?: string
    page?: number
    pageSize?: number
    sortBy?: 'lead_score' | 'created_at' | 'property_value'
    sortOrder?: 'asc' | 'desc'
  }) {
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 25
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order(filters?.sortBy || 'lead_score', { 
        ascending: filters?.sortOrder === 'asc' 
      })
      .range(from, to)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.minScore) {
      query = query.gte('lead_score', filters.minScore)
    }

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.stormId) {
      query = query.eq('storm_id', filters.stormId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      throw error
    }

    return {
      leads: data as Lead[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  },

  /**
   * Get notes for a lead
   */
  async getLeadNotes(leadId: string): Promise<LeadNote[]> {
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lead notes:', error)
      throw error
    }

    return data as LeadNote[]
  },

  /**
   * Add a note to a lead
   */
  async addLeadNote(leadId: string, content: string): Promise<LeadNote> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const noteInsert = {
      lead_id: leadId,
      user_id: user.id,
      content,
    }

    const { data, error } = await supabase
      .from('lead_notes')
      .insert(noteInsert)
      .select()
      .single()

    if (error) {
      console.error('Error adding lead note:', error)
      throw error
    }

    return data as LeadNote
  },

  /**
   * Delete a lead note
   */
  async deleteLeadNote(noteId: string): Promise<boolean> {
    const { error } = await supabase
      .from('lead_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting lead note:', error)
      throw error
    }

    return true
  },

  /**
   * Create a lead from ArcGIS property data with optional skip trace results
   */
  async createLeadFromProperty(data: CreateLeadFromPropertyData): Promise<Lead> {
    const { property, propertyId, stormPathId, stormEventId, skipTraceResult } = data

    // Calculate lead score based on available data
    let leadScore = 50 // Base score

    // Boost for property value
    const value = property.estimatedValue
    if (value) {
      if (value > 500000) leadScore += 20
      else if (value > 300000) leadScore += 15
      else if (value > 200000) leadScore += 10
      else if (value > 100000) leadScore += 5
    }

    // Boost for having contact info
    if (skipTraceResult?.success) {
      if (skipTraceResult.phones.length > 0) leadScore += 15
      if (skipTraceResult.emails.length > 0) leadScore += 10
    }

    // Boost for having storm association
    if (stormPathId || stormEventId) leadScore += 10

    // Cap at 100
    leadScore = Math.min(100, leadScore)

    // Get best phone and email from skip trace
    const phone = skipTraceResult?.phones?.[0]?.number || null
    const email = skipTraceResult?.emails?.[0]?.address || null

    // Parse city from address if not provided
    let city = ''
    let state = 'WI'
    let zip = ''

    if ('city' in property && property.city) {
      city = property.city
    }
    if ('state' in property && property.state) {
      state = property.state
    }
    if ('zip' in property && property.zip) {
      zip = property.zip
    }

    // Get the ArcGIS parcel ID from the property
    const arcgisParcelId = 'stateId' in property ? property.stateId : property.id

    const leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
      property_id: propertyId || null,
      storm_id: stormEventId || null,
      storm_path_id: stormPathId || null,
      owner_name: property.ownerName || 'Unknown Owner',
      address: property.address,
      city,
      state,
      zip,
      phone,
      email,
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      lead_score: leadScore,
      status: 'new',
      damage_severity: null,
      roof_age: null,
      property_value: property.estimatedValue || null,
      notes: stormPathId 
        ? 'Lead generated from storm path analysis.'
        : null,
      arcgis_parcel_id: arcgisParcelId || null,
      parcel_geometry: property.geometry ? property.geometry as unknown as Json : null,
      owner_phone: skipTraceResult?.phones?.[0]?.number || null,
      owner_email: skipTraceResult?.emails?.[0]?.address || null,
      skip_traced_at: skipTraceResult?.success ? new Date().toISOString() : null,
      estimated_value: property.estimatedValue || null,
    }

    const { data: createdLead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead from property:', error)
      throw error
    }

    return createdLead as Lead
  },

  /**
   * Check if a lead already exists for a property (by address)
   * Uses sanitized address to prevent SQL injection
   */
  async leadExistsForAddress(address: string): Promise<boolean> {
    // Sanitize the address for the ILIKE query
    const sanitizedAddress = sanitizeSearchTerm(address)
    
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .ilike('address', `*${sanitizedAddress}*`)
      .limit(1)

    if (error) {
      console.error('Error checking for existing lead:', error)
      return false
    }

    return data && data.length > 0
  },

  /**
   * Check which addresses already have leads
   * Returns a Set of addresses that already exist
   * Uses sanitized addresses to prevent SQL injection
   */
  async getExistingLeadAddresses(addresses: string[]): Promise<Set<string>> {
    if (addresses.length === 0) return new Set()

    // Sanitize each address and build OR query
    const orConditions = addresses
      .map(addr => {
        const sanitized = sanitizeSearchTerm(addr)
        return `address.ilike.*${sanitized}*`
      })
      .join(',')
    
    const { data, error } = await supabase
      .from('leads')
      .select('address')
      .or(orConditions)

    if (error) {
      console.error('Error checking existing leads:', error)
      return new Set()
    }

    // Return normalized addresses - filter out undefined values
    const normalizedAddresses = (data || [])
      .map((d: { address?: string }) => d.address?.toLowerCase().trim())
      .filter((addr): addr is string => addr !== undefined)
    return new Set(normalizedAddresses)
  },

  /**
   * Bulk create leads from multiple properties
   * Returns result summary with success/failure counts
   */
  async bulkCreateLeadsFromProperties(
    properties: CreateLeadFromPropertyData['property'][],
    options: {
      propertyIds?: (string | null)[]   // Same order as properties; link each lead to properties table
      stormPathId?: string | null
      stormEventId?: string | null
      skipDuplicateCheck?: boolean
    } = {}
  ): Promise<{
    created: Lead[]
    skipped: number
    failed: number
    errors: string[]
  }> {
    const { propertyIds, stormPathId, stormEventId, skipDuplicateCheck = false } = options
    const result = {
      created: [] as Lead[],
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Check for existing leads if not skipping
    let existingAddresses = new Set<string>()
    if (!skipDuplicateCheck) {
      const addresses = properties.map(p => p.address)
      existingAddresses = await this.getExistingLeadAddresses(addresses)
    }

    // Prepare batch of leads to create
    const leadsToCreate: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[] = []

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i]
      // Skip if already exists
      if (existingAddresses.has(property.address?.toLowerCase().trim())) {
        result.skipped++
        continue
      }

      // Calculate lead score
      let leadScore = 50 // Base score
      const value = property.estimatedValue
      if (value) {
        if (value > 500000) leadScore += 20
        else if (value > 300000) leadScore += 15
        else if (value > 200000) leadScore += 10
        else if (value > 100000) leadScore += 5
      }
      if (stormPathId || stormEventId) leadScore += 10
      leadScore = Math.min(100, leadScore)

      // Parse location fields
      let city = ''
      let state = 'WI'
      let zip = ''
      if ('city' in property && property.city) city = property.city as string
      if ('state' in property && property.state) state = property.state as string
      if ('zip' in property && property.zip) zip = property.zip as string

      // Get the ArcGIS parcel ID from the property
      const arcgisParcelId = 'stateId' in property ? property.stateId : property.id

      const propertyId = propertyIds?.[i] ?? null
      leadsToCreate.push({
        property_id: propertyId ?? null,
        storm_id: stormEventId ?? null,
        storm_path_id: stormPathId ?? null,
        owner_name: property.ownerName || 'Unknown Owner',
        address: property.address,
        city,
        state,
        zip,
        phone: null,
        email: null,
        latitude: property.latitude || null,
        longitude: property.longitude || null,
        lead_score: leadScore,
        status: 'new',
        damage_severity: null,
        roof_age: null,
        property_value: property.estimatedValue || null,
        notes: stormPathId 
          ? 'Lead generated from storm path analysis.'
          : null,
        arcgis_parcel_id: arcgisParcelId || null,
        parcel_geometry: 'geometry' in property && property.geometry 
          ? property.geometry as unknown as Json 
          : null,
        owner_phone: null,
        owner_email: null,
        skip_traced_at: null,
        estimated_value: property.estimatedValue || null,
      })
    }

    // Batch insert (Supabase supports up to 1000 rows per insert)
    if (leadsToCreate.length > 0) {
      const batchSize = 100
      for (let i = 0; i < leadsToCreate.length; i += batchSize) {
        const batch = leadsToCreate.slice(i, i + batchSize)
        
        const { data, error } = await supabase
          .from('leads')
          .insert(batch)
          .select()

        if (error) {
          console.error('Batch insert error:', error)
          result.failed += batch.length
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        } else if (data) {
          result.created.push(...(data as Lead[]))
        }
      }
    }

    return result
  },

  /**
   * Bulk update lead statuses
   */
  async bulkUpdateStatus(
    leadIds: string[],
    status: Lead['status']
  ): Promise<{ updated: number; failed: number }> {
    if (leadIds.length === 0) return { updated: 0, failed: 0 }

    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', leadIds)
      .select('id')

    if (error) {
      console.error('Bulk status update error:', error)
      return { updated: 0, failed: leadIds.length }
    }

    return { 
      updated: data?.length || 0, 
      failed: leadIds.length - (data?.length || 0) 
    }
  },

  /**
   * Bulk delete leads
   */
  async bulkDelete(leadIds: string[]): Promise<{ deleted: number; failed: number }> {
    if (leadIds.length === 0) return { deleted: 0, failed: 0 }

    const { error, count } = await supabase
      .from('leads')
      .delete()
      .in('id', leadIds)

    if (error) {
      console.error('Bulk delete error:', error)
      return { deleted: 0, failed: leadIds.length }
    }

    return { 
      deleted: count || leadIds.length, 
      failed: 0 
    }
  },
}
