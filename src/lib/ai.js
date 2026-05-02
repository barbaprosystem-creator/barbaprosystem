export async function generateProposalContext(clientName, items, total) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta el Token: VITE_OPENAI_API_KEY no está configurado en tu archivo .env');
  }

  const prompt = `
Eres el asistente de ventas experto de Barba Construction, una empresa premium de roofing, siding y gutters.
Tengo el siguiente estimado para el cliente: ${clientName || 'Cliente No Especificado'}

Ítems cotizados:
${items.map(i => `- ${i.name} (${i.quantity}): $${i.total.toFixed(2)}`).join('\n')}

Total Estimado: $${total.toFixed(2)}

Tu tarea: Genera un texto persuasivo y muy profesional (en español) para el cliente, estructurado en:
1. Un saludo cálido y agradecimiento por elegir a Barba Construction.
2. Resumen ejecutivo de lo que se va a hacer (basado en los ítems, pero explicado de forma elegante).
3. Nuestra Garantía de Calidad y compromiso de excelencia profesional.
4. Un llamado a la acción invitando a firmar este documento y realizar el pago inicial.

No uses markdown extraño, usa formato de texto limpio que se pueda insertar directo en un PDF. Usa un tono premium, seguro y confiable.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.choices[0].message.content;
  } catch (err) {
    console.error('Error llamando a la IA:', err);
    throw err;
  }
}
