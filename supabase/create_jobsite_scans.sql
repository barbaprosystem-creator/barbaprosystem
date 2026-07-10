-- Create jobsite_scans table
CREATE TABLE IF NOT EXISTS public.jobsite_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scan_type TEXT DEFAULT 'room', -- 'room', 'exterior', 'siding'
    wall_area_sqft NUMERIC DEFAULT 0,
    floor_area_sqft NUMERIC DEFAULT 0,
    perimeter_ft NUMERIC DEFAULT 0,
    window_count INT DEFAULT 0,
    door_count INT DEFAULT 0,
    raw_data_json JSONB, -- stores structural USDZ details or room dimensions
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.jobsite_scans ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create
DROP POLICY IF EXISTS "authenticated_all" ON public.jobsite_scans;
CREATE POLICY "authenticated_all" ON public.jobsite_scans
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
