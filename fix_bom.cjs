// Strip UTF-8 BOM and fix encoding for all source files
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

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
let count = 0;

for (const file of files) {
  try {
    let buf = fs.readFileSync(file);
    
    // Strip BOM if present
    let hasBOM = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
    if (hasBOM) {
      buf = buf.slice(3);
    }

    // Try to decode as UTF-8 — if it fails, it's latin1
    let text;
    let wasLatin1 = false;
    try {
      // Check for invalid UTF-8 sequences
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buf);
      text = decoded;
    } catch (e) {
      // File is latin1 — decode as latin1 (which maps to Unicode 1:1)
      text = buf.toString('latin1');
      wasLatin1 = true;
    }

    if (hasBOM || wasLatin1) {
      // Write as clean UTF-8 without BOM
      fs.writeFileSync(file, text, { encoding: 'utf8' });
      count++;
      console.log((hasBOM ? '[BOM] ' : '[L1]  ') + path.relative(srcDir, file));
    }
  } catch(e) {
    console.error('ERROR: ' + path.relative(srcDir, file) + ' -> ' + e.message);
  }
}

console.log('\nFixed ' + count + ' files -> clean UTF-8 no BOM');
