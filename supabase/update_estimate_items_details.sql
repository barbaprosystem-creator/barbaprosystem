-- Ejecuta esto en el SQL Editor de Supabase para añadir columnas a la tabla estimate_items
ALTER TABLE public.estimate_items 
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT;
