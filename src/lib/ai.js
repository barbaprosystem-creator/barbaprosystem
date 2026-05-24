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

export async function analyzeMarketPrices(items) {
  const prompt = `
Eres un experto estimador de construcción y analista de costos en Kentucky, Estados Unidos.
Te voy a dar una lista de servicios y materiales de construcción de una empresa. 
Para cada ítem, estima cuál es el "Precio de Mercado Promedio Actual" de VENTA al cliente final (incluyendo labor, materiales y ganancias típicas) en el estado de Kentucky, según la unidad solicitada (ej. por "sq" para techos, "linear_ft" para gutters, "each" para ventanas).

Devuelve ÚNICAMENTE un objeto JSON válido donde la clave sea el ID del ítem y el valor sea tu precio estimado en número (sin símbolos de dólar ni comas).
Ejemplo: {"1234-5678": 350.50, "9876-5432": 15.00}

No incluyas explicaciones, saludos ni bloques de código (como \`\`\`json), SOLO el JSON crudo y válido.

Ítems a analizar:
${items.map(i => `ID: ${i.id} | Categoría: ${i.category} | Ítem: ${i.item_name} ${i.description ? '('+i.description+')' : ''} | Unidad: ${i.unit_type}`).join('\n')}
`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    let text = data.choices[0].message.content.trim();
    
    // Extract JSON using regex in case there is surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("La IA no devolvió un formato JSON válido.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Error analizando mercado:', err);
    throw err;
  }
}

