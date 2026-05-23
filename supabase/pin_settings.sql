CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insertar el PIN por defecto si no existe
INSERT INTO system_settings (key, value)
VALUES ('security_pin', '2012')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS pin_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  otp_code text NOT NULL,
  new_pin text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Permisos (Autenticados pueden leer el PIN para entrar a páginas, y escribir para actualizar/crear)
CREATE POLICY "Allow authenticated read system_settings" ON public.system_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert system_settings" ON public.system_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated update system_settings" ON public.system_settings FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access pin_reset_requests" ON public.pin_reset_requests FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_reset_requests ENABLE ROW LEVEL SECURITY;
