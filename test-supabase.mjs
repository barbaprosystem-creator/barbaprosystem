import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Using URL:", supabaseUrl);
console.log("Using Key (first 10 chars):", supabaseKey ? supabaseKey.substring(0, 10) : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const From = '+15023058421';
  const Body = 'Hola esto es un test local';
  let canal = 'sms';
  let telefonoCliente = From;
  
  try {
    console.log("Paso 1: Buscando cliente...");
    let { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', telefonoCliente)
      .maybeSingle();

    if (!cliente) {
      console.log("Creando cliente...");
      const { data: nuevoCliente, error: nuevoClienteError } = await supabase
        .from('clientes')
        .insert([{ 
          nombre: `Cliente ${telefonoCliente}`, 
          telefono: telefonoCliente 
        }])
        .select()
        .single();
        
      if (nuevoClienteError) throw nuevoClienteError;
      cliente = nuevoCliente;
    }
    console.log("Cliente OK:", cliente.id);

    console.log("Paso 2: Buscando conversacion...");
    let { data: conversacion, error: convError } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('canal', canal)
      .eq('estado', 'activa')
      .maybeSingle();

    if (!conversacion) {
      console.log("Creando conversacion...");
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
    console.log("Conversacion OK:", conversacion.id);

    console.log("Paso 3: Insertando mensaje...");
    const { error: msgError } = await supabase
      .from('mensajes')
      .insert([{
        conversacion_id: conversacion.id,
        direccion: 'inbound',
        contenido: Body,
        estado_entrega: 'entregado'
      }]);

    if (msgError) throw msgError;
    console.log("Todo insertado correctamente.");

  } catch (err) {
    console.error("ERROR CAPTURADO:", err);
  }
}

test();
