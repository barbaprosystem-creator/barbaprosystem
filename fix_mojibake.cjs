/**
 * CORRECT mojibake map - verified from actual file bytes
 * Pattern: C3 83 XX in file bytes = U+00C3 U+0083 U+00XX in JS string
 * C3 83 A9 = é
 * C3 83 A1 = á
 * etc.
 */
const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...getFiles(p));
    else if (['.jsx','.js'].includes(path.extname(e.name))) r.push(p);
  }
  return r;
}

// Verified pattern: U+00C3 U+0083 U+00XX = mojibake for latin chars
// U+00C3 U+0082 U+00XX = another variant
const MOJIBAKE = [
  // C3 83 XX variants (most common)
  ['\u00C3\u0083\u00A9', 'e'],   // é → e (simpler: just ASCII)
  ['\u00C3\u0083\u00A1', 'a'],   // á → a
  ['\u00C3\u0083\u00B3', 'o'],   // ó → o
  ['\u00C3\u0083\u00BA', 'u'],   // ú → u
  ['\u00C3\u0083\u00AD', 'i'],   // í → i
  ['\u00C3\u0083\u00B1', 'n'],   // ñ → n
  ['\u00C3\u0083\u00BC', 'u'],   // ü → u
  ['\u00C3\u0083\u00A8', 'e'],   // è → e
  ['\u00C3\u0083\u00B2', 'o'],   // ò → o
  ['\u00C3\u0083\u00B6', 'o'],   // ö → o
  // Uppercase
  ['\u00C3\u0083\u0089', 'E'],   // É → E
  ['\u00C3\u0083\u0081', 'A'],   // Á → A
  ['\u00C3\u0083\u0093', 'O'],   // Ó → O
  ['\u00C3\u0083\u009A', 'U'],   // Ú → U
  // Special punctuation C3 82 XX
  ['\u00C3\u0082\u00BF', '?'],   // ¿ → ?
  ['\u00C3\u0082\u00A1', '!'],   // ¡ → !
  ['\u00C3\u0082\u00AB', '"'],   // « → "
  ['\u00C3\u0082\u00BB', '"'],   // » → "
  ['\u00C3\u0082\u00B7', '.'],   // · → .
  ['\u00C3\u0082\u00A9', '(c)'], // © → (c)
  // Em-dash complex patterns (verified: Ã¢EUR" = em dash)
  // Bytes C3 A2 E2 82 AC 22 in file = U+00C3 U+00A2 U+20AC U+0022 in JS (after utf8 decode of C3 A2 = â, E2 82 AC = €)
  ['\u00C3\u00A2\u20AC\u201D', ' - '],   // â€" type
  ['\u00C3\u00A2\u20AC\u201C', ' - '],
  ['\u00C3\u00A2\u20AC\u0022', ' - '],
  ['\u00C3\u00A2\u20AC"',       ' - '],
];

// Strip all corrupted emoji sequences
// Pattern starts with C3 B0 (ð) followed by garbage
const EMOJI_RE = /\u00C3\u00B0[\u0080-\u00FF][\u0080-\u00FF][\u0080-\u00FF]/g;
// Also strip Ã°Â\x9F style sequences  
const EMOJI_RE2 = /\u00C3\u00B0\u00C2[\u0080-\u00BF]\u00C3[\u0080-\u00BF]\u00C2[\u0080-\u00BF]/g;
// Strip remaining Ã + Å + garbage (checkmarks etc)
const MISC_RE = /\u00C3\u00A2[\u00C3][\u0085][\u2026\u00A4\u00A0]/g;
const MISC_RE2 = /[\u00C3\u00C2][\u0080-\u00BF][\u00C3\u00C2][\u0080-\u00BF][\u00C3\u00C2][\u0080-\u00BF]/g;

let total = 0;
for (const f of getFiles('src')) {
  let text = fs.readFileSync(f, 'utf8');
  const orig = text;
  
  for (const [bad, good] of MOJIBAKE) {
    while (text.includes(bad)) text = text.split(bad).join(good);
  }
  
  // Strip emoji garbage
  text = text.replace(EMOJI_RE, '');
  text = text.replace(EMOJI_RE2, '');
  text = text.replace(MISC_RE, ' ');
  // Strip remaining 3-byte garbage sequences that aren't valid Spanish
  text = text.replace(/\u00C3[\u0080-\u0087][\u0080-\u00BF]/g, ''); // invalid combos
  text = text.replace(/[\u00C3\u00C2][\u0083\u0082][\u0080-\u00BF]/g, ''); // C3 83/82 XX leftovers
  
  if (text !== orig) {
    fs.writeFileSync(f, text, 'utf8');
    total++;
    console.log('Fixed: ' + path.relative('src', f));
  }
}
console.log('\nTotal: ' + total + ' files');
