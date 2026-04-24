-- ══════════════════════════════════════════════════════════════════
-- BARBA PRO SYSTEM — Migración Completa al Nuevo Proyecto Supabase
-- Pegar en: supabase.com → ddwyutisxymuvofkjhpz → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

-- ─── PASO 1: TABLAS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'salesperson'
                CHECK (role = ANY (ARRAY['admin','salesperson','supervisor','office'])),
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT DEFAULT 'KY',
  zip             TEXT,
  source          TEXT CHECK (source IS NULL OR source = ANY (ARRAY['web','facebook','instagram','google','phone','referral','walk_in','tiktok','other'])),
  pipeline_status TEXT DEFAULT 'new_lead' CHECK (pipeline_status = ANY (ARRAY['new_lead','contacted','appointment_set','estimate_sent','closed_won','closed_lost'])),
  assigned_to     UUID REFERENCES public.profiles(id),
  lead_quality    TEXT DEFAULT 'warm' CHECK (lead_quality = ANY (ARRAY['hot','warm','cold'])),
  external_ref    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  description TEXT,
  unit_type   TEXT NOT NULL CHECK (unit_type = ANY (ARRAY['sq','linear_ft','unit','sqft','hour'])),
  base_cost   NUMERIC NOT NULL,
  margin_pct  NUMERIC DEFAULT 30.00,
  sell_price  NUMERIC GENERATED ALWAYS AS (base_cost * (1 + margin_pct / 100)) STORED,
  is_active   BOOLEAN DEFAULT true,
  updated_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number   INTEGER GENERATED ALWAYS AS IDENTITY,
  contact_id        UUID REFERENCES public.contacts(id),
  created_by        UUID REFERENCES public.profiles(id),
  status            TEXT DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft','sent','approved','rejected','expired'])),
  work_type         TEXT,
  subtotal          NUMERIC DEFAULT 0,
  grand_total       NUMERIC DEFAULT 0,
  scope_of_work     TEXT,
  warranty_terms    TEXT DEFAULT '10-Year Workmanship Warranty',
  notes             TEXT,
  signature_data    TEXT,
  signed_at         TIMESTAMPTZ,
  signed_by_name    TEXT,
  financing_offered BOOLEAN DEFAULT false,
  pdf_storage_path  TEXT,
  valid_until       DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimate_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id     UUID REFERENCES public.estimates(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES public.price_catalog(id),
  description     TEXT NOT NULL,
  quantity        NUMERIC NOT NULL DEFAULT 1,
  unit_type       TEXT,
  unit_price      NUMERIC NOT NULL,
  line_total      NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number  INTEGER GENERATED ALWAYS AS IDENTITY,
  estimate_id     UUID REFERENCES public.estimates(id),
  contact_id      UUID REFERENCES public.contacts(id),
  supervisor_id   UUID REFERENCES public.profiles(id),
  title           TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','scheduled','in_progress','on_hold','completed','cancelled'])),
  progress_pct    INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  start_date      DATE,
  target_end_date DATE,
  actual_end_date DATE,
  sold_price      NUMERIC,
  total_costs     NUMERIC DEFAULT 0,
  address         TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  assigned_to   UUID REFERENCES public.profiles(id),
  completed_by  UUID REFERENCES public.profiles(id),
  status        TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','in_progress','completed'])),
  task_category TEXT DEFAULT 'general' CHECK (task_category = ANY (ARRAY['demolition','framing','roofing','siding','windows','gutters','painting','inspection','cleanup','delivery','general'])),
  week_start    DATE,
  week_end      DATE,
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES public.projects(id),
  contact_id       UUID REFERENCES public.contacts(id),
  amount           NUMERIC NOT NULL,
  payment_type     TEXT CHECK (payment_type = ANY (ARRAY['deposit','partial','final','refund'])),
  payment_method   TEXT CHECK (payment_method = ANY (ARRAY['check','card','cash','financing','zelle','other'])),
  status           TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','received','overdue','refunded'])),
  due_date         DATE,
  paid_at          TIMESTAMPTZ,
  reference_number TEXT,
  notes            TEXT,
  reminder_sent_5d BOOLEAN DEFAULT false,
  reminder_sent_1d BOOLEAN DEFAULT false,
  reminder_5d_at   TIMESTAMPTZ,
  reminder_1d_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_reminders_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID REFERENCES public.payments(id),
  channel       TEXT CHECK (channel = ANY (ARRAY['sms','email','internal','both'])),
  reminder_type TEXT DEFAULT 'manual',
  status        TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','sent','failed','delivered'])),
  sent_at       TIMESTAMPTZ DEFAULT now(),
  message_body  TEXT,
  message_sid   TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  event_type    TEXT CHECK (event_type = ANY (ARRAY['appointment','project_start','inspection','payment_due','follow_up','other'])),
  calendar_type TEXT DEFAULT 'sales' CHECK (calendar_type = ANY (ARRAY['sales','projects'])),
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ,
  start_hour    TIME,
  all_day       BOOLEAN DEFAULT false,
  location      TEXT,
  contact_id    UUID REFERENCES public.contacts(id),
  project_id    UUID REFERENCES public.projects(id),
  assigned_to   UUID REFERENCES public.profiles(id),
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES public.projects(id),
  reported_by    UUID REFERENCES public.profiles(id),
  report_date    DATE DEFAULT CURRENT_DATE,
  work_completed TEXT,
  work_remaining TEXT,
  issues         TEXT,
  weather        TEXT,
  crew_count     INTEGER,
  hours_worked   NUMERIC,
  progress_pct   INTEGER CHECK (progress_pct >= 0 AND progress_pct <= 100),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES public.projects(id),
  uploaded_by  UUID REFERENCES public.profiles(id),
  storage_path TEXT NOT NULL,
  photo_type   TEXT DEFAULT 'progress' CHECK (photo_type = ANY (ARRAY['before','progress','after','issue'])),
  caption      TEXT,
  taken_at     TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES public.projects(id),
  item_name   TEXT NOT NULL,
  quantity    NUMERIC DEFAULT 1,
  unit        TEXT DEFAULT 'unit',
  unit_cost   NUMERIC DEFAULT 0,
  total_cost  NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  supplier    TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','ordered','shipped','received'])),
  ordered_at  TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id),
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── PASO 2: AUTO-CREATE PROFILE ON SIGNUP ────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'salesperson')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── PASO 3: RLS (Row Level Security) ────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_catalog       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log        ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados ven todo (simplificado para fase inicial)
CREATE POLICY "authenticated_all" ON public.profiles            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.contacts            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.price_catalog       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.estimates           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.estimate_items      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.projects            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.project_tasks       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.payments            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.payment_reminders_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.calendar_events     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.daily_reports       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.project_photos      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.materials           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.activity_log        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── PASO 4: CATÁLOGO DE PRECIOS (29 items) ───────────────────
INSERT INTO public.price_catalog (category, item_name, description, unit_type, base_cost, margin_pct) VALUES
-- ROOFING
('roofing','Architectural Shingles 30yr','GAF Timberline HDZ or equivalent','sq',285,30),
('roofing','Architectural Shingles 50yr','GAF Timberline Ultra HD','sq',340,30),
('roofing','Tear Off (1 Layer)','Remove existing shingles','sq',85,30),
('roofing','Tear Off (2 Layers)','Remove 2 layers of existing shingles','sq',125,30),
('roofing','Ice & Water Shield','Self-adhesive membrane','sq',95,30),
('roofing','Synthetic Underlayment','Full deck coverage','sq',45,30),
('roofing','Ridge Vent','Continuous ridge ventilation','linear_ft',8.5,30),
('roofing','Drip Edge','Aluminum drip edge flashing','linear_ft',3.5,30),
('roofing','Pipe Boot','Rubber pipe flashing','unit',35,30),
('roofing','Chimney Flashing','Step & counter flashing','unit',450,30),
-- SIDING
('siding','Vinyl Siding (Standard)','Standard grade vinyl','sqft',4.5,30),
('siding','Vinyl Siding (Premium)','Insulated vinyl siding','sqft',6.75,30),
('siding','James Hardie Fiber Cement','HardiePlank lap siding','sqft',9.5,30),
('siding','House Wrap','Tyvek or equivalent','sqft',0.85,30),
('siding','Soffit & Fascia','Aluminum soffit and fascia','linear_ft',12,30),
-- WINDOWS
('windows','Double Hung (Standard)','Vinyl double hung window','unit',350,30),
('windows','Double Hung (Premium)','Triple pane, low-E','unit',525,30),
('windows','Sliding Window','Horizontal sliding window','unit',375,30),
('windows','Picture Window','Fixed picture window','unit',400,30),
('windows','Bay Window','3-panel bay window','unit',1200,30),
-- GUTTERS
('gutters','5" K-Style Aluminum','Standard seamless gutter','linear_ft',8.5,30),
('gutters','6" K-Style Aluminum','Oversized seamless gutter','linear_ft',11,30),
('gutters','5" Half-Round Copper','Premium copper half-round','linear_ft',28,30),
('gutters','Downspout (2x3)','Standard aluminum downspout','unit',45,30),
('gutters','Downspout (3x4)','Oversized aluminum downspout','unit',65,30),
('gutters','Gutter Guard','Leaf protection system','linear_ft',6.5,30),
-- LABOR
('labor','Roofing Crew (per day)','Full roofing crew daily rate','unit',1800,0),
('labor','Siding Crew (per day)','Full siding crew daily rate','unit',1600,0),
('labor','Gutter Install (per day)','Gutter installation crew','unit',1200,0);

-- ══════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT — Schema y datos base listos
-- Siguiente paso: crear usuarios desde Authentication → Users
-- ══════════════════════════════════════════════════════════════════
