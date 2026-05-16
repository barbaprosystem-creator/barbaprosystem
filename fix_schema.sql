-- Drop old data to avoid foreign key violations
DELETE FROM public.mensajes;
DELETE FROM public.conversaciones;

-- Drop foreign key constraint on conversaciones
ALTER TABLE public.conversaciones
DROP CONSTRAINT IF EXISTS conversaciones_cliente_id_fkey;

-- Make sure conversations point to contacts(id)
ALTER TABLE public.conversaciones
ADD CONSTRAINT conversaciones_cliente_id_fkey
FOREIGN KEY (cliente_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Drop the unused clientes table
DROP TABLE IF EXISTS public.clientes CASCADE;
