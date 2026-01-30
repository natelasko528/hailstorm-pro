-- HailStorm Pro - Complete Production Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- STORMS TABLE (matches NOAA data structure)
-- ============================================
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

-- ============================================
-- PROFILES TABLE (user settings & info)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  business_address TEXT,
  notification_prefs JSONB DEFAULT '{
    "email_storm_alerts": true,
    "email_lead_updates": true,
    "email_weekly_reports": true,
    "sms_urgent_alerts": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADS/PROPERTIES TABLE
-- ============================================
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

-- ============================================
-- LEAD NOTES TABLE (activity timeline)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_storms_date ON storms(date DESC);
CREATE INDEX IF NOT EXISTS idx_storms_state ON storms(state);
CREATE INDEX IF NOT EXISTS idx_storms_severity ON storms(severity);
CREATE INDEX IF NOT EXISTS idx_storms_location ON storms(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_leads_storm_id ON leads(storm_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON lead_notes(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE storms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Storms: Allow all authenticated users to read
CREATE POLICY "Allow authenticated read access to storms" ON storms
  FOR SELECT TO authenticated USING (true);

-- Leads: Allow all authenticated users to read/write
CREATE POLICY "Allow authenticated access to leads" ON leads
  FOR ALL TO authenticated USING (true);

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Lead Notes: Users can manage their own notes
CREATE POLICY "Users can view all lead notes" ON lead_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own notes" ON lead_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON lead_notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update trigger for leads.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
