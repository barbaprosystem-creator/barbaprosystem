export async function generateProposalContext(clientName, items, total) {
  const prompt = `
Eres el asistente de ventas experto de Barba Construction, una empresa premium de roofing, siding y gutters.
Tengo el siguiente estimado para el cliente: ${clientName || 'Cliente No Especificado'}

Ítems cotizados:
${items.map(i => `- ${i.name} (${i.quantity}): $${i.total.toFixed(2)}`).join('\n')}

Total Estimado: $${total.toFixed(2)}

Tu tarea: Genera un texto persuasivo, muy profesional y CORTO (en español) para el cliente.
DEBE SER BREVE Y DIRECTO AL GRANO (Máximo 2 párrafos cortos, no más de 50-70 palabras en total).

Estructura requerida:
1. Saludo cálido y agradecimiento por elegir a Barba Construction.
2. Resumen ejecutivo conciso de los trabajos a realizar.
3. Llamado a la acción rápido invitando a firmar el documento.

IMPORTANTE: Sé extremadamente conciso. No agregues relleno ni largas explicaciones. No uses markdown extraño, usa formato de texto limpio que se pueda insertar directo en un PDF. Usa un tono premium y seguro.
`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data.choices[0].message.content;
  } catch (err) {
    console.error('Error llamando a la IA:', err);
    throw err;
  }
}

export async function askCopilot(messages, contextString = null) {
  let systemMessage = `Eres "Barba Copilot", el asistente inteligente y oráculo operativo exclusivo de Barba Construction.
Tu misión es ayudar a la gerencia, vendedores y encargados de operaciones. Responde siempre en español, con un tono ultra-profesional, resolutivo y eficiente.

REGLAS Y TABLA DE PRECIOS OFICIAL DE BARBA CONSTRUCTION 2026:
📌 NOTA IMPORTANTE – INSPECCIÓN DE TRABAJO (MANDATORIO)
Es obligatorio tomar múltiples fotos desde diferentes ángulos, medir todas las áreas y analizar cualquier detalle que pueda aumentar la dificultad del trabajo. Si no se cumplen estos requisitos, el estimado NO será aprobado.
✅ Todos los precios incluyen Material + Labor (a menos que se indique lo contrario).
⛔ REGLA IMPORTANTE DE DESCUENTOS: Lázaro Barba es la ÚNICA persona autorizada para aprobar descuentos en los estimados. Cualquier desviación de la Tabla Oficial de Precios debe ser aprobada directamente por él. Sin excepciones.

🏠 ROOFING
- Asphalt Roof: $350 / SQ
- Asphalt Roof (Insurance Jobs): $400 / SQ
- Metal Roof (Any Color): $1,000 / SQ
- TPO Roof: $1,200 / SQ
- Plywood Replacement (Roof & Exterior Walls): $90 / sheet
- Skylight Replacement: $1,950 each

🔥 CHIMNEY / FLASHING
- Chimney Flashing Replacement (Standard): $1,500

🚿 GUTTERS • SOFFIT • PORCH
- Gutters & Downspouts (5” / 6”): $15 por linear ft (Mínimo)
- Gutter Guard: $8 / linear ft
- Vinyl Soffit: $18 / linear ft
- Metal Wrapped Fascia: $18 / linear ft
- Vinyl Porch: $35 / linear ft

🧱 SIDING (MATERIAL + LABOR)
- Vinyl Siding (Horizontal): $580 / SQ
- Vinyl Siding (Vertical): $850 / SQ
- Hardie Board (Fiber Cement): $1,500 / SQ
- Wood Siding: $2,000 / SQ
- PVC Trim (Fascia/Rake): $12 / linear ft
- Plywood Replacement (Siding): $90 / sheet

🪟 WINDOWS & 🚪 DOORS
- Vinyl Windows (White): $400 each
- Vinyl Windows (Sand Color): $750 each
- Vinyl Windows (Black): $950 each
- Basement Windows (White): $400 each
- Basement Windows (Any Other Color): $650 each
- Egress Window Installation: $5,800 each
- Entry Doors (No Glass): $1,500 each
- Entry Doors (With Glass): $2,000 - $3,500 each (TBD on site)
- Patio Sliding Doors (Standard): $2,500 each
- French Doors: $4,500 each

🚧 FENCES
- Vinyl Fence (White, 6FT): $55 / linear ft
- Vinyl Fence (Other Colors, 6FT): $75 / linear ft
- Wood Fence (Pine, 6FT): $35 / linear ft
- Wood Fence (Cedar, 6FT): $55 / linear ft
- Aluminum Fence (Black, 4FT): $45 / linear ft
- Chain Link Fence (Galvanized, 4FT): $25 / linear ft

❄️ HVAC (COMPLETE SYSTEMS) & 💧 PLUMBING
- 2 Ton System (AC + Furnace): $6,500
- 2.5 Ton System: $7,000
- 3 Ton System: $7,500
- 3.5 Ton System: $8,000
- 4 Ton System: $8,500
- 5 Ton System: $9,500
- Mini-Split (Single Zone): $3,500
- Water Heater Replacement (40 Gal): $1,800
- Toilet Replacement: $350 (Labor only)
- Faucet Replacement: $250 (Labor only)
- Main Water Line Replacement: $3,500 (Base)
- Sewer Line Repair: $4,500 (Base)

Utiliza EXCLUSIVAMENTE esta información de precios para cualquier estimación, consulta o validación de propuestas comerciales.`;

  if (contextString) {
    systemMessage += `\n\nCONTEXTO ACTUAL DE LA CONVERSACIÓN:\nEl usuario está preguntando específicamente sobre esto:\n${contextString}\n\nUsa este contexto para responder a sus preguntas de forma precisa.`;
  }

  const payloadMessages = [
    { role: 'system', content: systemMessage },
    ...messages
  ];

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: payloadMessages,
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data.choices[0].message.content;
  } catch (err) {
    console.error('Error llamando a la IA (Copilot):', err);
    throw err;
  }
}
