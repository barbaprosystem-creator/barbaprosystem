import { supabase } from '../lib/supabase';

/**
 * Servicio para manejar la comunicación omnicanal a través de nuestras Edge Functions
 * 
 * NOTA DE ARQUITECTURA: Nunca llamamos a la API de Twilio directamente desde el frontend
 * para no exponer el Account SID y Auth Token. Llamamos a nuestra Edge Function 'send-message'.
 * 
 * Variables de entorno necesarias (en el backend/Edge Function):
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (El número de remitente de WhatsApp/SMS)
 */
export const twilioService = {
  /**
   * Envía un mensaje de texto estándar.
   * Válido si estamos dentro de la ventana de 24 horas (WhatsApp/Instagram/FB).
   * 
   * @param {string} conversacionId - UUID de la conversación en Supabase
   * @param {string} to - Número o ID de destino (ej: 'whatsapp:+123456789')
   * @param {string} mensaje - Contenido del mensaje de texto
   * @param {string} canal - 'whatsapp', 'instagram' o 'facebook'
   */
  async sendStandardMessage(conversacionId: string, to: string, mensaje: string, canal: string = 'whatsapp', clienteId?: string, senderId?: string) {
    try {
      // Invocamos la Edge Function que hablará con Twilio y guardará en la base de datos
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: { conversacionId, clienteId, to, mensaje, canal, tipo: 'standard', senderId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enviando mensaje estándar:', error);
      throw error;
    }
  },

  /**
   * Envía un "Template Message" preaprobado por Meta.
   * CRÍTICO: Se utiliza para iniciar una conversación nueva o responder después de que 
   * la ventana de 24 horas de WhatsApp haya expirado.
   * 
   * @param {string} conversacionId - UUID de la conversación en Supabase
   * @param {string} to - Número o ID de destino
   * @param {string} templateName - Nombre de la plantilla en Twilio (ej: 'cotizacion_lista')
   * @param {Record<string, string>} variables - Variables dinámicas (ej: { 1: 'Juan', 2: '12345' })
   * @param {string} clienteId - (Opcional) UUID del cliente, por si se necesita crear la conversación
   * @param {string} senderId - (Opcional) UUID del usuario emisor
   */
  async sendWhatsAppTemplate(conversacionId: string, to: string, templateName: string, variables: Record<string, string>, clienteId?: string, senderId?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: { 
          conversacionId,
          clienteId,
          to, 
          canal: 'whatsapp', 
          tipo: 'template',
          templateName,
          variables,
          senderId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enviando template de WhatsApp:', error);
      throw error;
    }
  }
};
