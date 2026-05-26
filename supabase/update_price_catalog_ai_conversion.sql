-- Migration to add convert_unit_ai column to price_catalog table
-- Run this in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ddwyutisxymuvofkjhpz/sql

ALTER TABLE price_catalog 
  ADD COLUMN IF NOT EXISTS convert_unit_ai boolean NOT NULL DEFAULT false;

-- Comments explaining the new structure:
-- convert_unit_ai: boolean flag indicating if the AI estimator should automatically convert input measurements to this item's unit type.
