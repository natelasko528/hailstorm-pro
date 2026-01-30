-- Migration: Add Storm Paths with PostGIS Support
-- Description: Creates storm_paths table for storing hail storm path geometries
--              and enhances leads table for ArcGIS parcel integration
-- Run this in your Supabase SQL Editor

-- ============================================
-- ENABLE POSTGIS EXTENSION
-- ============================================
-- PostGIS is pre-installed in Supabase, just needs to be enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- STORM PATHS TABLE (from NOAA shapefiles)
-- ============================================
-- Stores hail storm path polygons imported from SPC SVRGIS shapefiles
CREATE TABLE IF NOT EXISTS storm_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  event_id TEXT UNIQUE,           -- Matches NOAA event ID if available
  om_id INTEGER,                  -- SPC storm report ID from shapefile
  
  -- Temporal data
  begin_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  
  -- Location
  state TEXT,
  state_fips TEXT,
  county TEXT,
  county_fips TEXT,
  
  -- Storm characteristics  
  magnitude NUMERIC,              -- Hail size in inches
  severity TEXT CHECK (severity IN ('light', 'moderate', 'severe', 'extreme')),
  
  -- Geometry (POLYGON or MULTIPOLYGON in WGS84)
  geometry GEOMETRY(GEOMETRY, 4326),
  
  -- Centroid for quick lookups
  centroid_lat NUMERIC,
  centroid_lon NUMERIC,
  
  -- Additional properties from shapefile (stored as JSON)
  properties JSONB DEFAULT '{}',
  
  -- Metadata
  source TEXT DEFAULT 'SPC_SVRGIS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SPATIAL INDEXES
-- ============================================
-- GiST index for spatial queries (essential for ST_Intersects)
CREATE INDEX IF NOT EXISTS idx_storm_paths_geometry 
  ON storm_paths USING GIST(geometry);

-- B-tree indexes for common filters
CREATE INDEX IF NOT EXISTS idx_storm_paths_begin_date 
  ON storm_paths(begin_date DESC);

CREATE INDEX IF NOT EXISTS idx_storm_paths_year 
  ON storm_paths(year DESC);

CREATE INDEX IF NOT EXISTS idx_storm_paths_state 
  ON storm_paths(state);

CREATE INDEX IF NOT EXISTS idx_storm_paths_severity 
  ON storm_paths(severity);

CREATE INDEX IF NOT EXISTS idx_storm_paths_magnitude 
  ON storm_paths(magnitude DESC);

-- ============================================
-- ENHANCE LEADS TABLE FOR ARCGIS INTEGRATION
-- ============================================
-- Add columns for linking to ArcGIS parcels and storm paths

-- Link to storm path that generated this lead
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS storm_path_id UUID REFERENCES storm_paths(id) ON DELETE SET NULL;

-- ArcGIS parcel reference
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS arcgis_parcel_id TEXT;  -- Wisconsin parcel STATEID

-- Cache parcel geometry for visualization
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS parcel_geometry GEOMETRY(GEOMETRY, 4326);

-- Skip tracing data from BatchData
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS owner_phone TEXT;

ALTER TABLE leads  
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS skip_traced_at TIMESTAMPTZ;

-- Estimated property value from ArcGIS
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;

-- ============================================
-- LEADS SPATIAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_storm_path_id 
  ON leads(storm_path_id);

CREATE INDEX IF NOT EXISTS idx_leads_parcel_geometry 
  ON leads USING GIST(parcel_geometry);

CREATE INDEX IF NOT EXISTS idx_leads_arcgis_parcel_id
  ON leads(arcgis_parcel_id);

-- ============================================
-- ROW LEVEL SECURITY FOR STORM PATHS
-- ============================================
ALTER TABLE storm_paths ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read storm paths
CREATE POLICY "Allow authenticated read access to storm_paths" 
  ON storm_paths
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Only allow service role to insert/update storm paths
CREATE POLICY "Allow service role full access to storm_paths"
  ON storm_paths
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate severity from hail magnitude
CREATE OR REPLACE FUNCTION get_hail_severity(magnitude NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF magnitude IS NULL THEN
    RETURN 'moderate';
  ELSIF magnitude >= 2.0 THEN
    RETURN 'extreme';
  ELSIF magnitude >= 1.5 THEN
    RETURN 'severe';
  ELSIF magnitude >= 1.0 THEN
    RETURN 'moderate';
  ELSE
    RETURN 'light';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find properties within a storm path (for use with ArcGIS data)
-- Note: Actual property query is done via ArcGIS API, this is for cached leads
CREATE OR REPLACE FUNCTION get_leads_in_storm_path(path_id UUID)
RETURNS SETOF leads AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM leads l
  WHERE l.storm_path_id = path_id
     OR (l.parcel_geometry IS NOT NULL 
         AND ST_Intersects(
           l.parcel_geometry, 
           (SELECT geometry FROM storm_paths WHERE id = path_id)
         ));
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE TRIGGER update_storm_paths_updated_at
  BEFORE UPDATE ON storm_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE QUERY EXAMPLES (for reference)
-- ============================================
-- Find storm paths that intersect with a point (for address lookup):
-- SELECT * FROM storm_paths 
-- WHERE ST_Intersects(geometry, ST_SetSRID(ST_MakePoint(-89.5, 43.0), 4326));

-- Find all storms within a date range:
-- SELECT * FROM storm_paths
-- WHERE begin_date BETWEEN '2024-01-01' AND '2024-12-31'
-- ORDER BY begin_date DESC;

-- Get storms with path area calculation:
-- SELECT id, event_id, begin_date, ST_Area(geometry::geography) / 1000000 as area_sq_km
-- FROM storm_paths
-- ORDER BY area_sq_km DESC;
