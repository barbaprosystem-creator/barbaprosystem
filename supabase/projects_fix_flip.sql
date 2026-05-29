-- Migration script to add project_type and purchase_price to projects
-- Pegar en: supabase.com → ddwyutisxymuvofkjhpz → SQL Editor → Run

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;
