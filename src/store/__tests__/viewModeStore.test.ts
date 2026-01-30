import { describe, it, expect, beforeEach } from 'vitest'
import { useViewModeStore } from '../viewModeStore'
import type { StormPath, PropertyMarker } from '../../components/map/StormMap'

// Test fixtures
const mockStormPath: StormPath = {
  id: 'path-1',
  event_id: 'evt-1',
  state: 'TX',
  county: 'Dallas',
  magnitude: 2.0,
  severity: 'severe',
  geometry: { type: 'Point', coordinates: [-96.8, 32.78] },
}

const mockProperties: PropertyMarker[] = [
  { id: 'prop-1', address: '100 Main St', latitude: 32.78, longitude: -96.8 },
  { id: 'prop-2', address: '200 Oak Ave', latitude: 32.79, longitude: -96.81 },
  { id: 'prop-3', address: '300 Elm Blvd', latitude: 32.80, longitude: -96.82 },
]

describe('useViewModeStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useViewModeStore.setState({
      mode: 'storms',
      selectedStormPath: null,
      selectedProperties: [],
      loadedProperties: [],
      propertyCache: new Map(),
      isLoadingProperties: false,
    })
  })

  // ─── Initial state ──────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts in storms mode', () => {
      expect(useViewModeStore.getState().mode).toBe('storms')
    })

    it('has no selected storm path', () => {
      expect(useViewModeStore.getState().selectedStormPath).toBeNull()
    })

    it('has empty selected properties', () => {
      expect(useViewModeStore.getState().selectedProperties).toEqual([])
    })

    it('has empty loaded properties', () => {
      expect(useViewModeStore.getState().loadedProperties).toEqual([])
    })

    it('is not loading properties', () => {
      expect(useViewModeStore.getState().isLoadingProperties).toBe(false)
    })
  })

  // ─── enterLeadMode ─────────────────────────────────────────────────────

  describe('enterLeadMode', () => {
    it('sets mode to leads', () => {
      useViewModeStore.getState().enterLeadMode(mockStormPath)
      expect(useViewModeStore.getState().mode).toBe('leads')
    })

    it('sets the selected storm path', () => {
      useViewModeStore.getState().enterLeadMode(mockStormPath)
      expect(useViewModeStore.getState().selectedStormPath).toEqual(mockStormPath)
    })

    it('clears any previously selected properties', () => {
      useViewModeStore.setState({ selectedProperties: [mockProperties[0]] })
      useViewModeStore.getState().enterLeadMode(mockStormPath)
      expect(useViewModeStore.getState().selectedProperties).toEqual([])
    })

    it('clears loaded properties', () => {
      useViewModeStore.setState({ loadedProperties: mockProperties })
      useViewModeStore.getState().enterLeadMode(mockStormPath)
      expect(useViewModeStore.getState().loadedProperties).toEqual([])
    })
  })

  // ─── exitLeadMode ──────────────────────────────────────────────────────

  describe('exitLeadMode', () => {
    it('resets mode to storms', () => {
      useViewModeStore.getState().enterLeadMode(mockStormPath)
      useViewModeStore.getState().exitLeadMode()
      expect(useViewModeStore.getState().mode).toBe('storms')
    })

    it('clears the selected storm path', () => {
      useViewModeStore.getState().enterLeadMode(mockStormPath)
      useViewModeStore.getState().exitLeadMode()
      expect(useViewModeStore.getState().selectedStormPath).toBeNull()
    })

    it('clears selected properties', () => {
      useViewModeStore.setState({ selectedProperties: mockProperties })
      useViewModeStore.getState().exitLeadMode()
      expect(useViewModeStore.getState().selectedProperties).toEqual([])
    })

    it('clears loaded properties', () => {
      useViewModeStore.setState({ loadedProperties: mockProperties })
      useViewModeStore.getState().exitLeadMode()
      expect(useViewModeStore.getState().loadedProperties).toEqual([])
    })
  })

  // ─── togglePropertySelection ──────────────────────────────────────────

  describe('togglePropertySelection', () => {
    it('adds a property when not already selected', () => {
      useViewModeStore.getState().togglePropertySelection(mockProperties[0])
      expect(useViewModeStore.getState().selectedProperties).toHaveLength(1)
      expect(useViewModeStore.getState().selectedProperties[0].id).toBe('prop-1')
    })

    it('removes a property when already selected', () => {
      useViewModeStore.setState({ selectedProperties: [mockProperties[0]] })
      useViewModeStore.getState().togglePropertySelection(mockProperties[0])
      expect(useViewModeStore.getState().selectedProperties).toHaveLength(0)
    })

    it('only removes the toggled property, keeping others', () => {
      useViewModeStore.setState({ selectedProperties: [mockProperties[0], mockProperties[1]] })
      useViewModeStore.getState().togglePropertySelection(mockProperties[0])
      expect(useViewModeStore.getState().selectedProperties).toHaveLength(1)
      expect(useViewModeStore.getState().selectedProperties[0].id).toBe('prop-2')
    })
  })

  // ─── selectAllProperties ──────────────────────────────────────────────

  describe('selectAllProperties', () => {
    it('selects all loaded properties', () => {
      useViewModeStore.setState({ loadedProperties: mockProperties })
      useViewModeStore.getState().selectAllProperties()
      expect(useViewModeStore.getState().selectedProperties).toHaveLength(3)
    })

    it('replaces any existing selection', () => {
      useViewModeStore.setState({
        loadedProperties: mockProperties,
        selectedProperties: [mockProperties[0]],
      })
      useViewModeStore.getState().selectAllProperties()
      expect(useViewModeStore.getState().selectedProperties).toHaveLength(3)
    })

    it('results in empty selection when no properties are loaded', () => {
      useViewModeStore.getState().selectAllProperties()
      expect(useViewModeStore.getState().selectedProperties).toEqual([])
    })
  })

  // ─── clearPropertySelection ───────────────────────────────────────────

  describe('clearPropertySelection', () => {
    it('clears all selected properties', () => {
      useViewModeStore.setState({ selectedProperties: mockProperties })
      useViewModeStore.getState().clearPropertySelection()
      expect(useViewModeStore.getState().selectedProperties).toEqual([])
    })

    it('is safe to call when already empty', () => {
      useViewModeStore.getState().clearPropertySelection()
      expect(useViewModeStore.getState().selectedProperties).toEqual([])
    })
  })

  // ─── markPropertiesAsLeads ────────────────────────────────────────────

  describe('markPropertiesAsLeads', () => {
    it('sets isLead to true on loaded properties matching the given ids', () => {
      useViewModeStore.setState({ loadedProperties: mockProperties })
      useViewModeStore.getState().markPropertiesAsLeads(['prop-1', 'prop-3'])

      const loaded = useViewModeStore.getState().loadedProperties
      expect(loaded.find(p => p.id === 'prop-1')?.isLead).toBe(true)
      expect(loaded.find(p => p.id === 'prop-2')?.isLead).toBeUndefined()
      expect(loaded.find(p => p.id === 'prop-3')?.isLead).toBe(true)
    })

    it('updates isLead on selected properties too', () => {
      useViewModeStore.setState({
        loadedProperties: mockProperties,
        selectedProperties: [mockProperties[0], mockProperties[1]],
      })
      useViewModeStore.getState().markPropertiesAsLeads(['prop-1'])

      const selected = useViewModeStore.getState().selectedProperties
      expect(selected.find(p => p.id === 'prop-1')?.isLead).toBe(true)
      expect(selected.find(p => p.id === 'prop-2')?.isLead).toBeUndefined()
    })

    it('does nothing when empty ids array is passed', () => {
      useViewModeStore.setState({ loadedProperties: mockProperties })
      useViewModeStore.getState().markPropertiesAsLeads([])
      const loaded = useViewModeStore.getState().loadedProperties
      loaded.forEach(p => {
        expect(p.isLead).toBeUndefined()
      })
    })

    it('updates cache when a storm path is selected', () => {
      // Set up cached properties
      const cache = new Map()
      cache.set('path-1', {
        stormPathId: 'path-1',
        properties: [...mockProperties],
        fetchedAt: Date.now(),
      })
      useViewModeStore.setState({
        loadedProperties: mockProperties,
        selectedStormPath: mockStormPath,
        propertyCache: cache,
      })

      useViewModeStore.getState().markPropertiesAsLeads(['prop-2'])

      const updatedCache = useViewModeStore.getState().propertyCache
      const cachedProps = updatedCache.get('path-1')?.properties
      expect(cachedProps?.find(p => p.id === 'prop-2')?.isLead).toBe(true)
    })
  })

  // ─── isPropertySelected ──────────────────────────────────────────────

  describe('isPropertySelected', () => {
    it('returns true for a selected property', () => {
      useViewModeStore.setState({ selectedProperties: [mockProperties[0]] })
      expect(useViewModeStore.getState().isPropertySelected('prop-1')).toBe(true)
    })

    it('returns false for an unselected property', () => {
      useViewModeStore.setState({ selectedProperties: [mockProperties[0]] })
      expect(useViewModeStore.getState().isPropertySelected('prop-2')).toBe(false)
    })
  })

  // ─── setLoadingProperties ─────────────────────────────────────────────

  describe('setLoadingProperties', () => {
    it('sets loading state to true', () => {
      useViewModeStore.getState().setLoadingProperties(true)
      expect(useViewModeStore.getState().isLoadingProperties).toBe(true)
    })

    it('sets loading state to false', () => {
      useViewModeStore.setState({ isLoadingProperties: true })
      useViewModeStore.getState().setLoadingProperties(false)
      expect(useViewModeStore.getState().isLoadingProperties).toBe(false)
    })
  })
})
