-- Migration: Storm paths as buffered polygon for display and overlap
-- Description: Returns storm path geometry as polygon (buffered 500m if line)
--              so map display and point-in-path overlap use polygon geometry.
--              Storm path geometry used for overlap is polygon; line sources are buffered.
-- Run after 003_storm_paths_geojson.sql

-- ============================================
-- RPC: Get Storm Paths with Buffered Polygon GeoJSON
-- ============================================
-- Use for map display and overlap: LineString becomes polygon (500m buffer).
CREATE OR REPLACE FUNCTION get_storm_paths_as_geojson_buffered(
  filter_state TEXT DEFAULT NULL,
  filter_severity TEXT DEFAULT NULL,
  filter_year INTEGER DEFAULT NULL,
  filter_start_date TIMESTAMPTZ DEFAULT NULL,
  filter_end_date TIMESTAMPTZ DEFAULT NULL,
  max_results INTEGER DEFAULT 100,
  buffer_meters NUMERIC DEFAULT 500
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
      WHEN sp.geometry IS NOT NULL THEN ST_AsGeoJSON(ST_Buffer(sp.geometry::geography, buffer_meters)::geometry)::JSONB
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

COMMENT ON FUNCTION get_storm_paths_as_geojson_buffered IS 'Storm paths with geometry as buffered polygon (500m default) for map and overlap; line sources become polygon';

-- ============================================
-- point_in_storm_path: use buffered geometry for containment
-- ============================================
-- So points are tested against polygon (LineString buffered to 500m).
CREATE OR REPLACE FUNCTION point_in_storm_path(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  path_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_within BOOLEAN;
  buf_geom GEOMETRY;
BEGIN
  SELECT ST_Buffer(sp.geometry::geography, 500)::geometry INTO buf_geom
  FROM storm_paths sp
  WHERE sp.id = path_id AND sp.geometry IS NOT NULL;

  IF buf_geom IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT ST_Contains(
    buf_geom,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
  ) INTO is_within;

  RETURN COALESCE(is_within, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION point_in_storm_path IS 'Checks if a point is contained within storm path polygon (geometry buffered 500m for line sources)';

GRANT EXECUTE ON FUNCTION get_storm_paths_as_geojson_buffered TO authenticated;
