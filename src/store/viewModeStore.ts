import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StormPath, PropertyMarker } from '../components/map/StormMap'

// Cache entry with timestamp for TTL
interface PropertyCacheEntry {
  properties: PropertyMarker[]
  fetchedAt: number
  stormPathId: string
}

// View mode state and actions
interface ViewModeState {
  // View mode: 'storms' for storm discovery, 'leads' for property selection
  mode: 'storms' | 'leads'
  
  // Selected storm path in lead mode
  selectedStormPath: StormPath | null
  
  // Multi-selected properties for bulk actions
  selectedProperties: PropertyMarker[]
  
  // All loaded properties for the selected storm path
  loadedProperties: PropertyMarker[]
  
  // Property cache: stormPathId -> cached properties
  propertyCache: Map<string, PropertyCacheEntry>
  
  // Loading state
  isLoadingProperties: boolean
  
  // ===== Actions =====
  
  // Enter lead generation mode with a storm path
  enterLeadMode: (stormPath: StormPath) => void
  
  // Exit back to storm discovery mode
  exitLeadMode: () => void
  
  // Set loaded properties (from ArcGIS query)
  setLoadedProperties: (properties: PropertyMarker[]) => void
  
  // Toggle a single property selection
  togglePropertySelection: (property: PropertyMarker) => void
  
  // Select multiple properties (for rectangle selection)
  selectProperties: (properties: PropertyMarker[]) => void
  
  // Add properties to current selection (Ctrl+click behavior)
  addToSelection: (properties: PropertyMarker[]) => void
  
  // Remove properties from selection
  removeFromSelection: (propertyIds: string[]) => void
  
  // Select all loaded properties
  selectAllProperties: () => void
  
  // Clear all property selections
  clearPropertySelection: () => void
  
  // Cache properties for a storm path
  cacheProperties: (stormPathId: string, properties: PropertyMarker[]) => void
  
  // Get cached properties (returns null if expired or not found)
  getCachedProperties: (stormPathId: string) => PropertyMarker[] | null
  
  // Check if property is selected
  isPropertySelected: (propertyId: string) => boolean
  
  // Mark properties as leads (update isLead flag)
  markPropertiesAsLeads: (propertyIds: string[]) => void
  
  // Set loading state
  setLoadingProperties: (loading: boolean) => void
  
