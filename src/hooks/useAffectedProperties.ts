import { useQuery, useQueryClient } from '@tanstack/react-query'
import { arcgisService, ArcGISParcel } from '../lib/arcgisService'
import type { StormPath, PropertyMarker } from '../components/map/StormMap'

// Query keys for affected properties
export const affectedPropertyKeys = {
  all: ['affectedProperties'] as const,
  byStormPath: (stormPathId: string) => [...affectedPropertyKeys.all, 'stormPath', stormPathId] as const,
  byGeometry: (geometryHash: string) => [...affectedPropertyKeys.all, 'geometry', geometryHash] as const,
}

// Options for the affected properties query
export interface AffectedPropertiesOptions {
  propertyClass?: string
  limit?: number
  minValue?: number
  maxValue?: number
}

// Convert ArcGIS parcel to PropertyMarker
function toPropertyMarker(parcel: ArcGISParcel): PropertyMarker {
  return {
    id: parcel.stateId || parcel.id,
    address: parcel.address || 'Unknown address',
    ownerName: parcel.ownerName,
    latitude: parcel.latitude,
    longitude: parcel.longitude,
    estimatedValue: parcel.estimatedValue,
    parcelGeometry: parcel.geometry,
    isLead: false
  }
}

// Simple hash for geometry (for cache key)
function hashGeometry(geometry: GeoJSON.Geometry): string {
  return JSON.stringify(geometry).slice(0, 100) + JSON.stringify(geometry).length
}

/**
 * Hook to fetch properties affected by a storm path
 * Uses React Query for caching with 24-hour stale time
 */
export function useAffectedProperties(
  stormPath: StormPath | null,
  options: AffectedPropertiesOptions = {}
) {
  return useQuery({
    queryKey: stormPath 
      ? affectedPropertyKeys.byStormPath(stormPath.id)
      : ['affectedProperties', 'none'],
    queryFn: async (): Promise<PropertyMarker[]> => {
      if (!stormPath?.geometry) {
        return []
      }

      const parcels = await arcgisService.findParcelsInStormPath(stormPath.geometry, {
        limit: options.limit ?? 500,
        propertyClass: options.propertyClass ?? 'Residential',
        minValue: options.minValue,
        maxValue: options.maxValue,
      })

      return parcels.map(toPropertyMarker)
    },
    enabled: !!stormPath?.geometry,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - property data doesn't change often
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - keep in garbage collection for a week
    refetchOnWindowFocus: false, // Don't refetch on window focus for property data
    retry: 2,
  })
}

/**
 * Hook to prefetch properties for a storm path (for hover optimization)
 */
export function usePrefetchAffectedProperties() {
  const queryClient = useQueryClient()

  const prefetch = async (stormPath: StormPath, options: AffectedPropertiesOptions = {}) => {
    if (!stormPath?.geometry) return

    // Check if already cached
    const cached = queryClient.getQueryData(affectedPropertyKeys.byStormPath(stormPath.id))
    if (cached) return

    // Prefetch
    await queryClient.prefetchQuery({
      queryKey: affectedPropertyKeys.byStormPath(stormPath.id),
      queryFn: async () => {
        const parcels = await arcgisService.findParcelsInStormPath(stormPath.geometry, {
          limit: options.limit ?? 500,
          propertyClass: options.propertyClass ?? 'Residential',
        })
        return parcels.map(toPropertyMarker)
      },
      staleTime: 24 * 60 * 60 * 1000,
    })
  }

  return { prefetch }
}

/**
 * Hook to count properties in a storm path (for quick preview)
 */
export function usePropertyCount(geometry: GeoJSON.Geometry | null) {
  return useQuery({
    queryKey: geometry 
      ? ['propertyCount', hashGeometry(geometry)]
      : ['propertyCount', 'none'],
    queryFn: async () => {
      if (!geometry) return 0
      return arcgisService.countParcelsInGeometry(geometry)
    },
    enabled: !!geometry,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

/**
 * Hook to mark properties as leads in the cache
 * This updates the cached data without refetching
 */
export function useMarkPropertiesAsLeads() {
  const queryClient = useQueryClient()

  const markAsLeads = (stormPathId: string, propertyIds: string[]) => {
    const queryKey = affectedPropertyKeys.byStormPath(stormPathId)
    const idsSet = new Set(propertyIds)

    queryClient.setQueryData<PropertyMarker[]>(queryKey, (oldData) => {
      if (!oldData) return oldData
      return oldData.map(property => 
        idsSet.has(property.id) 
          ? { ...property, isLead: true }
          : property
      )
    })
  }

  return { markAsLeads }
}

/**
 * Hook to invalidate affected properties cache
 */
export function useInvalidateAffectedProperties() {
  const queryClient = useQueryClient()

  const invalidate = (stormPathId?: string) => {
    if (stormPathId) {
      queryClient.invalidateQueries({
        queryKey: affectedPropertyKeys.byStormPath(stormPathId)
      })
    } else {
      queryClient.invalidateQueries({
        queryKey: affectedPropertyKeys.all
      })
    }
  }

  return { invalidate }
}
