# Storm Paths Fix and Production-Ready Plan (Full TODO + Implementation)

## Overview

Fix storm path rendering; ensure storm paths use **polygonal or multi-point geometry** for geocoding and overlap (properties overlapping storm path → potential leads); **implement the properties table** and **implement/update the leads table** so leads are connected to property, storm, and storm_path. This document is the single source of truth for the TODO list and implementation details.

---

## TODO List (Checkable – Implement in This Order)

### Phase A: Storm path geometry (polygon for overlap)

- [ ] **A1** Add migration `004_storm_paths_buffered_geojson.sql`: RPC or view that returns storm_path geometry as **buffered polygon** (e.g. `ST_Buffer(geometry::geography, 500)::geometry`) for display and overlap; keep existing RPC for raw geometry if needed.
- [ ] **A2** Update `get_storm_paths_as_geojson` (or new RPC) to return buffered polygon GeoJSON so map and overlap use polygon, not line.
- [ ] **A3** Ensure PostGIS overlap: `point_in_storm_path(lat, lon, path_id)` uses polygon geometry (buffered if source is line); add RPC `properties_in_storm_path(path_id)` returning property ids where `ST_Intersects(property.geometry, storm_path.geometry)` if properties have geometry.
- [ ] **A4** Document in schema comments: storm path geometry used for overlap is polygon; line sources are buffered.

### Phase B: Properties table (full implementation)

- [ ] **B1** Add migration `005_properties_table.sql`: `CREATE TABLE properties` with columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `address TEXT NOT NULL`, `city TEXT`, `state TEXT`, `zip TEXT`, `county TEXT`, `latitude DECIMAL(10,6)`, `longitude DECIMAL(10,6)`, `parcel_geometry GEOMETRY(GEOMETRY, 4326)`, `arcgis_parcel_id TEXT`, `owner_name TEXT`, `owner_phone TEXT`, `owner_email TEXT`, `estimated_value NUMERIC`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- [ ] **B2** Same migration: indexes on `properties(state)`, `properties(arcgis_parcel_id)`, `properties(latitude, longitude)`; GIST index on `parcel_geometry` if not null; RLS `ENABLE ROW LEVEL SECURITY`; policy `Allow authenticated read/write for properties` (or per-user if needed).
- [ ] **B3** Add TypeScript: in `src/types/database.ts` add `properties` table to `Database['public']['Tables']` with Row/Insert/Update matching migration columns; in `src/types/property.ts` align `Property` interface with DB row (id, address, city, state, zip, county, latitude, longitude, parcel_geometry, arcgis_parcel_id, owner_name, owner_phone, owner_email, estimated_value, created_at, updated_at).
- [ ] **B4** Create `src/lib/propertyService.ts`: `getProperties(filters)`, `getPropertyById(id)`, `upsertProperty(property)`, `getPropertiesInStormPath(pathId)` (calls RPC or uses overlap), `createPropertyFromArcGISParcel(parcel)` to insert/upsert from ArcGIS result.
- [ ] **B5** Wire PropertiesPage: ensure data source is Supabase `properties` table via propertyService; list, detail, and map read from properties; "Add property" / "Import from storm path" insert/upsert into properties and optionally create lead with property_id.

### Phase C: Leads table (property_id + storm + storm_path)

- [ ] **C1** Add migration `006_leads_property_id.sql`: `ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL`; index `CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id)`; ensure `storm_id` and `storm_path_id` exist (already in 001).
- [ ] **C2** Update `src/types/database.ts`: in `leads` Row/Insert/Update add `property_id: string | null`; ensure `storm_id` and `storm_path_id` remain.
- [ ] **C3** Update `src/lib/leadService.ts`: `createLead` (and bulk create) accept `property_id`, `storm_id`, `storm_path_id`; when creating lead from "property in storm path", pass property_id (from properties table), storm_path_id (current path), storm_id (from storm_path.event_id lookup or selected storm). All three FKs set where data exists.
- [ ] **C4** Update lead creation UI (StormsPage "Add to leads", PropertiesPage "Add to leads"): after inserting/upserting property into `properties`, create lead with `property_id`, `storm_path_id`, `storm_id`; show lead in LeadsPage with property and storm/path info.
- [ ] **C5** LeadsPage: display property (address, parcel id) and storm/path (event_id, path date) for each lead; optional join or fetch property + storm + storm_path for list/detail.

