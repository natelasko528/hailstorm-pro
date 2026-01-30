-- Migration: Add property_id to leads (link to properties table)
-- Description: Leads connected to property, storm, and storm_path.
-- Run after 005_properties_table.sql.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);

COMMENT ON COLUMN leads.property_id IS 'Link to properties table; lead created when property overlaps storm path';
