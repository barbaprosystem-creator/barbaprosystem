import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER"); // Ej: whatsapp:+1234567890
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejo de preflight CORS (OPCIONES)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversacionId, clienteId, to, mensaje, canal = 'whatsapp', tipo, templateName, variables } = await req.json();
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    let activeConversacionId = conversacionId;
    let twilioConversationSid = null;

    // Buscar la conversación si no se proporcionó
    if (!activeConversacionId && clienteId) {
      const { data: conv } = await supabase
        .from("conversaciones")
        .select("id, twilio_conversation_sid")
        .eq("cliente_id", clienteId)
        .eq("canal", canal)
        .eq("estado", "activa")
        .single();
        
      if (conv) {
        activeConversacionId = conv.id;
        twilioConversationSid = conv.twilio_conversation_sid;
      }
    } else if (activeConversacionId) {
      const { data: conv } = await supabase
        .from("conversaciones")
        .select("twilio_conversation_sid")
        .eq("id", activeConversacionId)
        .single();
      twilioConversationSid = conv?.twilio_conversation_sid;
    }

    const authHeader = 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    // Si todavía no tenemos twilioConversationSid, tenemos que crearlo en Twilio primero
    if (!twilioConversationSid) {
      // 1. Crear Conversation en Twilio
      const createConvRes = await fetch(`https://conversations.twilio.com/v1/Conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        },
        body: new URLSearchParams({ FriendlyName: `Chat con ${clienteId}` }).toString()
      });
      const convData = await createConvRes.json();
      if (!createConvRes.ok) throw new Error(`Twilio Create Conv Error: ${convData.message}`);
      twilioConversationSid = convData.sid;

      // 2. Añadir Participante
      let participantBody = new URLSearchParams();
      participantBody.append('MessagingBinding.Address', to); // Ej: whatsapp:+1234567890 o ig_id
      participantBody.append('MessagingBinding.ProxyAddress', twilioPhoneNumber!); // El número de Twilio
      
      const addPartRes = await fetch(`https://conversations.twilio.com/v1/Conversations/${twilioConversationSid}/Participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        },
        body: participantBody.toString()
      });
      const partData = await addPartRes.json();
      if (!addPartRes.ok) throw new Error(`Twilio Add Participant Error: ${partData.message}`);

      // 3. Guardar en Supabase
      if (!activeConversacionId) {
        const { data: nuevaConv } = await supabase
          .from("conversaciones")
          .insert({ 
            cliente_id: clienteId, 
            canal: canal,
            twilio_conversation_sid: twilioConversationSid
          })
          .select("id")
          .single();
        activeConversacionId = nuevaConv?.id;
      } else {
        await supabase.from("conversaciones")
          .update({ twilio_conversation_sid: twilioConversationSid })
          .eq("id", activeConversacionId);
      }
    }

    let twilioBody = new URLSearchParams();
    // En Conversations API, Twilio sabe a quién mandarlo por los participantes.
    twilioBody.append('Author', 'system'); // Identificador de nuestro sistema
    
    let textToSend = mensaje;
    if (tipo === 'template') {
      // Para un uso en producción complejo con Twilio Content API:
      // twilioBody.append('ContentSid', templateName);
      // twilioBody.append('ContentVariables', JSON.stringify(variables));
      textToSend = `Hola, tu ${templateName} está lista.`;
    }
    
    twilioBody.append('Body', textToSend);

    // Llamada a la API de Twilio Conversations para crear el mensaje
    const twilioUrl = `https://conversations.twilio.com/v1/Conversations/${twilioConversationSid}/Messages`;
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: twilioBody.toString()
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(`Twilio Msg Error: ${twilioData.message}`);
    }

    // Insertar el mensaje saliente (outbound) en Supabase
    await supabase.from("mensajes").insert({
      conversacion_id: activeConversacionId,
      direccion: "outbound",
      contenido: tipo === 'template' ? `[Plantilla: ${templateName}]` : mensaje,
      twilio_message_sid: twilioData.sid,
      estado_entrega: 'enviado'
    });

    // Actualizar la última interacción
    await supabase.from("conversaciones")
      .update({ ultima_interaccion: new Date().toISOString() })
      .eq("id", activeConversacionId);

    return new Response(
      JSON.stringify({ success: true, sid: twilioData.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
