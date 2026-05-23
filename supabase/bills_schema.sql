CREATE TABLE IF NOT EXISTS office_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  amount numeric DEFAULT 0,
  payment_url text,
  login_user text,
  login_password text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_autos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  vin text,
  insurance_number text,
  insurance_amount numeric DEFAULT 0,
  insurance_photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('bill', 'auto')),
  target_id uuid NOT NULL,
  amount_paid numeric NOT NULL,
  paid_on date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Permisos (Como no tendra PIN, el administrador lo usara estando autenticado en la app, 
-- pero para asegurar que el React pueda leerlo, pondremos politicas publicas o autenticadas)
CREATE POLICY "Allow authenticated read bills" ON public.office_bills FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert bills" ON public.office_bills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated update bills" ON public.office_bills FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete bills" ON public.office_bills FOR DELETE TO public USING (true);

CREATE POLICY "Allow authenticated read autos" ON public.company_autos FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert autos" ON public.company_autos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated update autos" ON public.company_autos FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete autos" ON public.company_autos FOR DELETE TO public USING (true);

CREATE POLICY "Allow authenticated read bill_payments" ON public.bill_payments FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert bill_payments" ON public.bill_payments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow authenticated delete bill_payments" ON public.bill_payments FOR DELETE TO public USING (true);

ALTER TABLE public.office_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_autos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
