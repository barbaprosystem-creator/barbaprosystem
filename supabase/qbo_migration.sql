-- Agregar columnas para la integración de QuickBooks
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS qbo_customer_id TEXT;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_invoice_id TEXT;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_invoice_number TEXT;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS qbo_estimate_id TEXT;