export async function askCopilot(messages, contextString = null) {
  let systemMessage = `Eres "Barba Copilot", el asistente inteligente y oráculo operativo exclusivo de Barba Construction.
Tu misión es ayudar a la gerencia, vendedores y encargados de operaciones. Responde siempre en español, con un tono ultra-profesional, resolutivo y eficiente.

BARBA CONSTRUCTION – OFFICIAL PRICE TABLE 2026
📌 
IMPORTANT NOTE – JOBSITE INSPECTION
It is mandatory to take multiple photos 📸 from different angles, measure all areas, and analyze any detail that could increase job difficulty. If these requirements are not met, the estimate will not be approved.
✅ Material + Labor included (unless otherwise stated)

🏠 
ROOFING
🔴 ASPHALT ROOF → $350 / SQ
🔴 ASPHALT ROOF (INSURANCE JOBS) → $400 / SQ
🔴 METAL ROOF (ANY COLOR) → $1,000/ SQ
🔴 TPO ROOF → $1,200 / SQ
🔴 PLYWOOD REPLACEMENT (ROOF & EXTERIOR WALLS) → $90 / sheet
🔴 SKYLIGHT REPLACEMENT → $1,950 each

🔥 
CHIMNEY / FLASHING
🧯 CHIMNEY FLASHING REPLACEMENT (STANDARD) → $1,500

🚿 
GUTTERS • SOFFIT • PORCH
🟦 GUTTERS & DOWNSPOUTS (5” / 6”) → $15 por / linear ft 😳minimo
🟦 GUTTER GUARD → $8/ linear ft
🟦 VINYL SOFFIT → $18 linear ft
🟦 METAL WRAPPED FASCIA → $18  linear ft
🟦 VINYL PORCH → $35 / linear ft

🧱 
SIDING (MATERIAL + LABOR INCLUDED)
🟩 VINYL SIDING – HORIZONTAL → $580 / SQ regular
🟩 VINYL SIDING – VERTICAL → $850 / SQ parado 
🟩 HARDIE BOARD (FIBER CEMENT) → $1,500 / SQ
🟩 WOOD SIDING (RECOMMENDED) → $2000/ SQ
Includes in all: removal of old siding, house wrap, full installation, J-channel, corners, cuts around openings, sealing & final cleanup.

🪟 
WINDOWS
🟨 VINYL WHITE → $400 each
🟨 VINYL SAND → $750 each
🟨 VINYL BLACK → $950 each
🟨 BASEMENT WINDOW – WHITE → $400each
🟨 BASEMENT WINDOW – OTHER COLOR → $650 each
🟨 BASEMENT EGRESS WINDOW – ALL INCLUDED → $5,800 each
(Cut-out, window, metal, cover, sump pump, outlet & ladder included)

🚪 
DOORS (REMOVE & INSTALL)
🟫 INTERIOR DOOR → $850
🟫 EXTERIOR DOOR 36” × 80” → $2,900 estándar
     EXTERIOR STORM DOOR-$950
🟫 DOUBLE EXTERIOR DOOR 70–72” × 80” → $3,500
🟫 SLIDING GLASS DOOR → $3,200
🟫 NEW OPENING (ANY DOOR) → $3,900 minimum
🟫 GARAGE DOOR METAL WRAP (1–2 CAR) → $250
🟫 door y windows METAL WRAP → $150
🟫 70–72” × 80” METAL WRAP → $180

🚪 
GARAGE DOORS (WITH OPENER)
🟪 1-CAR GARAGE DOOR → $2950
🟪 2-CAR GARAGE DOOR → $3800
🟪 CUSTOM / BLACK / DESIGNER → $5,500
🟪 OPENER INSTALL ONLY → $1,250

🪚 
FRAMING – DECK
🟤 TREATED WOOD DECK + RAILS + STAIRS → $35 / linear ft
🟤 COMPOSITE DECK + RAILS + STAIRS → $75 / linear ft
🟤 WOOD DECK + VINYL/ALUMINUM RAILS → $60 / linear ft

🏗️ 
FRAMING – PORCH & PATIO
🟤 PORCH FRAMING → $55 / linear ft
🟤 PATIO FRAMING → $50 / linear ft

🌿 
PERGOLAS (MATERIAL + LABOR)
🌳 WOOD PERGOLA (STANDARD) → $50 / sq ft
🌳 COVERED PERGOLA → $65 / sq ft
🌳 PERGOLA WITH METAL ROOF → $75 / sq ft
🌳 PERGOLA WITH POLYCARBONATE PANELS → $85 / sq ft

⚡ 
ELECTRICAL
⚡ 200 AMP PANEL (PERMIT INCLUDED) → $4,800
⚡ NEW CIRCUIT (BED / BATH) → $1,500 each
⚡ DEDICATED LINE (DRYER / RANGE) → $950
⚡ LIGHT FIXTURE INSTALL → $200
⚡ CEILING FAN INSTALL → $300
⚡ OUTLET / SWITCH INSTALL → $90 each

🍽️ 
KITCHEN
🍽️ FULL KITCHEN REMODEL → $25,000 
🍽️ CABINET INSTALL → $250 / unit
🍽️ GRANITE / QUARTZ COUNTERTOP → $85 / linear ft
🍽️ BACKSPLASH INSTALL → $12 / sq ft
🍽️ DISHWASHER INSTALL → $250
🍽️ OVEN INSTALL → $250
🍽️ MICROWAVE INSTALL → $200
🍽️ FAUCET INSTALL → $180
🍽️ GARBAGE DISPOSAL INSTALL → $250

🚿 
BATHROOMS (OFFICIAL VERSION)
🚿 FULL BATH – TILE SHOWER WALLS & FLOOR + BATH FLOOR (100% FINISHED) → $15,500
🚿 PLASTIC WALL SYSTEM + GLASS DOOR (100% FINISHED) → $12,900
🚿 FULL BATH – LABOR ONLY (CUSTOMER PROVIDES MATERIALS) → $8,900
🚿 SHOWER ONLY – PLASTIC WALLS + GLASS DOOR → $6,900
🚿 SHOWER ONLY – PLASTIC WALLS (NO GLASS DOOR) → $5,750
🚿 CUSTOM SHOWER DOOR (UP TO 60”) → $2,500
🚿 STANDARD SHOWER DOOR (UP TO 60”) → $1,850
Vanity NOT included (customer provides).
🚿 VANITY INSTALL – SINGLE → $450
🚿 VANITY INSTALL – DOUBLE → $600
🚿 MIRROR INSTALL → $150
🚿 TOILET INSTALL → $250
🚿 FAUCET SET INSTALL → $180
🚿 EXHAUST FAN INSTALL → $300

🚿 
PLUMBING (PRICE PER SERVICE)
🚰 INSTALL / REPLACE TOILET → $450
🚰 INSTALL / REPLACE SINK + DRAIN → $450
🚰 INSTALL / REPLACE FAUCET → $220
🚰 GARBAGE DISPOSAL INSTALL → $280
🚰 SHOWER VALVE + TRIM → $750
🚰 BATHTUB INSTALL (STANDARD) → $1,100
🚰 SHOWER BASE INSTALL → $950
🚰 NEW WATER LINE (PEX/COPPER) → $18 / ft
🚰 NEW DRAIN LINE (PVC) → $22 / ft
🚰 LAUNDRY HOOKUPS (COMPLETE) → $750
🚰 FULL BATHROUGH-IN → $1,600
🚰 WATER HEATER (TANK) → $1,650
🚰 TANKLESS WATER HEATER → $3,900
🚰 SUMP PUMP + DISCHARGE → $850
🚰 MAIN SEWER REPAIR / REPLACE → $3,800 – $6,500
🚰 GAS LINE INSTALL (STANDARD) → $950+

🪵 
FLOORING / SUBFLOOR
🪵 LAMINATE FLOORING → $7 / sq ft
🪵 TILE FLOORING → $15 / sq ft
🪵 BASEBOARDS → $4 / linear ft
🪵 CROWN MOLDING → $6 / linear ft
🪵 PLYWOOD / WOOD REPLACEMENT → $60 / piece
🪵 JOIST REPAIR (UP TO 16 FT) → $300 each
🪵 JOIST REPAIR (OVER 16 FT) → $380 each

🎨 
PAINTING
🎨 INTERIOR PAINTING → $4.50 / sq ft
🎨 EXTERIOR PAINTING → $5 / sq ft
🎨 PER ROOM → $800
🎨 PER BATHROOM → $800
🎨 INTERIOR DOOR → $350
🎨 EXTERIOR DOOR → $750
🎨 CABINETS → $300
🎨 FENCE → $4 / linear ft
🎨 DECK ONLY → $4 / sq ft

🧱 
BRICK • STONE • STUCCO
🧱 EXTERIOR BRICK INSTALL → $28 / sq ft
🧱 FULL BRICK CHIMNEY → $4,500
🧱 STONE INSTALL → $35 / sq ft
🧱 STUCCO FINISH → $22 / sq ft

🧱 
CONCRETE & ASPHALT
🧱 DRIVEWAY – REMOVE & REPLACE → $18 / sq ft
🧱 DRIVEWAY – NEW ONLY → $16 / sq ft
🧱 CONCRETE STEPS → $350 / step
🧱 PATIO / PORCH (4”) → $14 / sq ft
🧱 GARAGE SLAB (6”) → $15 / sq ft
🧱 FOOTING / FOUNDATION → $20 / linear ft
🧱 BLOCK WORK → $18 / sq ft
🧱 SIDEWALKS (4”) → $12 / sq ft
🧱 ASPHALT DRIVEWAY (3.5”) → $15 / sq ft

🚧 
FENCING (MATERIAL + LABOR)
🔷 CHAIN LINK – GALVANIZED (4 FT) → $30/ ft
🔷 CHAIN LINK – BLACK (4 FT) → $30 / ft
🔷 WOOD FENCE – DOG EAR (6 FT) → $35 / ft
🔷 HORSE FENCE – WOOD (4 FT) → $35 / ft
🔷 BLACK ALUMINUM (4 FT) → $45 / ft
🔷 WHITE VINYL (6 FT) → $60 / ft
🔷 SAND VINYL (6 FT) → $70 / ft
🔷 GRAY VINYL (6 FT) → $75 / ft
🔷 FENCE DEMOLITION (UP TO 250 FT) → $500
🔷 SINGLE GATE → $250
🔷 DOUBLE GATE → $400
🔷 EXTRA DRILLING → $5 / post

🔧 
HVAC – INSTALLED (PERMIT INCLUDED)
🔧 GOODMAN – 2.5T → $7,900
🔧 GOODMAN – 3T → $8,900
🔧 GOODMAN – 4T → $9,900
🔧 GOODMAN – 5T → $10,900

🏗️ 
NEW CONSTRUCTION & ADDITIONS
🏗️ NEW CONSTRUCTION (FULL BUILD – STANDARD MATERIALS) → $190/ sq ft
🏗️ ADDITION + SIDING + BATHROOM → $190 / sq ft
🏗️ BRICK ADDITION + BATHROOM → $200 / sq ft
🏗️ SIDING ADDITION – NO BATH / NO KITCHEN / NO PLUMBING → $170 / sq ft

📌 
FINAL NOTE (MANDATORY)
ALL PRICES MAY CHANGE AT ANY TIME DUE TO JOB DIFFICULTY OR MATERIAL COST CHANGES.
ANY ESTIMATE OUTSIDE THIS TABLE, ANY PRICE CHANGE OR ANY DISCOUNT MUST BE APPROVED ONLY AND EXCLUSIVELY BY:
LÁZARO BARBA – CEO, BARBA CONSTRUCTION

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

export async function generateEstimateFromText(inputText, prices = []) {
  const pricesListStr = prices.length > 0 
    ? prices.map(p => `- [${p.category.toUpperCase()}] ${p.item_name}: $${p.sell_price} / ${p.unit_type}`).join('\n')
    : 'No hay precios disponibles en la base de datos. Usa tu mejor criterio.';

  const prompt = `
Eres la IA Oficial de Estimados de Barba Construction.
Tu objetivo es analizar el texto dictado o escrito por el vendedor y extraer los ítems necesarios para construir un estimado en formato JSON estricto.

=== INICIO BASE DE CONOCIMIENTOS OFICIAL BARBA CONSTRUCTION ===
1. IDENTIDAD DE LA COMPAÑÍA
Nombre: BARBA CONSTRUCTION BUILDER
Frases obligatorias: FINANCING AVAILABLE, FREE ESTIMATES, 2 YEAR LABOR WARRANTY, MATERIALS AND LABOR INCLUDED
Estilo visual: Premium, Profesional tipo banco, Logo centrado.

5. TABLA OFICIAL DE PRECIOS DINÁMICA (DESDE LA BASE DE DATOS)
${pricesListStr}
=== FIN BASE DE CONOCIMIENTOS ===

REGLAS DE EXTRACCIÓN:
- Basándote en el texto del vendedor, identifica todos los servicios y materiales mencionados.
- Calcula las cantidades. (Ejemplo: si dice "un techo de asfalto de 15 squares", la cantidad es 15, el precio unitario es 380 si es estándar. El total es 15 * 380).
- Devuelve un JSON con este formato exacto:
{
  "items": [
    {
      "service": "roofing",
      "name": "Nombre descriptivo premium del servicio",
      "details": "Detalles (ej: 15 SQ @ $380/SQ)",
      "quantity": 15,
      "unitPrice": 380,
      "total": 5700
    }
  ]
}

- Asegúrate de que el unitPrice coincida con la Tabla Oficial proporcionada. Si el texto especifica que es un trabajo "flip" o "insurance" y no hay un precio exacto, ajusta lógicamente.
- Si el usuario dicta medidas crudas (ej "100 pies de cerca"), haz el cálculo.
- IMPORTANTE: No devuelvas NADA más que el objeto JSON crudo (sin marcadores \`\`\`json ni texto alrededor).

TEXTO DEL VENDEDOR:
"${inputText}"
`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    let content = data.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parseando JSON de la IA:', content);
      throw new Error('La respuesta de la IA no fue un JSON válido.');
    }
  } catch (err) {
    console.error('Error en generateEstimateFromText:', err);
    throw err;
  }
}

