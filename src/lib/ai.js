export async function generateProposalContext(clientName, items, total, language = 'es') {
  const langName = language === 'en' ? 'Inglés' : 'Español';
  const prompt = `
Eres el asistente de ventas experto de Barba Construction, una empresa premium de roofing, siding y gutters.
Genera un "Scope of Work" para el cliente: ${clientName || 'Cliente No Especificado'}

Ítems cotizados:
${items.map(i => `- ${i.name} (${i.quantity}): $${i.total.toFixed(2)}`).join('\n')}

Total Estimado: $${total.toFixed(2)}

REGLAS DE FORMATO (Barba Construction Style Guidelines):
1. Tono: Profesional, limpio, conciso y orientado al cliente.
2. Idioma: Escribe toda la propuesta estrictamente en ${langName}.
3. Precios: NO desglose precios individuales. El documento solo debe mostrar el precio total al final a menos que el usuario indique lo contrario.
4. Garantía: Siempre incluir "2-year labor warranty by Barba Construction" y mencionar la garantía del fabricante para materiales.
5. Inclusiones: Siempre incluye remoción de escombros (haul-off), cleanup, final inspection.
6. Exclusiones: Excluye daños estructurales ocultos (como madera podrida adicional no cotizada) y permisos.

LÓGICA POR SERVICIO (Aplica si detectas estos ítems):
- Roofing: Incluye "Remove existing roofing down to decking", "Synthetic underlayment", "Ice and water shield", "Drip edge", "Starter shingles", "Proper sealing of penetrations".
- Gutters: Incluye "Proper slope", "Seal joints", "Evaluate water flow".
- Siding: Incluye "House wrap/moisture barrier", "Seal transitions", "Install J-channel & trim".
- Windows: Incluye "Proper flashing tape", "Insulate and seal gaps", "Premium exterior caulking".

ESTRUCTURA ESTRICTA DEL DOCUMENTO A GENERAR (Usa este formato):
1. Project Description (Resumen ejecutivo corto)
2. Scope of Work (Detalle técnico de los ítems cotizados basado en las reglas de arriba)
3. Included (Lo que incluye el servicio por defecto)
4. Not Included / Exclusions (Lo excluido por defecto)
5. Warranty (Garantía)

IMPORTANTE: Sé extremadamente preciso. No agregues relleno. NO uses Markdown como **asteriscos** porque se verá mal en el PDF, usa texto plano estructurado.
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

export async function refineProposalContext(currentText, instructions) {
  const prompt = `
Eres el asistente de ventas experto de Barba Construction.
Aquí tienes el borrador actual de la propuesta de un cliente:

--- INICIO DEL BORRADOR ---
${currentText}
--- FIN DEL BORRADOR ---

El vendedor ha solicitado la siguiente modificación o ajuste:
"${instructions}"

Por favor, reescribe el borrador aplicando EXACTAMENTE lo que pide el vendedor, pero manteniendo el tono profesional, limpio y la estructura original. 
Devuelve ÚNICAMENTE el texto de la propuesta modificada, sin saludos ni comentarios extras. NO uses formato Markdown (como **asteriscos**), usa texto plano estructurado.
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
export async function extractReceiptData(base64Image, mimeType) {
  const prompt = `
Eres un asistente de contabilidad especializado en analizar recibos y facturas de construcción.
Extrae la siguiente información de la imagen proporcionada y devuélvela en un objeto JSON estricto:
- total: el monto total a pagar o pagado (solo el número, sin símbolo de dólar).
- vendor: el nombre de la tienda, proveedor o contratista (ej. Home Depot, Lowe's, ABC Supply).
- date: la fecha de la factura en formato YYYY-MM-DD.
- items: un arreglo de strings con los nombres cortos de los ítems principales comprados (máximo 5 ítems).

Formato de salida esperado (solo JSON, nada de markdown ni explicaciones):
{
  "total": "150.25",
  "vendor": "Home Depot",
  "date": "2026-05-07",
  "items": ["Madera 2x4", "Clavos", "Pintura"]
}
`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    const content = data.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parseando JSON de la IA:', content);
      throw new Error('La respuesta de la IA no contenía JSON válido.');
    }
  } catch (err) {
    console.error('Error extrayendo datos del recibo:', err);
    throw err;
  }
}
