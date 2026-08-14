-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — SETUP & CORRECCIÓN DE BRIGADAS Y FOTOS
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> Run
-- ══════════════════════════════════════════════════════════════════

-- 1. Asegurar la tabla de brigadas
CREATE TABLE IF NOT EXISTS public.brigades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Eliminar restricciones de estado previas (para evitar conflictos de valores permitidos)
ALTER TABLE public.brigades DROP CONSTRAINT IF EXISTS brigades_status_check;

-- 3. Agregar o asegurar todas las columnas requeridas
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS foreman TEXT DEFAULT '';
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'Roofing';
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS members_count INTEGER DEFAULT 1;
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS current_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.brigades ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Si la columna antigua project_id existe, migrar datos y eliminar foreign key constraint para evitar ambigüedad en PostgREST
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'brigades' AND column_name = 'project_id'
    ) THEN
        UPDATE public.brigades SET current_project_id = project_id WHERE current_project_id IS NULL AND project_id IS NOT NULL;
        ALTER TABLE public.brigades DROP CONSTRAINT IF EXISTS brigades_project_id_fkey;
    END IF;
END $$;

-- 5. Actualizar valor por defecto de status y nueva restricción con los estados del CRM
ALTER TABLE public.brigades ALTER COLUMN status SET DEFAULT 'available';
ALTER TABLE public.brigades ADD CONSTRAINT brigades_status_check 
  CHECK (status IN ('available', 'working', 'delayed', 'active', 'inactive'));

-- 6. Habilitar Row Level Security (RLS) en brigades y crear políticas
ALTER TABLE public.brigades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions on brigades for authenticated users" ON public.brigades;
DROP POLICY IF EXISTS "Allow authenticated" ON public.brigades;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.brigades;
DROP POLICY IF EXISTS "Allow all for anon" ON public.brigades;
DROP POLICY IF EXISTS "Allow anon" ON public.brigades;
DROP POLICY IF EXISTS "Service role full access" ON public.brigades;

CREATE POLICY "Allow authenticated" ON public.brigades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon" ON public.brigades FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.brigades FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Crear / Asegurar tabla project_photos
CREATE TABLE IF NOT EXISTS public.project_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS caption TEXT DEFAULT '';

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions on project_photos for authenticated users" ON public.project_photos;
DROP POLICY IF EXISTS "Allow authenticated" ON public.project_photos;
DROP POLICY IF EXISTS "Allow anon" ON public.project_photos;
DROP POLICY IF EXISTS "Service role full access" ON public.project_photos;

CREATE POLICY "Allow authenticated" ON public.project_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon" ON public.project_photos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.project_photos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Crear Bucket de Storage para jobsite_photos si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jobsite_photos', 'jobsite_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para jobsite_photos
DROP POLICY IF EXISTS "Allow public read on jobsite_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert on jobsite_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete on jobsite_photos" ON storage.objects;

CREATE POLICY "Allow public read on jobsite_photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'jobsite_photos');

CREATE POLICY "Allow insert on jobsite_photos" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'jobsite_photos');

CREATE POLICY "Allow delete on jobsite_photos" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'jobsite_photos');
