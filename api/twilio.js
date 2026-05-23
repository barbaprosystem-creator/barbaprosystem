import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase usando las variables de entorno de Vercel/Locales
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// IMPORTANTE: Para insertar y crear clientes desde el backend, idealmente usamos el SERVICE_ROLE_KEY
// Si no está, usamos la ANON_KEY, pero las políticas de RLS deben permitir inserciones.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Twilio envía datos por defecto en application/x-www-form-urlencoded
    const { From, To, Body, MessageSid, MediaUrl0 } = req.body;
    
    if (!From || !Body) {
      console.warn('Webhook recibido sin datos de From o Body');
      return res.status(400).send('Faltan datos requeridos');
    }

    // 1. Identificar el canal (WhatsApp o SMS)
    let canal = 'sms';
    let telefonoCliente = From;
    
    // Twilio manda los mensajes de WhatsApp con el prefijo "whatsapp:"
    if (From.startsWith('whatsapp:')) {
      canal = 'whatsapp';
      telefonoCliente = From.replace('whatsapp:', '');
    }

    // 2. Buscar si el cliente ya existe en Supabase (tabla contacts)
    let { data: cliente, error: clienteError } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', telefonoCliente)
      .maybeSingle(); // maybeSingle para que no tire error si no hay ninguno

    // Si no existe, crear el cliente
    if (!cliente) {
      const { data: nuevoCliente, error: nuevoClienteError } = await supabase
        .from('contacts')
        .insert([{ 
          first_name: 'Nuevo',
          last_name: `Contacto ${telefonoCliente}`,
          phone: telefonoCliente 
        }])
        .select()
        .single();
        
      if (nuevoClienteError) {
        console.error('Error creando cliente:', nuevoClienteError);
        throw nuevoClienteError;
      }
      cliente = nuevoCliente;
    }

    // 3. Buscar o Crear una Conversación Activa
    let { data: conversacion, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('canal', canal)
      .eq('estado', 'activa')
      .maybeSingle();

    if (!conversacion) {
      // Crear nueva conversación
      const { data: nuevaConv, error: nuevaConvError } = await supabase
        .from('conversaciones')
        .insert([{ 
          cliente_id: cliente.id, 
          canal: canal,
          estado: 'activa'
        }])
        .select()
        .single();
        
      if (nuevaConvError) {
        console.error('Error creando conversación:', nuevaConvError);
        throw nuevaConvError;
      }
      conversacion = nuevaConv;
    } else {
      // Actualizar la fecha de última interacción
      await supabase
        .from('conversaciones')
        .update({ ultima_interaccion: new Date().toISOString() })
        .eq('id', conversacion.id);
    }

    // 4. Insertar el Mensaje en la base de datos
    const { error: msgError } = await supabase
      .from('mensajes')
      .insert([{
        conversacion_id: conversacion.id,
        direccion: 'inbound', // Mensaje que entra del cliente hacia nosotros
        contenido: Body,
        media_url: MediaUrl0 || null,
        twilio_message_sid: MessageSid,
        estado_entrega: 'entregado'
      }]);

    if (msgError) {
      console.error('Error insertando mensaje:', msgError);
      throw msgError;
    }

    console.log(`Mensaje entrante guardado. De: ${telefonoCliente}, Canal: ${canal}`);

    // 5. Responder a Twilio con un TwiML vacío. 
    // Esto es muy importante para que Twilio sepa que recibimos el mensaje y no envíe un error al usuario.
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('Error procesando webhook de Twilio:', error);
    // Aunque falle nuestro backend, le respondemos 200 a Twilio para que no siga reintentando infinitamente
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}
