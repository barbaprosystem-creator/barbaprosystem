-- Ejecuta esto en el SQL Editor de Supabase
ALTER TABLE estimates 
ADD COLUMN contract_payment_terms text,
ADD COLUMN contract_company_sig text,
ADD COLUMN contract_customer_sig text,
ADD COLUMN contract_date text,
ADD COLUMN contract_signed_at timestamptz;
