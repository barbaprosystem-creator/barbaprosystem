/**
 * FINAL ENCODING FIX
 * These files were saved as latin1 content encoded as UTF-8, producing
 * double-byte sequences like C3 A9 (é), C3 B3 (ó), C3 B1 (ñ), etc.
 * and corrupted emojis showing as multi-byte garbage.
 * This script decodes them properly back to clean Unicode.
 */
const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...getFiles(p));
    else if (['.jsx', '.js'].includes(path.extname(e.name))) r.push(p);
  }
  return r;
}

const BAD_PATTERN = /[\u00C3\u00C2][\u0080-\u00BF]/g;

// Known emoji sequences (corrupted 4-byte emojis as latin1-in-UTF8) -> replace with ''
// Pattern: \u00F0\u009F... (F0 9F as latin1 chars encoded in utf8 = C3 B0 C2 9F)
const EMOJI_PATTERN = /[\u00C3\u00B0][\u00C2][\u009F][\u00C0-\u00FF][\u00C0-\u00FF]/g;

// Additional known corrupt sequences to strip
const STRIP_PATTERNS = [
  // Corrupted 4-byte emoji sequences shown as latin1 
  /[\u00C3-\u00C4][\u0080-\u00BF][\u00C2-\u00C3][\u0080-\u00BF][\u00C2-\u00C3][\u0080-\u00BF]/g,
  /[\u00C3-\u00C4][\u0080-\u00BF][\u00C2-\u00C3][\u0080-\u00BF]/g,
];

// Map: file -> array of [badString, replacement]
// For files that need surgical fixes
const SURGICAL = {
  'src/pages/admin/AdminDashboard.jsx': [
    // SOURCE_ICONS - replace entire object with lucide component names
    [/const SOURCE_ICONS = \{[\s\S]*?\};/, `const SOURCE_ICONS = {
    google: 'Google', facebook: 'Facebook', instagram: 'Instagram',
    tiktok: 'TikTok', referral: 'Referido', phone: 'Telefono',
    walk_in: 'Visita', web: 'Web', other: 'Otro',
  };`],
    // Fix the source icon render
    [/{SOURCE_ICONS\[lead\.source\] \|\| '[^']*'}/g, '{SOURCE_ICONS[lead.source] || "Otro"}'],
    // Fix em-dash in subtitle
    [/Barba Construction [^\u0022<{]*Resumen/g, 'Barba Construction - Resumen'],
  ],
};

let totalFixed = 0;

for (const f of getFiles('src')) {
  let text = fs.readFileSync(f, 'utf8');
  const orig = text;
  
  // Apply surgical fixes if defined
  const rel = f.replace(/\\/g, '/');
  if (SURGICAL[rel]) {
    for (const [pattern, replacement] of SURGICAL[rel]) {
      text = text.replace(pattern, replacement);
    }
  }

  // The files with C3/C2 corruption were double-encoded latin1.
  // Decode: read the string bytes as latin1, then interpret as UTF-8
  if (BAD_PATTERN.test(text)) {
    BAD_PATTERN.lastIndex = 0;
    try {
      // Convert JS string (UTF-8) back to bytes, then re-read as latin1 interpretation
      const buf = Buffer.from(text, 'utf8');
      // Try decoding as latin1 -> unicode
      const asLatin1 = buf.toString('latin1');
      // Now asLatin1 has the original mis-encoded text
      // Re-encode properly: the chars in asLatin1 represent latin1 codepoints
      // which when originally written as latin1 bytes and read as utf8 gives us the correct text
      
      // Actually the simpler approach: find sequences of C3xx C2xx and decode them
      // These are latin1 chars (U+00xx) that got UTF-8 encoded an extra time
      // C3 A9 = U+00E9 = é (correct é in latin1 terms)
      // So we need to: take the UTF-8 string, get its bytes, interpret as latin1
      const reinterpreted = Buffer.from(text, 'utf8').toString('latin1');
      
      // Check if the re-interpreted version looks better (fewer C3/C2 sequences)
      const newBad = (reinterpreted.match(BAD_PATTERN) || []).length;
      const oldBad = (text.match(BAD_PATTERN) || []).length;
      BAD_PATTERN.lastIndex = 0;
      
      if (newBad < oldBad) {
        // Then strip corrupted 4-byte emoji sequences (they become garbage chars)
        // 4-byte emoji in latin1: U+00F0 U+009F ... 
        let cleaned = reinterpreted;
        // Remove sequences starting with \xF0\x9F (emoji range F0 9F in latin1)
        cleaned = cleaned.replace(/\xF0[\x80-\xFF][\x80-\xFF][\x80-\xFF]/g, '');
        // Remove other high-byte garbage: sequences of 3+ chars in latin1 extended range
        cleaned = cleaned.replace(/[\x80-\xFF]{4,}/g, '');
        // Fix remaining double-encoded sequences
        try {
          const finalBuf = Buffer.from(cleaned, 'latin1');
          const finalText = finalBuf.toString('utf8');
          if (!finalText.includes('\uFFFD')) {
            text = finalText;
          } else {
            text = cleaned;
          }
        } catch {
          text = cleaned;
        }
      }
    } catch(e) {
      console.error('Error processing ' + f + ': ' + e.message);
    }
  }

  // Strip any remaining obvious garbage: 3+ consecutive high latin1 chars
  text = text.replace(/[\u00C0-\u00FF]{3,}/g, (m) => {
    // Only strip if it doesn't look like valid extended latin text
    // Valid: é è ê ë á à â ã ä ñ ó ò ô ö ú ù û ü etc.
    // These are U+00C0-U+024F range - Spanish uses U+00C0-U+00FF
    // If more than 3 consecutive, it's probably garbage
    if (m.length > 3) return '';
    return m;
  });

  if (text !== orig) {
    fs.writeFileSync(f, text, 'utf8');
    totalFixed++;
    console.log('Fixed: ' + path.relative('src', f));
  }
}

console.log('\nTotal: ' + totalFixed + ' files fixed');
