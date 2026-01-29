-- HailStorm Pro - Simplified Schema for NOAA Data
-- Run this in your Supabase SQL Editor

-- Storms table (matches NOAA data structure)
CREATE TABLE IF NOT EXISTS storms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  county TEXT,
  date TIMESTAMPTZ NOT NULL,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'extreme')),
  hail_size DECIMAL(4,2), -- inches
  affected_properties INTEGER DEFAULT 0,
  estimated_damage BIGINT DEFAULT 0,
  latitude DECIMAL(10,6) NOT NULL,
  longitude DECIMAL(10,6) NOT NULL,
  narrative TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads/Properties table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  storm_id TEXT REFERENCES storms(event_id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  lead_score INTEGER CHECK (lead_score BETWEEN 0 AND 100),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'appointment', 'won', 'lost')),
  damage_severity TEXT CHECK (damage_severity IN ('minor', 'moderate', 'severe')),
  roof_age INTEGER,
  property_value INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_storms_date ON storms(date DESC);
CREATE INDEX IF NOT EXISTS idx_storms_state ON storms(state);
CREATE INDEX IF NOT EXISTS idx_storms_severity ON storms(severity);
CREATE INDEX IF NOT EXISTS idx_storms_location ON storms(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_leads_storm_id ON leads(storm_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(latitude, longitude);

-- Enable Row Level Security (disable for now during development)
ALTER TABLE storms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (adjust for production)
CREATE POLICY "Allow all access to storms" ON storms FOR ALL USING (true);
CREATE POLICY "Allow all access to leads" ON leads FOR ALL USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
