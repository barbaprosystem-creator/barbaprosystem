-- Migration to add sender_id to mensajes table for tracking response attribution
-- Run this in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ddwyutisxymuvofkjhpz/sql

ALTER TABLE public.mensajes 
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create an index to improve performance of queries joining profiles
CREATE INDEX IF NOT EXISTS idx_mensajes_sender_id ON public.mensajes(sender_id);

COMMENT ON COLUMN public.mensajes.sender_id IS 'References the profiles(id) of the employee who sent the outbound message';
