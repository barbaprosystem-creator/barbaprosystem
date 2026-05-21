-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — Creación de Tabla de Gastos de Proyectos
-- ══════════════════════════════════════════════════════════════════

-- 1. Crear la tabla de gastos
CREATE TABLE IF NOT EXISTS public.project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('material', 'labor', 'other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  vendor TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (Seguridad a nivel de fila)
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para lectura y escritura (Aplica a usuarios autenticados)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_expenses' AND policyname = 'Permitir lectura a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir lectura a usuarios autenticados" 
      ON public.project_expenses FOR SELECT 
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_expenses' AND policyname = 'Permitir inserción a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir inserción a usuarios autenticados" 
      ON public.project_expenses FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_expenses' AND policyname = 'Permitir actualización a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir actualización a usuarios autenticados" 
      ON public.project_expenses FOR UPDATE 
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_expenses' AND policyname = 'Permitir borrado a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir borrado a usuarios autenticados" 
      ON public.project_expenses FOR DELETE 
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 4. (Opcional) Datos de prueba para probar la funcionalidad
INSERT INTO public.project_expenses (project_id, type, amount, vendor, date, description)
VALUES 
  ('mock-proj-1', 'material', 150.25, 'Home Depot', CURRENT_DATE, 'Madera y clavos 2x4'),
  ('mock-proj-1', 'labor', 800.00, 'Brigada XYZ', CURRENT_DATE, 'Pago semanal por avance de techo')
ON CONFLICT DO NOTHING;
