import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Using URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const From = '+15023058421';
  const Body = 'Test SMS bug canal';
  let canal = 'sms';
  let telefonoCliente = From;
  
  try {
    let { data: cliente, error: clienteError } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', telefonoCliente)
      .maybeSingle();

    if (!cliente) {
      console.log("Creando cliente...");
      const { data: nuevoCliente, error: nuevoClienteError } = await supabase
        .from('contacts')
        .insert([{ 
          first_name: 'Test', 
          last_name: 'User',
          phone: telefonoCliente 
        }])
        .select()
        .single();
        
      if (nuevoClienteError) throw nuevoClienteError;
      cliente = nuevoCliente;
    }

    console.log("Creando conversacion con canal:", canal);
    let { data: conversacion, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('canal', canal)
      .eq('estado', 'activa')
      .maybeSingle();

    if (!conversacion) {
      const { data: nuevaConv, error: nuevaConvError } = await supabase
        .from('conversaciones')
        .insert([{ 
          cliente_id: cliente.id, 
          canal: canal,
          estado: 'activa'
        }])
        .select()
        .single();
        
      if (nuevaConvError) throw nuevaConvError;
      conversacion = nuevaConv;
    }
    
    console.log("Insertando mensaje...");
    const { error: msgError } = await supabase
      .from('mensajes')
      .insert([{
        conversacion_id: conversacion.id,
        direccion: 'inbound',
        contenido: Body,
        estado_entrega: 'entregado'
      }]);

    if (msgError) throw msgError;
    console.log("EXITO!");

  } catch (err) {
    console.error("ERROR CAPTURADO:", err);
  }
}

test();
