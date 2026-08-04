-- Migration: Add model_3d_url column to projects table
-- This column stores the public URL to the .glb 3D model file from Supabase Storage.
-- Run this migration once to add support for 3D model viewing in project details.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS model_3d_url TEXT DEFAULT NULL;

COMMENT ON COLUMN projects.model_3d_url IS 'Public URL to the .glb 3D model file stored in Supabase Storage';
