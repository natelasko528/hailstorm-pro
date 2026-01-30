-- Migration: Add RPC function for storm paths with GeoJSON geometry
-- Description: Creates a function to return storm path geometry as GeoJSON
--              since PostGIS geometry is returned in binary format by default
-- Run this in your Supabase SQL Editor

-- ============================================
-- RPC FUNCTION: Get Storm Paths with GeoJSON
-- ============================================
-- This function converts PostGIS geometry to GeoJSON format
-- which can be directly used by Leaflet for map rendering

CREATE OR REPLACE FUNCTION get_storm_paths_as_geojson(
  filter_state TEXT DEFAULT NULL,
  filter_severity TEXT DEFAULT NULL,
  filter_year INTEGER DEFAULT NULL,
  filter_start_date TIMESTAMPTZ DEFAULT NULL,
  filter_end_date TIMESTAMPTZ DEFAULT NULL,
  max_results INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  om_id INTEGER,
  begin_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  state TEXT,
  state_fips TEXT,
  county TEXT,
  county_fips TEXT,
  magnitude NUMERIC,
  severity TEXT,
  geometry_geojson JSONB,
  centroid_lat NUMERIC,
  centroid_lon NUMERIC,
  properties JSONB,
  source TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.event_id,
    sp.om_id,
    sp.begin_date,
    sp.end_date,
    sp.year,
    sp.month,
    sp.day,
    sp.state,
    sp.state_fips,
    sp.county,
    sp.county_fips,
    sp.magnitude,
    sp.severity,
    CASE 
      WHEN sp.geometry IS NOT NULL THEN ST_AsGeoJSON(sp.geometry)::JSONB
      ELSE NULL
    END as geometry_geojson,
    sp.centroid_lat,
    sp.centroid_lon,
    sp.properties,
    sp.source,
    sp.created_at,
    sp.updated_at
  FROM storm_paths sp
  WHERE 
    (filter_state IS NULL OR sp.state = filter_state)
    AND (filter_severity IS NULL OR sp.severity = filter_severity)
    AND (filter_year IS NULL OR sp.year = filter_year)
    AND (filter_start_date IS NULL OR sp.begin_date >= filter_start_date)
    AND (filter_end_date IS NULL OR sp.begin_date <= filter_end_date)
  ORDER BY sp.begin_date DESC NULLS LAST
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC FUNCTION: Get Single Storm Path with GeoJSON
-- ============================================
CREATE OR REPLACE FUNCTION get_storm_path_by_id(path_id UUID)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  om_id INTEGER,
  begin_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  state TEXT,
  state_fips TEXT,
  county TEXT,
  county_fips TEXT,
  magnitude NUMERIC,
  severity TEXT,
  geometry_geojson JSONB,
  centroid_lat NUMERIC,
  centroid_lon NUMERIC,
  properties JSONB,
  source TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.event_id,
    sp.om_id,
    sp.begin_date,
    sp.end_date,
    sp.year,
    sp.month,
    sp.day,
    sp.state,
    sp.state_fips,
    sp.county,
    sp.county_fips,
    sp.magnitude,
    sp.severity,
    CASE 
      WHEN sp.geometry IS NOT NULL THEN ST_AsGeoJSON(sp.geometry)::JSONB
      ELSE NULL
    END as geometry_geojson,
    sp.centroid_lat,
    sp.centroid_lon,
    sp.properties,
    sp.source,
    sp.created_at,
    sp.updated_at
  FROM storm_paths sp
  WHERE sp.id = path_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC FUNCTION: Get Storm Path by Event ID
-- ============================================
CREATE OR REPLACE FUNCTION get_storm_path_by_event_id(p_event_id TEXT)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  om_id INTEGER,
  begin_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  state TEXT,
  state_fips TEXT,
  county TEXT,
  county_fips TEXT,
  magnitude NUMERIC,
  severity TEXT,
  geometry_geojson JSONB,
  centroid_lat NUMERIC,
  centroid_lon NUMERIC,
  properties JSONB,
  source TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.event_id,
    sp.om_id,
    sp.begin_date,
    sp.end_date,
    sp.year,
    sp.month,
    sp.day,
    sp.state,
    sp.state_fips,
    sp.county,
    sp.county_fips,
    sp.magnitude,
    sp.severity,
    CASE 
      WHEN sp.geometry IS NOT NULL THEN ST_AsGeoJSON(sp.geometry)::JSONB
      ELSE NULL
    END as geometry_geojson,
    sp.centroid_lat,
    sp.centroid_lon,
    sp.properties,
    sp.source,
    sp.created_at,
    sp.updated_at
  FROM storm_paths sp
  WHERE sp.event_id = p_event_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC FUNCTION: Find Storm Paths Near Location
-- ============================================
-- Uses ST_DWithin for efficient spatial query
-- radius_km is the search radius in kilometers
CREATE OR REPLACE FUNCTION get_storm_paths_near_location(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  radius_km NUMERIC DEFAULT 10,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  event_id TEXT,
  om_id INTEGER,
  begin_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  state TEXT,
  state_fips TEXT,
  county TEXT,
  county_fips TEXT,
  magnitude NUMERIC,
  severity TEXT,
  geometry_geojson JSONB,
  centroid_lat NUMERIC,
  centroid_lon NUMERIC,
  properties JSONB,
  source TEXT,
  distance_km NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.event_id,
    sp.om_id,
    sp.begin_date,
    sp.end_date,
    sp.year,
    sp.month,
    sp.day,
    sp.state,
    sp.state_fips,
    sp.county,
    sp.county_fips,
    sp.magnitude,
    sp.severity,
    CASE 
      WHEN sp.geometry IS NOT NULL THEN ST_AsGeoJSON(sp.geometry)::JSONB
      ELSE NULL
    END as geometry_geojson,
    sp.centroid_lat,
    sp.centroid_lon,
    sp.properties,
    sp.source,
    -- Calculate distance in km
    ST_Distance(
      sp.geometry::geography,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) / 1000 as distance_km,
    sp.created_at,
    sp.updated_at
  FROM storm_paths sp
  WHERE 
    sp.geometry IS NOT NULL
    AND ST_DWithin(
      sp.geometry::geography,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      radius_km * 1000  -- Convert km to meters
    )
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- RPC FUNCTION: Check if point is within storm path
-- ============================================
CREATE OR REPLACE FUNCTION point_in_storm_path(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  path_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_within BOOLEAN;
BEGIN
  SELECT ST_Contains(
    sp.geometry,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
  ) INTO is_within
  FROM storm_paths sp
  WHERE sp.id = path_id;
  
  RETURN COALESCE(is_within, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_storm_paths_as_geojson TO authenticated;
GRANT EXECUTE ON FUNCTION get_storm_path_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_storm_path_by_event_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_storm_paths_near_location TO authenticated;
GRANT EXECUTE ON FUNCTION point_in_storm_path TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_storm_paths_as_geojson IS 'Fetches storm paths with geometry converted to GeoJSON format for map rendering';
COMMENT ON FUNCTION get_storm_path_by_id IS 'Fetches a single storm path by UUID with GeoJSON geometry';
COMMENT ON FUNCTION get_storm_path_by_event_id IS 'Fetches a storm path by NOAA event ID with GeoJSON geometry';
COMMENT ON FUNCTION get_storm_paths_near_location IS 'Finds storm paths within a radius (km) of a lat/lon point, ordered by distance';
COMMENT ON FUNCTION point_in_storm_path IS 'Checks if a point is contained within a storm path polygon';
