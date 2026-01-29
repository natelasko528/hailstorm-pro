import { supabase } from './supabaseClient'

export interface Lead {
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
  status: 'new' | 'contacted' | 'qualified' | 'appointment' | 'won' | 'lost'
  damage_severity: 'minor' | 'moderate' | 'severe' | null
  roof_age: number | null
  property_value: number | null
  notes: string | null
  created_at: string
  updated_at: string
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
   */
  async searchLeads(searchTerm: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`owner_name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
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
}
