-- Migration script to add color and service_type to calendar_events
-- Pegar en: supabase.com → ddwyutisxymuvofkjhpz → SQL Editor → Run

ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT;
