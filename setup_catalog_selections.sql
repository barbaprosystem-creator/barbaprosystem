-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — Creación de Tabla para Selecciones del Catálogo
-- ══════════════════════════════════════════════════════════════════

-- Create catalog_selections table
CREATE TABLE IF NOT EXISTS public.catalog_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    selections JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.catalog_selections ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (from the public catalog page)
CREATE POLICY "Enable insert for anonymous users" 
    ON public.catalog_selections FOR INSERT 
    WITH CHECK (true);

-- Allow authenticated users to read and update
CREATE POLICY "Enable read for authenticated users" 
    ON public.catalog_selections FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable update for authenticated users" 
    ON public.catalog_selections FOR UPDATE 
    TO authenticated 
    USING (true);