  // Clear the property cache
  clearCache: () => void
}

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'storms',
      selectedStormPath: null,
      selectedProperties: [],
      loadedProperties: [],
      propertyCache: new Map(),
      isLoadingProperties: false,
      
      // Enter lead generation mode
      enterLeadMode: (stormPath: StormPath) => {
        set({
          mode: 'leads',
          selectedStormPath: stormPath,
          selectedProperties: [],
          loadedProperties: [],
        })
      },
      
      // Exit lead mode
      exitLeadMode: () => {
        set({
          mode: 'storms',
          selectedStormPath: null,
          selectedProperties: [],
          loadedProperties: [],
        })
      },
      
      // Set loaded properties
      setLoadedProperties: (properties: PropertyMarker[]) => {
        set({ loadedProperties: properties })
      },
      
      // Toggle single property selection
      togglePropertySelection: (property: PropertyMarker) => {
        const { selectedProperties } = get()
        const isSelected = selectedProperties.some(p => p.id === property.id)
        
        if (isSelected) {
          set({
            selectedProperties: selectedProperties.filter(p => p.id !== property.id)
          })
        } else {
          set({
            selectedProperties: [...selectedProperties, property]
          })
        }
      },
      
      // Select specific properties (replaces current selection)
      selectProperties: (properties: PropertyMarker[]) => {
        set({ selectedProperties: properties })
      },
      
      // Add to current selection (for Ctrl+click)
      addToSelection: (properties: PropertyMarker[]) => {
        const { selectedProperties } = get()
        const existingIds = new Set(selectedProperties.map(p => p.id))
        const newProperties = properties.filter(p => !existingIds.has(p.id))
        set({
          selectedProperties: [...selectedProperties, ...newProperties]
        })
      },
      
      // Remove from selection
      removeFromSelection: (propertyIds: string[]) => {
        const { selectedProperties } = get()
        const idsToRemove = new Set(propertyIds)
        set({
          selectedProperties: selectedProperties.filter(p => !idsToRemove.has(p.id))
        })
      },
      
      // Select all loaded properties
      selectAllProperties: () => {
        const { loadedProperties } = get()
        set({ selectedProperties: [...loadedProperties] })
      },
      
      // Clear property selection
      clearPropertySelection: () => {
        set({ selectedProperties: [] })
      },
      
      // Cache properties for a storm path
      cacheProperties: (stormPathId: string, properties: PropertyMarker[]) => {
        const { propertyCache } = get()
        const newCache = new Map(propertyCache)
        newCache.set(stormPathId, {
          properties,
          fetchedAt: Date.now(),
          stormPathId,
        })
        set({ propertyCache: newCache })
      },
      
      // Get cached properties (null if expired or not found)
      getCachedProperties: (stormPathId: string) => {
        const { propertyCache } = get()
        const cached = propertyCache.get(stormPathId)
        
        if (!cached) return null
        
        // Check if cache is expired
        const age = Date.now() - cached.fetchedAt
        if (age > CACHE_TTL) {
          // Remove expired entry
          const newCache = new Map(propertyCache)
          newCache.delete(stormPathId)
          set({ propertyCache: newCache })
          return null
        }
        
        return cached.properties
      },
      
      // Check if property is selected
      isPropertySelected: (propertyId: string) => {
        const { selectedProperties } = get()
        return selectedProperties.some(p => p.id === propertyId)
      },
      
      // Mark properties as leads
      markPropertiesAsLeads: (propertyIds: string[]) => {
        const { loadedProperties, selectedProperties, propertyCache, selectedStormPath } = get()
        const idsSet = new Set(propertyIds)
        
        // Update loaded properties
        const updatedLoaded = loadedProperties.map(p => 
          idsSet.has(p.id) ? { ...p, isLead: true } : p
        )
        
        // Update selected properties
        const updatedSelected = selectedProperties.map(p =>
          idsSet.has(p.id) ? { ...p, isLead: true } : p
        )
        
        // Update cache
        if (selectedStormPath) {
          const newCache = new Map(propertyCache)
          const cached = newCache.get(selectedStormPath.id)
          if (cached) {
            newCache.set(selectedStormPath.id, {
              ...cached,
              properties: cached.properties.map(p =>
                idsSet.has(p.id) ? { ...p, isLead: true } : p
              )
            })
          }
          set({
            loadedProperties: updatedLoaded,
            selectedProperties: updatedSelected,
            propertyCache: newCache,
          })
        } else {
          set({
            loadedProperties: updatedLoaded,
            selectedProperties: updatedSelected,
          })
        }
      },
      
      // Set loading state
      setLoadingProperties: (loading: boolean) => {
        set({ isLoadingProperties: loading })
      },
      
      // Clear cache
      clearCache: () => {
        set({ propertyCache: new Map() })
      },
    }),
    {
      name: 'hailstorm-viewmode',
      // Only persist cache, not UI state
      partialize: (state) => ({
        propertyCache: state.propertyCache,
      }),
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const data = JSON.parse(str)
          // Deserialize Map
          if (data.state?.propertyCache) {
            data.state.propertyCache = new Map(Object.entries(data.state.propertyCache))
          }
          return data
        },
        setItem: (name, value) => {
          // Serialize Map to object
          const toStore = {
            ...value,
            state: {
              ...value.state,
              propertyCache: value.state?.propertyCache 
                ? Object.fromEntries(value.state.propertyCache)
                : {}
            }
          }
          localStorage.setItem(name, JSON.stringify(toStore))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)

// Selectors for common derived state
export const useViewMode = () => useViewModeStore(state => state.mode)
export const useSelectedStormPath = () => useViewModeStore(state => state.selectedStormPath)
export const useSelectedProperties = () => useViewModeStore(state => state.selectedProperties)
export const useSelectedPropertyCount = () => useViewModeStore(state => state.selectedProperties.length)
export const useLoadedProperties = () => useViewModeStore(state => state.loadedProperties)
export const useIsInLeadMode = () => useViewModeStore(state => state.mode === 'leads')