### Phase D: Storm path rendering (geometry parsing + map)

- [ ] **D1** In `src/lib/stormService.ts`: in `normalizeGeometry(geometry_geojson)`, if `geom.type === 'Feature'` and `geom.geometry`, set `geom = geom.geometry` and re-validate type/coordinates; then push path. Optional dev log of first geometry type.
- [ ] **D2** In `src/components/map/StormMap.tsx`: keep filter for valid geometry; ensure LineString/MultiLineString get visible style (weight, color); polygon style (fillColor, fillOpacity) for polygon. fitBounds to all paths.
- [ ] **D3** StormsPage labels: "X storm reports" (points) and "Y storm path swaths" (paths); optional tooltip explaining difference.
- [ ] **D4** Verify: RPCs applied in Supabase; run `SELECT id, ST_GeometryType(geometry) FROM storm_paths LIMIT 5`; confirm path count in UI matches paths with valid geometry.

### Phase E: Tests and docs

- [ ] **E1** Unit tests: `stormService.test.ts` – mock RPC with Feature-wrapped geometry and string geometry; assert parsed path count. `leadService.test.ts` – createLead with property_id, storm_id, storm_path_id. Optional `propertyService.test.ts` for getProperties, upsertProperty.
- [ ] **E2** E2E or manual: Load Storms → select state → storm paths visible; select path → load properties (ArcGIS) → properties saved to `properties` table → add to leads → lead has property_id, storm_path_id, storm_id. PropertiesPage shows properties from DB.
- [ ] **E3** Update PRD/summary doc with final data model: storms, storm_paths (polygon), properties, leads (property_id, storm_id, storm_path_id); overlap → potential lead.

---

## Data Model (Reference)

- **storms** – Storm events (points). Exists.
- **storm_paths** – Polygon (or buffered from line) for overlap. Exists; RPC returns polygon.
- **properties** – New table. Parcels/addresses; geocoded; overlap with storm_path → potential lead.
- **leads** – `property_id` (FK properties), `storm_id` (FK storms), `storm_path_id` (FK storm_paths). All three set when creating lead from "property in storm path."

```mermaid
erDiagram
  storms ||--o{ leads : "storm_id"
  storm_paths ||--o{ leads : "storm_path_id"
  properties ||--o{ leads : "property_id"
  storm_paths ||--o{ properties : "overlap"
  
  storms { uuid id PK, text event_id, float lat, float lon }
  storm_paths { uuid id PK, geometry polygon }
  properties { uuid id PK, text address, float lat, float lon, text arcgis_parcel_id }
  leads { uuid id PK, uuid property_id FK, uuid storm_id FK, uuid storm_path_id FK }
```

---

## Implementation Details (ULTRATHINK)

### Properties table implementation

| Step | What | Where / How |
|------|------|-------------|
| Migration | Create `properties` table | New file `database/migrations/005_properties_table.sql` |
| Columns | id (UUID PK), address, city, state, zip, county, latitude, longitude, parcel_geometry (GEOMETRY 4326), arcgis_parcel_id, owner_name, owner_phone, owner_email, estimated_value, created_at, updated_at | In migration |
| Indexes | state, arcgis_parcel_id, (latitude, longitude), GIST(parcel_geometry) | In migration |
| RLS | Enable RLS; policy authenticated read/write | In migration |
| Types | Database['public']['Tables']['properties'] Row/Insert/Update | `src/types/database.ts` |
| Types | Property interface matching DB | `src/types/property.ts` |
| Service | getProperties, getPropertyById, upsertProperty, getPropertiesInStormPath, createPropertyFromArcGISParcel | New `src/lib/propertyService.ts` |
| App | PropertiesPage fetches from propertyService (Supabase properties table); add/edit saves to properties | `src/pages/PropertiesPage.tsx` |
| ArcGIS flow | When loading "affected properties" for a storm path, for each ArcGIS parcel: upsert into `properties` (by arcgis_parcel_id or address), then use returned property id when creating lead | `src/lib/arcgisService.ts` + StormsPage/leadService |

