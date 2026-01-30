-- Migration: Properties table for parcels/addresses (geocoded)
-- Description: First-class properties table; overlap with storm_path → potential lead.
-- Run after 004. Required before 006_leads_property_id.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  county TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  parcel_geometry GEOMETRY(GEOMETRY, 4326),
  arcgis_parcel_id TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  estimated_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_arcgis_parcel_id ON properties(arcgis_parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lon ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_parcel_geometry ON properties USING GIST(parcel_geometry) WHERE parcel_geometry IS NOT NULL;

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write for properties"
  ON properties FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE properties IS 'Parcels/addresses (geocoded); overlap with storm_path geometry identifies potential leads';