export async function chatWithAiTrainer(chatHistory) {
  const systemPrompt = `
Eres el Entrenador de IA Oficial de Barba Construction. Tu trabajo es ayudar a Lazaro (el administrador) a modificar o agregar nuevos servicios y precios al catálogo de la empresa.

REGLAS ESTRICTAS:
1. Siempre responde en formato JSON estricto.
2. Si el usuario pide agregar o modificar un precio/servicio, DEBES explicarle qué entendiste y PREGUNTARLE si desea guardar los cambios. No uses la acción "save_price" hasta que el usuario responda confirmando ("sí", "ok", "guárdalo").
3. Si el usuario confirma un cambio pendiente de mensajes anteriores, usa la acción "save_price" y rellena el objeto "data".
4. Tu JSON debe tener esta estructura exacta:
{
  "reply": "Texto de lo que le dices al usuario",
  "action": "none" | "save_price",
  "data": {
    "category": "roofing | siding | windows | gutters | general | deck | fences",
    "item_name": "NOMBRE EN MAYÚSCULAS",
    "unit_type": "sq | each | linear_ft | sqft | hour",
    "sell_price": numero
  }
}

EJEMPLO 1 (Usuario pide agregar):
User: "Agrega lavado a presión a 100 la hora"
Assistant: { "reply": "Entendido. Quieres agregar LAVADO A PRESIÓN a $100 por hora en la categoría general. ¿Confirmo este cambio y lo guardo?", "action": "none", "data": null }

EJEMPLO 2 (Usuario confirma):
User: "Sí, guárdalo"
Assistant: { "reply": "¡Listo! He guardado el servicio LAVADO A PRESIÓN en el catálogo.", "action": "save_price", "data": { "category": "general", "item_name": "LAVADO A PRESIÓN", "unit_type": "hour", "sell_price": 100 } }
`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error conectando con la IA');
    }

    const aiResponseText = data.choices[0].message.content;
    const parsedResponse = JSON.parse(aiResponseText);
    return parsedResponse;
  } catch (err) {
    console.error('Error in chatWithAiTrainer:', err);
    throw err;
  }
}
