-- Tabla para SMS programados (enviados por cron a las 8 AM)
CREATE TABLE IF NOT EXISTS scheduled_sms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/New_York')::date + INTERVAL '8 hours',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  project_id UUID REFERENCES projects(id)
);

-- Índice para consulta eficiente del cron
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_pending ON scheduled_sms (status, scheduled_for) WHERE status = 'pending';

-- Permitir que usuarios autenticados inserten
ALTER TABLE scheduled_sms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert scheduled SMS"
ON scheduled_sms FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read scheduled SMS"
ON scheduled_sms FOR SELECT TO authenticated USING (true);
