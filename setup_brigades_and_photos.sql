-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — Creación de Tablas de Brigadas y Fotos
-- ══════════════════════════════════════════════════════════════════

-- 1. Crear tabla de brigadas
CREATE TABLE IF NOT EXISTS public.brigades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    foreman TEXT NOT NULL,
    service_type TEXT NOT NULL,
    phone TEXT,
    members_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'available',
    current_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en brigades pero permitir todo (para propósitos de este CRM local)
ALTER TABLE public.brigades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions on brigades for authenticated users" 
ON public.brigades FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 2. Crear tabla de project_photos
CREATE TABLE IF NOT EXISTS public.project_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions on project_photos for authenticated users" 
ON public.project_photos FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Crear Bucket de Storage para jobsite_photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jobsite_photos', 'jobsite_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para jobsite_photos
CREATE POLICY "Allow public read on jobsite_photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'jobsite_photos');

CREATE POLICY "Allow insert on jobsite_photos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'jobsite_photos');

CREATE POLICY "Allow delete on jobsite_photos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'jobsite_photos');
