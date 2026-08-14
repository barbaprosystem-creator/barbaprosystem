-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — SETUP DE NOTAS DIARIAS Y CALENDARIO
-- Ejecutar en: Supabase Dashboard -> SQL Editor (si fuera necesario)
-- ══════════════════════════════════════════════════════════════════

-- 1. Asegurar tabla daily_reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT DEFAULT '',
    work_completed TEXT,
    work_remaining TEXT,
    issues TEXT,
    weather TEXT,
    crew_count INTEGER,
    hours_worked NUMERIC,
    progress_pct INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columna notes si la tabla ya existía
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 2. Habilitar RLS y políticas
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.daily_reports;
DROP POLICY IF EXISTS "Allow all for anon" ON public.daily_reports;
DROP POLICY IF EXISTS "Service role full access" ON public.daily_reports;

CREATE POLICY "Allow authenticated" ON public.daily_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon" ON public.daily_reports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.daily_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
