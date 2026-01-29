import { supabase } from './supabaseClient'
import type { Storm } from '../types/storm'

export const stormService = {
  /**
   * Fetch all storms with optional filtering
   */
  async getStorms(filters?: {
    state?: string
    severity?: string
    startDate?: string
    endDate?: string
    limit?: number
  }) {
    let query = supabase
      .from('storms')
      .select('*')
      .order('date', { ascending: false })

    if (filters?.state) {
      query = query.eq('state', filters.state)
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching storms:', error)
      throw error
    }

    return data as unknown as Storm[]
  },

  /**
   * Fetch a single storm by ID
   */
  async getStorm(id: string) {
    const { data, error } = await supabase
      .from('storms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching storm:', error)
      throw error
    }

    return data as unknown as Storm
  },

  /**
   * Get storms within a geographic bounding box
   */
  async getStormsInBounds(bounds: {
    north: number
    south: number
    east: number
    west: number
  }) {
    const { data, error } = await supabase
      .from('storms')
      .select('*')
      .gte('latitude', bounds.south)
      .lte('latitude', bounds.north)
      .gte('longitude', bounds.west)
      .lte('longitude', bounds.east)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching storms in bounds:', error)
      throw error
    }

    return data as unknown as Storm[]
  },

  /**
   * Search storms by text
   */
  async searchStorms(searchTerm: string) {
    const { data, error } = await supabase
      .from('storms')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,county.ilike.%${searchTerm}%`)
      .order('date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error searching storms:', error)
      throw error
    }

    return data as unknown as Storm[]
  },

  /**
   * Get storm statistics
   */
  async getStats() {
    const { count: totalStorms } = await supabase
      .from('storms')
      .select('*', { count: 'exact', head: true })

    const { data: recentStorms } = await supabase
      .from('storms')
      .select('*')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { data: severeStorms } = await supabase
      .from('storms')
      .select('*')
      .in('severity', ['severe', 'extreme'])

    return {
      total: totalStorms || 0,
      recent: recentStorms?.length || 0,
      severe: severeStorms?.length || 0,
    }
  },
}
