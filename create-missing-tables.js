const BASE = 'https://ddwyutisxymuvofkjhpz.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3l1dGlzeHltdXZvZmtqaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MzM5NSwiZXhwIjoyMDkyNjI5Mzk1fQ.cJQgzQsy1TUa4Yk01qkBedrmM8HxYqnH3VqzVLKpUDY';
const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function runSQL(label, sql) {
  const res = await fetch(`${BASE}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql })
  });
  // Use pg REST approach instead - direct SQL via Supabase Management API isn't available this way
  // We'll use a different approach
}

// Since we can't run raw SQL easily via REST, let's use a workaround
// by creating a script that outputs the SQL to run manually
const sql = `
-- ================================================
-- MISSING TABLES FOR BARBA CRM
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. BRIGADES (Work crews)
CREATE TABLE IF NOT EXISTS brigades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  supervisor_id UUID REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BRIGADE_MEMBERS
CREATE TABLE IF NOT EXISTS brigade_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brigade_id UUID REFERENCES brigades(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'worker',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECT_MATERIALS
CREATE TABLE IF NOT EXISTS project_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  unit_price NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CALENDAR_TOKENS (Google Calendar OAuth)
CREATE TABLE IF NOT EXISTS calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS (for catalog/POS)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SERVICES (for estimator)
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'sq ft',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE brigades ENABLE ROW LEVEL SECURITY;
ALTER TABLE brigade_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (adjust as needed)
CREATE POLICY "Allow authenticated" ON brigades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated" ON brigade_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated" ON project_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated" ON calendar_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow service_role (backend API) full access
CREATE POLICY "Service role full access" ON brigades FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON brigade_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON project_materials FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON calendar_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON services FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT 'All missing tables created successfully!' as result;
`;

console.log(sql);
