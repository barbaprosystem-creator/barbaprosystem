-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — Corrección del Catálogo de Materiales
-- Pegar en: supabase.com → Tu Proyecto → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

-- 1. Crear la tabla catalog_items
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  image_url TEXT,
  purchase_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Configurar Seguridad (RLS)
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users on catalog_items" 
ON public.catalog_items FOR SELECT USING (true);

CREATE POLICY "Allow write access to authenticated users on catalog_items" 
ON public.catalog_items FOR ALL USING (auth.role() = 'authenticated');

-- 3. Insertar Datos de Muestra
INSERT INTO public.catalog_items (name, category, description, price, image_url) VALUES
('Timberline HDZ Shingles - Charcoal', 'Techos', 'Tejas asfálticas de alta durabilidad con tecnología LayerLock.', 35.50, 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&q=80&w=600'),
('Timberline HDZ Shingles - Weathered Wood', 'Techos', 'Tejas asfálticas de alta durabilidad con tecnología LayerLock.', 35.50, 'https://images.unsplash.com/photo-1605810731663-d144e5ce6cce?auto=format&fit=crop&q=80&w=600'),
('Vinyl Siding Double 4" - White', 'Siding', 'Revestimiento de vinilo tradicional y duradero, fácil mantenimiento.', 12.00, 'https://images.unsplash.com/photo-1590400589139-4d642353f88f?auto=format&fit=crop&q=80&w=600'),
('HardiePlank Lap Siding - Arctic White', 'Siding', 'Fibrocemento de alta resistencia, resiste podredumbre y plagas.', 24.00, 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=600'),
('Canaleta de Aluminio K-Style 5"', 'Accesorios', 'Canaleta sin costura de aluminio blanco (precio por pie lineal).', 6.50, 'https://images.unsplash.com/photo-1524813589412-fbd6a6bc8129?auto=format&fit=crop&q=80&w=600'),
('Ventana de Vinilo Doble Panel - Blanca', 'Otros', 'Ventana estándar energéticamente eficiente, con mosquitero incluido.', 245.00, 'https://images.unsplash.com/photo-1503652601-557d07733ddc?auto=format&fit=crop&q=80&w=600');
