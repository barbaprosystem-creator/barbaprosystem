import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase con Service Role (permisos de admin para backend)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Resend Inbound Webhook payload
    const payload = req.body;
    
    // Extract data from standard or Resend format
    const emailData = payload.data ? payload.data : payload;
    
    const fromAddressRaw = emailData.from || '';
    const subject = emailData.subject || 'Sin asunto';
    const textBody = emailData.text || emailData.html || 'Mensaje vacío';

    // Extract raw email address (e.g. "John Doe <john@doe.com>" -> "john@doe.com")
    const emailMatch = fromAddressRaw.match(/<([^>]+)>/);
    const senderEmail = emailMatch ? emailMatch[1].trim() : fromAddressRaw.trim();

    if (!senderEmail) {
      return res.status(400).send('No sender email found');
    }

    // 1. Buscar o Crear Cliente
    let { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', senderEmail)
      .single();

    if (!contact) {
      const nameMatch = fromAddressRaw.match(/^([^<]+)/);
      const possibleName = nameMatch ? nameMatch[1].trim() : 'Nuevo';

      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([{
          email: senderEmail,
          first_name: possibleName || 'Nuevo Cliente',
          pipeline_status: 'new_lead'
        }])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error insertando nuevo cliente desde email:', insertError);
        return res.status(500).send('Error creating client');
      }
      contact = newContact;
    }

    // 2. Buscar o Crear Conversación de Email Activa
    let { data: conversation } = await supabase
      .from('conversaciones')
      .select('id')
      .eq('cliente_id', contact.id)
      .eq('canal', 'email')
      .eq('estado', 'activa')
      .single();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('conversaciones')
        .insert([{
          cliente_id: contact.id,
          canal: 'email',
          estado: 'activa'
        }])
        .select()
        .single();
        
      if (convError) {
        console.error('Error creando conversación de email:', convError);
        return res.status(500).send('Error creating conversation');
      }
      conversation = newConv;
    }

    // 3. Insertar Mensaje con Asunto Prepended
    const contentToSave = `**Asunto: ${subject}**\n\n${textBody}`;

    const { error: msgError } = await supabase
      .from('mensajes')
      .insert([{
        conversacion_id: conversation.id,
        direccion: 'inbound',
        contenido: contentToSave,
        estado_entrega: 'entregado'
      }]);

    if (msgError) {
      console.error('Error insertando mensaje de email:', msgError);
      return res.status(500).send('Error inserting message');
    }

    // Update conversation timestamp
    await supabase
      .from('conversaciones')
      .update({ ultima_interaccion: new Date().toISOString() })
      .eq('id', conversation.id);

    return res.status(200).json({ success: true, message: 'Email processed successfully' });
  } catch (error) {
    console.error('Error en webhook de email:', error);
    return res.status(500).send('Internal Server Error');
  }
}
