// Fix all remaining encoding issues + clean corrupted strings
// Run from project root: node fix_strings.cjs
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// All known corrupted sequences still visible
// These appear as latin1 bytes in the files
const fixes = [
  // Em dash variants (—)
  ['\u00C3\u00A2\u00E2\u0082\u00AC\u00C2\u009D', '-'],  // triple encoded dash
  ['\u00C3\u00A2\u00E2\u0082\u00AC\u0022', '-'],
  ['A\u00A2EUR"', '-'],
  ['A\u00A2EUR\u201D', '-'],
  ['\u00C3\u00A2\u00C2\u0080\u00C2\u0094', '-'],    // â€" as latin1 then utf8
  ['\u00E2\u0080\u0094', '-'],
  ['\u00E2\u0080\u0093', '-'],
  ['â€"', '-'],
  ['â€"', '-'],
  // Left/right quote marks
  ['\u00E2\u0080\u009C', '"'],
  ['\u00E2\u0080\u009D', '"'],
  ['â€œ', '"'],
  ['â€', '"'],
  // Select placeholder arrows
  ['\u00C3\u00A2\u00E2\u0082\u00AC\u00E2\u0080\u009D', '-'],
  // Copyright
  ['Â©', '(c)'],
  ['\u00C2\u00A9', '(c)'],
  // Bullet
  ['â€¢', '-'],
  ['\u00E2\u0080\u00A2', '-'],
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
  } catch(e){}
  return results;
}

const files = getAllFiles(srcDir, ['.jsx','.js','.ts','.tsx','.css']);
let total = 0;

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  for (const [bad, good] of fixes) {
    while (text.includes(bad)) text = text.replace(bad, good);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text, 'utf8');
    total++;
    console.log('Fixed: ' + path.relative(srcDir, file));
  }
}
console.log('\nDone: ' + total + ' files');
