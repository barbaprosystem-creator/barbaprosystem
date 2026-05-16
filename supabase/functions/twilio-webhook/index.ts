import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Variables de entorno necesarias en Supabase
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Bypass de RLS para el webhook

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Twilio Conversations Webhooks envían los datos como x-www-form-urlencoded
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());

    const eventType = body.EventType as string;

    // Solo nos interesan los mensajes nuevos
    if (eventType !== "onMessageAdded") {
      return new Response("Event not handled", { status: 200 });
    }

    const conversationSid = body.ConversationSid as string; // Ej: CHxxxx...
    const messageSid = body.MessageSid as string; // Ej: IMxxxx...
    const bodyText = body.Body as string;
    const author = body.Author as string; // Ej: whatsapp:+1234567890 o ig:12345

    // Ignorar los mensajes salientes (outbound) que nosotros mismos enviamos a través de la API
    // Para evitar un bucle infinito en Realtime.
    // Twilio suele identificar al sistema por el número o sin Author.
    if (!author || author.includes("system") || author === Deno.env.get("TWILIO_PHONE_NUMBER")) {
      return new Response("Ignored outbound message", { status: 200 });
    }

    // 1. Estandarizar datos y detectar canal a partir del Author
    let canal = "unknown";
    let identifier = author;
    
    if (author.startsWith("whatsapp:")) {
      canal = "whatsapp";
      identifier = author.replace("whatsapp:", "");
    } else if (author.startsWith("ig:")) {
      canal = "instagram";
      identifier = author.replace("ig:", "");
    } else if (author.startsWith("messenger:")) {
      canal = "facebook";
      identifier = author.replace("messenger:", "");
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // 2. Buscar o crear el Cliente
    let clienteId = null;
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .or(`telefono.eq.${identifier},instagram_id.eq.${identifier},facebook_id.eq.${identifier}`)
      .single();
      
    if (cliente) {
      clienteId = cliente.id;
    } else {
      // Registrar un nuevo prospecto si no existe
      const field = canal === 'whatsapp' ? 'telefono' : (canal === 'instagram' ? 'instagram_id' : 'facebook_id');
      const { data: nuevoCliente } = await supabase
        .from("clientes")
        .insert({ nombre: "Nuevo Lead", [field]: identifier })
        .select("id")
        .single();
      clienteId = nuevoCliente?.id;
    }

    // 3. Buscar o crear la Conversación Activa, ahora utilizando el ConversationSid
    let conversacionId = null;
    const { data: conversacion } = await supabase
      .from("conversaciones")
      .select("id")
      .eq("twilio_conversation_sid", conversationSid)
      .single();

    if (conversacion) {
      conversacionId = conversacion.id;
      // Actualizar timestamp de última interacción (renueva la ventana de 24h)
      await supabase.from("conversaciones")
        .update({ ultima_interaccion: new Date().toISOString() })
        .eq("id", conversacionId);
    } else {
      // Si no existe (Twilio la auto-creó), la registramos
      const { data: nuevaConv } = await supabase
        .from("conversaciones")
        .insert({ 
          cliente_id: clienteId, 
          canal: canal,
          twilio_conversation_sid: conversationSid 
        })
        .select("id")
        .single();
      conversacionId = nuevaConv?.id;
    }

    // 4. Insertar el Mensaje Limpio (Esto disparará Supabase Realtime)
    await supabase.from("mensajes").insert({
      conversacion_id: conversacionId,
      direccion: "inbound",
      contenido: bodyText,
      twilio_message_sid: messageSid,
      estado_entrega: "entregado"
    });

    // Respuesta limpia para Twilio Conversations
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Error procesando webhook de Twilio:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