### Leads table implementation

| Step | What | Where / How |
|------|------|-------------|
| Migration | Add property_id to leads | New file `database/migrations/006_leads_property_id.sql` |
| Schema | ALTER TABLE leads ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE SET NULL; CREATE INDEX idx_leads_property_id ON leads(property_id); | In migration |
| Types | leads.Row/Insert/Update.property_id: string \| null | `src/types/database.ts` |
| leadService | createLead(params: { property_id?, storm_id?, storm_path_id?, owner_name, address, ... }) | `src/lib/leadService.ts` |
| leadService | bulkCreateLeadsFromProperties(properties, storm_path_id, storm_id?) – for each property, create lead with property_id, storm_path_id, storm_id | `src/lib/leadService.ts` |
| UI | StormsPage: on "Add to leads" for selected properties, ensure each has a property row (upsert), then create lead with property_id, storm_path_id, storm_id | `src/pages/StormsPage.tsx` |
| UI | LeadsPage: show property address (from property_id join or denormalized), storm event_id, storm path date | `src/pages/LeadsPage.tsx` |

### Storm path geometry (polygon for overlap)

| Step | What | Where / How |
|------|------|-------------|
| RPC/view | Return buffered polygon: e.g. ST_Buffer(geometry::geography, 500)::geometry then ST_AsGeoJSON::JSONB | New RPC in migration 004 or alter 003 |
| Overlap | point_in_storm_path(lat, lon, path_id) uses buffered geometry | PostGIS function |
| Optional | properties_in_storm_path(path_id) returning set of property ids where ST_Intersects(property.parcel_geometry, storm_path.geometry) | New RPC after properties table exists |

---

## File Checklist (What Exists vs What to Add/Change)

| File | Action |
|------|--------|
| `database/migrations/004_storm_paths_buffered_geojson.sql` | **Create** – buffer RPC or alter existing RPC to return polygon |
| `database/migrations/005_properties_table.sql` | **Create** – properties table, RLS, indexes |
| `database/migrations/006_leads_property_id.sql` | **Create** – add property_id to leads, index |
| `src/types/database.ts` | **Update** – add properties table; add leads.property_id |
| `src/types/property.ts` | **Update** – align Property with DB row |
| `src/lib/propertyService.ts` | **Create** – CRUD + getPropertiesInStormPath + createPropertyFromArcGISParcel |
| `src/lib/leadService.ts` | **Update** – createLead/bulk accept and set property_id, storm_id, storm_path_id |
| `src/lib/stormService.ts` | **Update** – normalizeGeometry unwrap Feature |
| `src/components/map/StormMap.tsx` | **Update** – LineString style; fitBounds |
| `src/pages/StormsPage.tsx` | **Update** – label copy; lead creation with property_id, storm_path_id, storm_id |
| `src/pages/PropertiesPage.tsx` | **Update** – data from properties table via propertyService |
| `src/pages/LeadsPage.tsx` | **Update** – show property + storm + storm_path for each lead |
| `src/lib/__tests__/stormService.test.ts` | **Update** – Feature/string geometry tests |
| `src/lib/__tests__/leadService.test.ts` | **Update** – property_id, storm_id, storm_path_id in createLead |

---

## Order of Execution (Summary)

1. **A1–A4** Storm path polygon (buffer RPC, overlap).
2. **B1–B5** Properties table (migration, types, propertyService, PropertiesPage).
3. **C1–C5** Leads table (property_id migration, types, leadService, UI).
4. **D1–D4** Storm path rendering (normalizeGeometry, StormMap, labels).
5. **E1–E3** Tests and docs.

This plan gives a single checkable TODO list and explicit implementation steps for the **properties** and **leads** tables and their connections to storms and storm_paths.
