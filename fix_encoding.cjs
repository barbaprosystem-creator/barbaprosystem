const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// After the first pass, remaining corruption is latin1-encoded UTF-8.
// These are single-byte representations: e.g. "Ã³" means bytes [0xC3, 0xB3]
// read as latin1 gives chars \u00C3\u00B3 → "Ã³"
// We fix by reading as binary and replacing known sequences.

// Build replacement table: corrupted latin1 string → correct UTF-8 char
// Latin1 code points for UTF-8 byte pairs of Spanish chars:
// é = U+00E9 = UTF-8 0xC3 0xA9 → latin1: Ã©
// á = U+00E1 = UTF-8 0xC3 0xA1 → latin1: Ã¡
// í = U+00ED = UTF-8 0xC3 0xAD → latin1: Ã­  (Ã\xAD shows as ÃÂ­)
// ó = U+00F3 = UTF-8 0xC3 0xB3 → latin1: Ã³
// ú = U+00FA = UTF-8 0xC3 0xBA → latin1: Ãº
// ñ = U+00F1 = UTF-8 0xC3 0xB1 → latin1: Ã±
// ü = U+00FC = UTF-8 0xC3 0xBC → latin1: Ã¼
// © = U+00A9 = UTF-8 0xC2 0xA9 → latin1: Â©
// ° = U+00B0 = UTF-8 0xC2 0xB0 → latin1: Â°
// · = U+00B7 = UTF-8 0xC2 0xB7 → latin1: Â·
// – = U+2013 = UTF-8 0xE2 0x80 0x93 → latin1: â€"
// — = U+2014 = UTF-8 0xE2 0x80 0x94 → latin1: â€"
// ' = U+2019 = UTF-8 0xE2 0x80 0x99 → latin1: â€™
// Á = U+00C1 = UTF-8 0xC3 0x81 → latin1: Ã\x81 (ÃÂ)
// É = U+00C9 = UTF-8 0xC3 0x89 → latin1: Ã‰
// Í = U+00CD = UTF-8 0xC3 0x8D → latin1: Ã
// Ó = U+00D3 = UTF-8 0xC3 0x93 → latin1: Ã"
// Ú = U+00DA = UTF-8 0xC3 0x9A → latin1: Ãš
// Ñ = U+00D1 = UTF-8 0xC3 0x91 → latin1: Ã'

const replacements = [
  // Lowercase accented (most common)
  ['\u00C3\u00A9', 'e'],  // é
  ['\u00C3\u00A1', 'a'],  // á  
  ['\u00C3\u00AD', 'i'],  // í
  ['\u00C3\u00B3', 'o'],  // ó
  ['\u00C3\u00BA', 'u'],  // ú
  ['\u00C3\u00B1', 'n'],  // ñ
  ['\u00C3\u00BC', 'u'],  // ü
  // Uppercase accented
  ['\u00C3\u0081', 'A'],  // Á
  ['\u00C3\u0089', 'E'],  // É
  ['\u00C3\u008D', 'I'],  // Í
  ['\u00C3\u0093', 'O'],  // Ó
  ['\u00C3\u009A', 'U'],  // Ú
  ['\u00C3\u0091', 'N'],  // Ñ
  // Symbols
  ['\u00C2\u00A9', '(c)'],  // ©
  ['\u00C2\u00B0', ' grados'],
  ['\u00C2\u00BF', ''],      // ¿
  ['\u00C2\u00A1', ''],      // ¡
  ['\u00C2\u00B7', '.'],     // ·
  ['\u00C2\u00BB', '>>'],
  ['\u00C2\u00AB', '<<'],
  // Punctuation
  ['\u00E2\u0080\u0093', '-'],   // –
  ['\u00E2\u0080\u0094', ' - '], // —
  ['\u00E2\u0080\u0099', "'"],   // '
  ['\u00E2\u0080\u009C', '"'],   // "
  ['\u00E2\u0080\u009D', '"'],   // "
  ['\u00E2\u0080\u00A2', '-'],   // •
  ['\u00E2\u0080\u00A6', '...'], // …
  ['\u00E2\u0082\u00AC', 'EUR'], // €
  // Additional ó variants seen in scan
  ['Ã³', 'o'],
  ['Ã©', 'e'],
  ['Ã¡', 'a'],
  ['Ã­', 'i'],
  ['Ãº', 'u'],
  ['Ã±', 'n'],
  ['Ã¼', 'u'],
  ['Â©', '(c)'],
  ['â€"', '-'],
  ['â€"', '-'],
  ['â€™', "'"],
  ['â€œ', '"'],
  ['â€', '"'],
  ['â€¢', '-'],
  ['â€¦', '...'],
  // Remaining Ã before space or end  
  ['Ã\u00B3', 'o'],
  ['Ã\u00A9', 'e'],
  ['Ã\u00A1', 'a'],
  ['Ã\u00AD', 'i'],
  ['Ã\u00BA', 'u'],
  ['Ã\u00B1', 'n'],
];

function getAllFiles(dir, exts) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllFiles(fullPath, exts));
      } else if (exts.includes(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  } catch (e) {}
  return results;
}

const files = getAllFiles(srcDir, ['.jsx', '.js', '.ts', '.tsx', '.css']);
let fixedCount = 0;

for (const file of files) {
  const buf = fs.readFileSync(file);
  // Treat as latin1 so each byte = one char, enabling exact byte-level matching
  let text = buf.toString('latin1');
  const original = text;

  for (const [from, to] of replacements) {
    // Convert the "from" pattern to its latin1 representation
    const fromLatin1 = Buffer.from(from, 'utf8').toString('latin1');
    while (text.includes(fromLatin1)) {
      text = text.replace(fromLatin1, to);
    }
    // Also try direct match in case already latin1
    while (text.includes(from)) {
      text = text.replace(from, to);
    }
  }

  // Remove broken 4-byte emoji sequences (read as latin1: \xF0\x9F...)
  text = text.replace(/\xF0[\x80-\xBF][\x80-\xBF][\x80-\xBF]/g, '');

  if (text !== original) {
    // Write as latin1 buffer (bytes are now clean ASCII + latin1 safe chars)
    fs.writeFileSync(file, Buffer.from(text, 'latin1'));
    fixedCount++;
    console.log(`Fixed: ${path.relative(srcDir, file)}`);
  }
}

console.log(`\nDone. Fixed ${fixedCount} files.`);
