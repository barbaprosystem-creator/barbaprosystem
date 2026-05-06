-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE (ddwyutisxymuvofkjhpz)
-- Esto creará 2 clientes, 2 estimados aprobados y 2 proyectos reales en producción para que el dashboard funcione.

-- 1. Crear Contactos
INSERT INTO public.contacts (id, first_name, last_name, email, phone, address, city, state, zip, source, pipeline_status, lead_quality)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Juan', 'Pérez', 'juan.perez@example.com', '555-0101', '123 Main St', 'Houston', 'TX', '77001', 'web', 'closed_won', 'hot'),
  ('22222222-2222-2222-2222-222222222222', 'María', 'García', 'maria.garcia@example.com', '555-0202', '456 Oak Ln', 'Houston', 'TX', '77002', 'referral', 'closed_won', 'warm')
ON CONFLICT (id) DO NOTHING;

-- 2. Crear Estimados Aprobados
INSERT INTO public.estimates (id, contact_id, status, work_type, subtotal, grand_total, scope_of_work)
VALUES 
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'approved', 'Roofing', 12000, 12500, 'Reemplazo completo de techo con GAF Timberline HDZ'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'approved', 'Siding', 8500, 8900, 'Instalación de Vinyl Siding en toda la casa')
ON CONFLICT (id) DO NOTHING;

-- 3. Crear Proyectos
INSERT INTO public.projects (contact_id, estimate_id, title, status, progress_pct, start_date, target_end_date, sold_price, address, notes)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Residencia Familia Pérez - Techo', 'in_progress', 60, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 12500, '123 Main St, Houston, TX 77001', 'El cliente solicitó cuidado extra con las plantas del jardín frontal.'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Renovación Siding María García', 'scheduled', 0, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '10 days', 8900, '456 Oak Ln, Houston, TX 77002', 'Brigada asignada para el próximo lunes.');
