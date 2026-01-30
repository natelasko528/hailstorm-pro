# HailStorm Pro - API Reference

This document provides a comprehensive reference for all services, hooks, and utilities available in HailStorm Pro.

## Table of Contents

1. [Services](#services)
   - [leadService](#leadservice)
   - [stormService](#stormservice)
   - [profileService](#profileservice)
   - [arcgisService](#arcgisservice)
   - [skipTraceService](#skiptraceservice)
2. [Hooks](#hooks)
   - [useLeadQuery](#useleadquery)
   - [useStormQuery](#usestormquery)
   - [useProfileQuery](#useprofilequery)
   - [useAffectedProperties](#useaffectedproperties)
3. [Stores](#stores)
   - [authStore](#authstore)
   - [viewModeStore](#viewmodestore)
   - [sidebarStore](#sidebarstore)
4. [Utilities](#utilities)
   - [utils.ts](#utilsts)
   - [errorMonitoring.ts](#errormonitoringts)

---

## Services

### leadService

Located at `src/lib/leadService.ts`

Manages lead CRUD operations and lead-related queries.

#### Methods

##### `getLeads(filters?)`
Fetch all leads with optional filtering.

```typescript
const leads = await leadService.getLeads({
  status?: 'new' | 'contacted' | 'qualified' | 'appointment' | 'won' | 'lost',
  minScore?: number,
  state?: string,
  stormId?: string,
  limit?: number
})
```

##### `getLeadsPaginated(filters?)`
Fetch leads with pagination support.

```typescript
const result = await leadService.getLeadsPaginated({
  page?: number,
  pageSize?: number,
  status?: string,
  minScore?: number,
  sortBy?: 'lead_score' | 'created_at' | 'property_value',
  sortOrder?: 'asc' | 'desc'
})
// Returns: { leads, total, page, pageSize, totalPages }
```

##### `createLeadFromProperty(data)`
Create a lead from ArcGIS property data with optional skip trace results.

```typescript
const lead = await leadService.createLeadFromProperty({
  property: ArcGISParcel | PropertyData,
  stormPathId?: string,
  stormEventId?: string,
  skipTraceResult?: SkipTraceResult
})
```

##### `bulkUpdateStatus(leadIds, status)`
Update multiple leads' status at once.

```typescript
const result = await leadService.bulkUpdateStatus(
  ['lead-id-1', 'lead-id-2'],
  'contacted'
)
// Returns: { updated: number, failed: number }
```

##### `bulkDelete(leadIds)`
Delete multiple leads at once.

```typescript
const result = await leadService.bulkDelete(['lead-id-1', 'lead-id-2'])
// Returns: { deleted: number, failed: number }
```

##### `searchLeads(searchTerm)`
Search leads by owner name, address, or city. Uses sanitized input to prevent SQL injection.

```typescript
const leads = await leadService.searchLeads('Milwaukee')
```

---

### stormService

Located at `src/lib/stormService.ts`

Manages storm event and storm path data from NOAA and imported shapefiles.

#### Methods

##### `getStorms(filters?)`
Fetch storm events with filtering.

```typescript
const storms = await stormService.getStorms({
  state?: string,
  severity?: 'light' | 'moderate' | 'severe' | 'extreme',
  startDate?: string,
  endDate?: string,
  limit?: number
})
```

##### `getStormPaths(filters?)`
Fetch storm path polygons.

```typescript
const paths = await stormService.getStormPaths({
  state?: string,
  severity?: string,
  startDate?: string,
  endDate?: string,
  year?: number,
  limit?: number
})
```

##### `searchStorms(searchTerm)`
Search storms by location, state, or county.

```typescript
const storms = await stormService.searchStorms('MILWAUKEE')
```

---

### profileService

Located at `src/lib/profileService.ts`

Manages user profile and preferences.

#### Methods

##### `getProfile()`
Get the current user's profile.

```typescript
const profile = await profileService.getProfile()
```

##### `updateProfile(updates)`
Update profile information.

```typescript
await profileService.updateProfile({
  full_name?: string,
  company_name?: string,
  phone?: string,
  business_address?: string,
  avatar_url?: string
})
```

##### `getTargetState()`
Get the user's configured target state for storm filtering.

```typescript
const state = await profileService.getTargetState() // e.g., 'WI'
```

##### `updateTargetState(state)`
Update the target state preference.

```typescript
await profileService.updateTargetState('MN')
```

##### `uploadAvatar(file)`
Upload a new avatar image.

```typescript
const url = await profileService.uploadAvatar(file)
```

##### `updatePassword(currentPassword, newPassword)`
Change the user's password.

```typescript
await profileService.updatePassword('oldpass', 'newpass')
```

#### Constants

```typescript
export const AVAILABLE_STATES = [
  { code: 'WI', name: 'Wisconsin' },
  { code: 'MN', name: 'Minnesota' },
  // ... more states
]

export const DEFAULT_TARGET_STATE = 'WI'
```

---

### arcgisService

Located at `src/lib/arcgisService.ts`

Interfaces with Wisconsin's ArcGIS parcel data service.

#### Methods

##### `queryParcels(options?)`
Query parcels with various filters.

```typescript
const result = await arcgisService.queryParcels({
  geometry?: GeoJSON.Geometry,
  bbox?: [number, number, number, number],
  county?: string,
  propertyClass?: string,
  minValue?: number,
  maxValue?: number,
  limit?: number,
  offset?: number,
  returnGeometry?: boolean
})
```

##### `findParcelsInStormPath(geometry, options?)`
Find parcels within a storm path polygon.

```typescript
const parcels = await arcgisService.findParcelsInStormPath(
  stormGeometry,
  { limit: 500, propertyClass: 'Residential' }
)
```

##### `searchParcelsByAddress(addressQuery, options?)`
Search parcels by address (uses sanitized input).

```typescript
const parcels = await arcgisService.searchParcelsByAddress(
  '123 MAIN ST',
  { limit: 50, county: 'MILWAUKEE' }
)
```

---

### skipTraceService

Located at `src/lib/skipTraceService.ts`

Interfaces with BatchData API for skip tracing property owners.

#### Methods

##### `skipTrace(data)`
Perform a skip trace lookup.

```typescript
const result = await skipTraceService.skipTrace({
  firstName: string,
  lastName?: string,
  address: string,
  city: string,
  state: string,
  zip?: string
})
// Returns: { success, phones, emails, error? }
```

##### `isConfigured()`
Check if skip trace API is configured.

```typescript
if (skipTraceService.isConfigured()) {
  // API key is set
}
```

---

## Hooks

### useLeadQuery

TanStack Query hook for lead data.

```typescript
const { data: leads, isLoading, error } = useLeadQuery(filters)
```

### useStormQuery

TanStack Query hook for storm data.

```typescript
const { data: storms, isLoading, error } = useStormQuery(filters)
```

### useProfileQuery

TanStack Query hook for user profile.

```typescript
const { data: profile, isLoading } = useProfileQuery()
```

### useAffectedProperties

Custom hook for loading properties affected by a storm path.

```typescript
const { properties, loading, error, refresh } = useAffectedProperties(stormPath)
```

---

## Stores

### authStore

Zustand store for authentication state.

```typescript
const { user, signIn, signUp, signInWithGoogle, signOut, initialize } = useAuthStore()

// Sign in
await signIn(email, password)

// Sign up
await signUp(email, password)

// Google OAuth
await signInWithGoogle()

// Sign out
await signOut()
```

### viewModeStore

Zustand store for storm/lead view mode state.

```typescript
const {
  mode,                    // 'storms' | 'leads'
  selectedStormPath,
  selectedProperties,
  loadedProperties,
  isLoadingProperties,
  enterLeadMode,
  exitLeadMode,
  togglePropertySelection,
  selectAllProperties,
  clearPropertySelection,
  markPropertiesAsLeads
} = useViewModeStore()
```

### sidebarStore

Zustand store for sidebar collapse state.

```typescript
const { collapsed, toggle } = useSidebarStore()
```

---

## Utilities

### utils.ts

Located at `src/lib/utils.ts`

#### Functions

##### `cn(...inputs)`
Merge Tailwind CSS classes.

```typescript
const className = cn('base-class', condition && 'conditional-class')
```

##### `useDebounce(value, delay)`
React hook for debounced values.

```typescript
const debouncedSearch = useDebounce(searchQuery, 300)
```

##### `useDebouncedCallback(callback, delay)`
React hook for debounced callbacks.

```typescript
const debouncedHandler = useDebouncedCallback((value) => {
  // Called 300ms after last invocation
}, 300)
```

##### `formatCurrency(amount)`
Format a number as USD currency.

```typescript
formatCurrency(150000) // '$150,000'
```

##### `formatDate(date)`
Format a date for display.

```typescript
formatDate('2024-07-15') // 'Jul 15, 2024'
```

##### `formatNumber(num)`
Format large numbers with K/M suffixes.

```typescript
formatNumber(1500) // '1.5K'
formatNumber(1500000) // '1.5M'
```

##### `getDateRangeFromDays(days)`
Get ISO date strings for a range of days.

```typescript
const { start, end } = getDateRangeFromDays(30)
```

---

### errorMonitoring.ts

Located at `src/lib/errorMonitoring.ts`

Centralized error handling with optional Sentry integration.

#### Functions

##### `captureError(error, severity?, context?)`
Capture and report an error.

```typescript
captureError(new Error('Something failed'), 'error', {
  component: 'LeadsPage',
  action: 'loadLeads',
  userId: user.id
})
```

##### `captureMessage(message, severity?, context?)`
Log a message without an error object.

```typescript
captureMessage('User signed out', 'info', { userId: user.id })
```

##### `setUserContext(user)`
Set user context for error reports (call after login).

```typescript
setUserContext({ id: user.id, email: user.email })
```

##### `clearUserContext()`
Clear user context (call after logout).

```typescript
clearUserContext()
```

##### `withErrorCapture(fn, context?)`
Wrap an async function with error capturing.

```typescript
const data = await withErrorCapture(
  () => api.fetchData(),
  { component: 'Dashboard' }
)
```

##### `createErrorHandler(componentName)`
Create an error handler for React error boundaries.

```typescript
const handleError = createErrorHandler('MyComponent')
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_MAPBOX_TOKEN` | No | Mapbox access token (optional) |
| `VITE_BATCHDATA_API_KEY` | No | BatchData API key for skip tracing |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error monitoring |
