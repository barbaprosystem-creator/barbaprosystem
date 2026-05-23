-- Create Tables
CREATE TABLE IF NOT EXISTS showroom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS showroom_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES showroom_categories(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE showroom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to everyone for showroom_categories" ON showroom_categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow full access to authenticated for showroom_categories" ON showroom_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to everyone for showroom_images" ON showroom_images FOR SELECT TO public USING (true);
CREATE POLICY "Allow full access to authenticated for showroom_images" ON showroom_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('showroom', 'showroom', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for showroom
CREATE POLICY "Public Access for showroom bucket" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'showroom');

CREATE POLICY "Authenticated users can upload to showroom" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'showroom');

CREATE POLICY "Authenticated users can update showroom" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'showroom');

CREATE POLICY "Authenticated users can delete showroom" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'showroom');
