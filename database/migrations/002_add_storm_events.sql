-- ============================================
-- HailStorm Pro - Storm Events Table Migration
-- 
-- This table stores NOAA hail storm event data
-- imported from the Storm Events Database.
-- 
-- Run this in your Supabase SQL Editor after
-- running the initial schema migration.
-- ============================================

-- ============================================
-- STORM_EVENTS TABLE (NOAA hail data)
-- ============================================
CREATE TABLE IF NOT EXISTS storm_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE,  -- NOAA event ID for deduplication
  state TEXT,            -- State abbreviation (e.g., 'WI')
  county TEXT,           -- County name
  location TEXT,         -- Location description (e.g., 'MILWAUKEE')
  begin_date_time TIMESTAMPTZ,  -- Event start date/time
  end_date_time TIMESTAMPTZ,    -- Event end date/time
  magnitude DECIMAL(4,2), -- Hail size in inches
  latitude DECIMAL(10,6), -- Event latitude
  longitude DECIMAL(10,6), -- Event longitude
  event_narrative TEXT,   -- Detailed event description from NOAA
  source TEXT,           -- Data source (e.g., 'NOAA Storm Events')
  year INTEGER,          -- Year extracted for filtering
  month_name TEXT,       -- Month name (e.g., 'JULY')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR STORM_EVENTS
-- ============================================

-- Index for date-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_storm_events_begin_date 
  ON storm_events(begin_date_time DESC);

-- Index for state filtering (common for regional queries)
CREATE INDEX IF NOT EXISTS idx_storm_events_state 
  ON storm_events(state);

-- Index for year filtering
CREATE INDEX IF NOT EXISTS idx_storm_events_year 
  ON storm_events(year DESC);

-- Index for magnitude filtering (severity queries)
CREATE INDEX IF NOT EXISTS idx_storm_events_magnitude 
  ON storm_events(magnitude DESC);

-- Composite index for location-based queries
CREATE INDEX IF NOT EXISTS idx_storm_events_location 
  ON storm_events(latitude, longitude);

-- Index for county-based queries
CREATE INDEX IF NOT EXISTS idx_storm_events_county 
  ON storm_events(county);

-- Index for event_id lookups
CREATE INDEX IF NOT EXISTS idx_storm_events_event_id 
  ON storm_events(event_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE storm_events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read storm events
CREATE POLICY "Allow authenticated read access to storm_events" 
  ON storm_events
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow service role to manage storm events (for data imports)
CREATE POLICY "Allow service role full access to storm_events" 
  ON storm_events
  FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate severity from magnitude
-- Used for consistent severity categorization
CREATE OR REPLACE FUNCTION get_storm_severity(mag DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF mag IS NULL THEN
    RETURN 'moderate';
  ELSIF mag >= 2.0 THEN
    RETURN 'extreme';
  ELSIF mag >= 1.5 THEN
    RETURN 'severe';
  ELSIF mag >= 1.0 THEN
    RETURN 'moderate';
  ELSE
    RETURN 'light';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get storm events by date range
CREATE OR REPLACE FUNCTION get_storm_events_by_date_range(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  state_filter TEXT DEFAULT NULL,
  min_magnitude DECIMAL DEFAULT NULL
)
RETURNS SETOF storm_events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM storm_events
  WHERE begin_date_time >= start_date
    AND begin_date_time <= end_date
    AND (state_filter IS NULL OR state = state_filter)
    AND (min_magnitude IS NULL OR magnitude >= min_magnitude)
  ORDER BY begin_date_time DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- SAMPLE DATA COMMENT
-- ============================================
-- To import NOAA storm data, use the provided Python scripts:
-- 1. database/seed_hail_data.py - Imports from NOAA Storm Events Database
-- 2. scripts/import-shapefiles.js - Imports storm path polygons
--
-- Example insert for testing:
-- INSERT INTO storm_events (
--   event_id, state, county, location, 
--   begin_date_time, magnitude, latitude, longitude,
--   event_narrative, source, year, month_name
-- ) VALUES (
--   'TEST-001', 'WI', 'MILWAUKEE', 'MILWAUKEE',
--   '2024-07-15 14:30:00-05', 1.75, 43.0389, -87.9065,
--   'Large hail reported in downtown Milwaukee area.',
--   'NOAA Storm Events', 2024, 'JULY'
-- );
