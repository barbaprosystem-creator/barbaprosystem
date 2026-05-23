-- Ejecuta esto en Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/ddwyutisxymuvofkjhpz/sql

CREATE TABLE IF NOT EXISTS payroll_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_name text NOT NULL DEFAULT 'General',
  daily_rate numeric NOT NULL DEFAULT 0,
  daily_rate_2 numeric,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES payroll_workers(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  worked boolean DEFAULT true,
  hours numeric,
  notes text,
  UNIQUE(worker_id, work_date)
);

CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES payroll_workers(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  type text CHECK (type IN ('bonus','discount','reimbursement')) DEFAULT 'bonus',
  amount numeric DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE payroll_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_workers_authenticated" ON payroll_workers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "payroll_attendance_authenticated" ON payroll_attendance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "payroll_adjustments_authenticated" ON payroll_adjustments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
