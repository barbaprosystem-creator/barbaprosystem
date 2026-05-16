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

    let isConversationEvent = !!body.EventType;
    const eventType = body.EventType as string;

    // Si es un evento de Conversation pero no es onMessageAdded, lo ignoramos
    if (isConversationEvent && eventType !== "onMessageAdded") {
      return new Response("Event not handled", { status: 200 });
    }

    // Extraer datos dependiendo si es Conversation API o Programmable Messaging
    const messageSid = (body.MessageSid || body.SmsSid) as string; 
    let conversationSid = body.ConversationSid as string || null; 
    const bodyText = body.Body as string;
    const author = (body.Author || body.From) as string; // 'From' viene en Programmable Messaging

    // Ignorar los mensajes salientes (outbound)
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
    } else if (author.startsWith("+")) {
      canal = "sms";
      identifier = author;
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // 2. Buscar o crear el Cliente en la tabla contacts
    let clienteId = null;
    
    // Normalizar el identificador para la búsqueda (ej. +15026587853 -> 5026587853)
    const cleanIdentifier = identifier.replace(/\D/g, '');
    const shortIdentifier = cleanIdentifier.length > 10 ? cleanIdentifier.slice(-10) : cleanIdentifier;

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id")
      .ilike("phone", `%${shortIdentifier}%`)
      .limit(1);
      
    if (contacts && contacts.length > 0) {
      clienteId = contacts[0].id;
    } else {
      // Registrar un nuevo lead en contacts si no existe
      const { data: newContact, error: insertError } = await supabase
        .from("contacts")
        .insert({ 
          first_name: "Nuevo", 
          last_name: "Lead", 
          phone: canal === 'whatsapp' || canal === 'sms' ? identifier : '', 
          source: canal,
          pipeline_status: 'new_lead'
        })
        .select("id")
        .single();
        
      if (insertError) {
        console.error("Error creating contact:", insertError);
      }
      clienteId = newContact?.id;
    }

    // 3. Buscar o crear la Conversación Activa
    let conversacionId = null;
    let conversacionData = null;

    if (conversationSid) {
      const { data } = await supabase
        .from("conversaciones")
        .select("id")
        .eq("twilio_conversation_sid", conversationSid)
        .single();
      conversacionData = data;
    } else if (clienteId) {
      // Si no tenemos ConversationSid (ej. Programmable Messaging), buscar por cliente_id
      const { data } = await supabase
        .from("conversaciones")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("canal", canal)
        .order("ultima_interaccion", { ascending: false })
        .limit(1)
        .single();
      conversacionData = data;
    }

    if (conversacionData) {
      conversacionId = conversacionData.id;
      // Actualizar timestamp de última interacción (renueva la ventana de 24h)
      await supabase.from("conversaciones")
        .update({ ultima_interaccion: new Date().toISOString() })
        .eq("id", conversacionId);
    } else {
      // Si no existe, la registramos
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
