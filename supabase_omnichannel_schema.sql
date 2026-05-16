-- 1. Tabla de Clientes (Soporte Omnicanal)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono TEXT, -- WhatsApp (con código de país ej: +1234567890)
    instagram_id TEXT, -- Instagram ID
    facebook_id TEXT, -- Messenger ID
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Conversaciones (Agrupa sesiones por canal)
CREATE TABLE IF NOT EXISTS public.conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'instagram', 'facebook')),
    twilio_conversation_sid TEXT UNIQUE,
    estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'cerrada')),
    ultima_interaccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Mensajes
CREATE TABLE IF NOT EXISTS public.mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID REFERENCES public.conversaciones(id) ON DELETE CASCADE,
    direccion TEXT NOT NULL CHECK (direccion IN ('inbound', 'outbound')), -- inbound: cliente a empresa, outbound: empresa a cliente
    contenido TEXT,
    media_url TEXT,
    twilio_message_sid TEXT UNIQUE,
    estado_entrega TEXT DEFAULT 'enviado', -- enviado, entregado, leido, fallido
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Los empleados (usuarios autenticados) pueden gestionar todo
CREATE POLICY "Empleados gestionan clientes" ON public.clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Empleados gestionan conversaciones" ON public.conversaciones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Empleados gestionan mensajes" ON public.mensajes FOR ALL USING (auth.role() = 'authenticated');

-- CRÍTICO: Habilitar Supabase Realtime para recibir updates en el Frontend
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversaciones;
