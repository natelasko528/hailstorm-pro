import { useQuery } from '@tanstack/react-query'
import { stormService } from '../lib/stormService'

// Storm event query keys
export const stormKeys = {
  all: ['storms'] as const,
  lists: () => [...stormKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...stormKeys.lists(), filters] as const,
  details: () => [...stormKeys.all, 'detail'] as const,
  detail: (id: string) => [...stormKeys.details(), id] as const,
  bounds: (bounds: Record<string, number>) => [...stormKeys.all, 'bounds', bounds] as const,
  search: (term: string) => [...stormKeys.all, 'search', term] as const,
  stats: () => [...stormKeys.all, 'stats'] as const,
}

// Storm path query keys
export const stormPathKeys = {
  all: ['stormPaths'] as const,
  lists: () => [...stormPathKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...stormPathKeys.lists(), filters] as const,
  details: () => [...stormPathKeys.all, 'detail'] as const,
  detail: (id: string) => [...stormPathKeys.details(), id] as const,
  stats: () => [...stormPathKeys.all, 'stats'] as const,
}

// Fetch storms with optional filters
export function useStorms(filters?: {
  state?: string
  severity?: string
  startDate?: string
  endDate?: string
  limit?: number
}) {
  return useQuery({
    queryKey: stormKeys.list(filters || {}),
    queryFn: () => stormService.getStorms(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - storm data doesn't change often
  })
}

// Fetch single storm
export function useStorm(id: string) {
  return useQuery({
    queryKey: stormKeys.detail(id),
    queryFn: () => stormService.getStorm(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Fetch storms within bounds
export function useStormsInBounds(bounds: {
  north: number
  south: number
  east: number
  west: number
} | null) {
  return useQuery({
    queryKey: stormKeys.bounds(bounds || {}),
    queryFn: () => stormService.getStormsInBounds(bounds!),
    enabled: !!bounds,
    staleTime: 5 * 60 * 1000,
  })
}

// Search storms
export function useStormSearch(searchTerm: string) {
  return useQuery({
    queryKey: stormKeys.search(searchTerm),
    queryFn: () => stormService.searchStorms(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

// Fetch storm stats
export function useStormStats() {
  return useQuery({
    queryKey: stormKeys.stats(),
    queryFn: () => stormService.getStats(),
    staleTime: 10 * 60 * 1000,
  })
}

// ===== Storm Path Hooks =====

export interface StormPathFilters {
  state?: string
  severity?: string
  year?: number
  startDate?: string
  endDate?: string
  limit?: number
}

// Fetch storm paths with optional filters
export function useStormPaths(filters?: StormPathFilters) {
  return useQuery({
    queryKey: stormPathKeys.list((filters || {}) as Record<string, unknown>),
    queryFn: () => stormService.getStormPaths(filters),
    staleTime: 60 * 60 * 1000, // 1 hour - path data is static
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

// Fetch single storm path
export function useStormPath(id: string | undefined) {
  return useQuery({
    queryKey: stormPathKeys.detail(id || ''),
    queryFn: () => stormService.getStormPath(id!),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

// Fetch storm path stats
export function useStormPathStats() {
  return useQuery({
    queryKey: stormPathKeys.stats(),
    queryFn: () => stormService.getStormPathsStats(),
    staleTime: 60 * 60 * 1000,
  })
}
