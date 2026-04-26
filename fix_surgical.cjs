/**
 * Surgical string replacement for all remaining encoding artifacts.
 * Each entry: [file, [[bad, good], ...]]
 */
const fs = require('fs');

const FIXES = {
  'src/pages/admin/CRMPipeline.jsx': [
    // Stage labels with corrupted checkmark/X emojis
    ["'Ã¢Å... Ganado'",   "'Ganado'"],
    ["'Ã¢ÂÅ Perdido'",   "'Perdido'"],
    // Source icons - replace all emoji with text labels
    ["icon: 'Ã°Å¸\"Â'",  "icon: 'G'"],
    ["icon: 'Ã°Å¸\"Ë'",  "icon: 'F'"],
    ["icon: 'Ã°Å¸\"Â¸'", "icon: 'IG'"],
    ["icon: 'Ã°Å¸Å½Âµ'", "icon: 'TT'"],
    ["icon: 'Ã°Å¸Â¤Â'",  "icon: 'REF'"],
    ["icon: 'Ã°Å¸\"Å¾'",  "icon: 'TEL'"],
    ["icon: 'Ã°Å¸Å¡Â¶'", "icon: 'WALK'"],
    ["icon: 'Ã°Å¸ÅÂ'",   "icon: 'WEB'"],
    ["icon: 'Ã°Å¸\"â¹'",  "icon: 'OTR'"],
    // Temperature dots
    ["dot: 'Ã°Å¸\"Â´'",   "dot: '🔴'"],
    ["dot: 'Ã°Å¸Å¸¡'",   "dot: '🟡'"],
    ["dot: 'Ã°Å¸\"Âµ'",   "dot: '🔵'"],
    // Option labels
    ["Ã°Å¸\"Â´ Caliente", "Caliente"],
    ["Ã°Å¸Å¸¡ Tibio",    "Tibio"],
    ["Ã°Å¸\"Âµ Frio",    "Frio"],
    // Em-dash fallbacks
    ["'Ã¢EUR\"'",         "'-'"],
    ["'Ã¢EUR\"'",         "'-'"],
    // Telefono
    ["TelÃ©fono",         "Telefono"],
    ["telÃ©fono",         "telefono"],
    // Buscar placeholder
    ["telÃ©fono...",      "telefono..."],
  ],
  'src/pages/admin/PaymentTracker.jsx': [
    // Select placeholder
    ["Ã¢EUR\" Selecciona proyecto Ã¢EUR\"", "-- Selecciona proyecto --"],
    ["Ã¢EUR\" {p.title}",                  "- {p.title}"],
    // Labels
    ["MÃ©todo",            "Metodo"],
    // Separator
    ["} Ã¢EUR\" {formatCurrency", "} - {formatCurrency"],
    // Success icon
    ["style={{ color: '#10b981', fontSize: '40px', marginBottom: '12px' }}>Ã¢Å...", "style={{ color: '#10b981', fontSize: '40px', marginBottom: '12px' }}>✓"],
    // Notification texts
    ["estÃ© configurado",   "este configurado"],
    ["enviarÃ¡",            "enviara"],
    ["automÃ¡ticamente",    "automaticamente"],
    // Channel options - remove emoji prefixes
    ["'Ã°Å¸\"Â± Solo SMS'",           "'SMS'"],
    ["'Ã°Å¸\"Â§ Solo Email'",          "'Email'"],
    ["'Ã°Å¸\"Â±Ã°Å¸\"Â§ SMS + Email'", "'SMS + Email'"],
    // Warning icon
    ["Ã¢Å¡Â Ã¯Â¸Â ",    ""],
    // Table header
    ["MÃ©todo",             "Metodo"],
    // Due days
    ["'Ã¡Hoy!'",            "'Hoy!'"],
    // Em-dash fallbacks
    ["'Ã¢EUR\"'",           "'-'"],
    ["vencido\`",           "vencido`"],
  ],
  'src/pages/admin/CalendarPage.jsx': [
    ["'MiÃ©'", "'Mie'"],
    ["'SÃ¡b'", "'Sab'"],
    [" Ã¢EUR\" <em>",       " - <em>"],
    ["Nuevo Evento Ã¢EUR\"", "Nuevo Evento -"],
  ],
  'src/pages/admin/EstimatesList.jsx': [
    ["'Ã¿Eliminar este estimado?'", "'Eliminar este estimado?'"],
    ["Estimados Ã¢EUR\" Proximamente", "Estimados - Proximamente"],
    ["'Ã¢EUR\"'",           "'-'"],
  ],
  'src/pages/admin/ProjectDetail.jsx': [
    // Comment markers - harmless but clean them
    ["{/* Ã¢\"EURÃ¢\"EUR PIPELINE TAB */}",  "{/* PIPELINE TAB */}"],
    ["{/* Ã¢\"EURÃ¢\"EUR PAYMENTS TAB */}",  "{/* PAYMENTS TAB */}"],
    ["{/* Ã¢\"EURÃ¢\"EUR PHOTOS TAB */}",    "{/* PHOTOS TAB */}"],
    ["'DespuÃ©s'", "'Despues'"],
  ],
  'src/pages/admin/ReportsPage.jsx': [
    ["registrada aun.", "registrada aun."],  // already clean, skip
  ],
  'src/pages/Estimator.jsx': [
    ["telÃ©fono...",    "telefono..."],
    ["'Ã¢EUR\"'",      "'-'"],
    ["Ã· ${c.address}", `· \${c.address}`],
    // Success screen emoji
    ["style={{ fontSize: '64px', marginBottom: '16px' }}>Ã¢Å...", "style={{ fontSize: '64px', marginBottom: '16px' }}>✓"],
    ["<h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>Ã¡Estimado Guardado!", "<h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>¡Estimado Guardado!"],
  ],
  'src/pages/Materials.jsx': [
    ["CatÃ¡logo", "Catalogo"],
    ["catÃ¡logo", "catalogo"],
  ],
  'src/pages/supervisor/DailyReports.jsx': [
    ["Ã¢EUR\" {p.title}", "- {p.title}"],
  ],
  'src/components/estimator/WindowsConfigurator.jsx': [
    ["'MÃ¡s comun, dos paneles'",        "'Mas comun, dos paneles'"],
    ["'Sin apertura, vista panorÃ¡mica'", "'Sin apertura, vista panoramica'"],
    ["'Triple panel en Ã¡ngulo'",         "'Triple panel en angulo'"],
    ["'Hasta 24Ã - 36\"'",               "'Hasta 24\" - 36\"'"],
    ["'28Ã - 54\" aprox.'",              "'28\" - 54\" aprox.'"],
    ["'36Ã - 60\" y mÃ¡s'",             "'36\" - 60\" y mas'"],
    ["Ã¢EUR\" {SIZES",                   "- {SIZES"],
  ],
  'src/components/estimator/RoofingConfigurator.jsx': [
    ["'CerÃ¡mica o concreto'", "'Ceramica o concreto'"],
  ],
  'src/components/estimator/SidingConfigurator.jsx': [
    ["'Cedar / pine, clÃ¡sico'", "'Cedar / pine, clasico'"],
  ],
  'src/components/estimator/GutterConfigurator.jsx': [
    ["'MÃ¡s comun, angulado'",    "'Mas comun, angulado'"],
    ["'Semicircular, clÃ¡sico'",  "'Semicircular, clasico'"],
    ["'Residencial estÃ¡ndar'",   "'Residencial estandar'"],
  ],
};

let total = 0;
for (const [file, pairs] of Object.entries(FIXES)) {
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  for (const [bad, good] of pairs) {
    text = text.split(bad).join(good);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text, 'utf8');
    total++;
    console.log('Fixed: ' + file.split('/').pop());
  }
}
console.log('\nDone: ' + total + ' files');
