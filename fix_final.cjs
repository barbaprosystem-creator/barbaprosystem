// Fix double-encoded BOM: bytes C3AF C2BB C2BF -> strip them
// Also fix any remaining latin1-encoded content
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Double-encoded BOM: EF BB BF chars were latin1-re-encoded as UTF-8
// EF -> U+00EF -> UTF-8: C3 AF
// BB -> U+00BB -> UTF-8: C2 BB  
// BF -> U+00BF -> UTF-8: C2 BF
const DOUBLE_BOM = Buffer.from([0xC3, 0xAF, 0xC2, 0xBB, 0xC2, 0xBF]);
const SINGLE_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

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
    let changed = false;

    // Strip double-encoded BOM (6 bytes: C3 AF C2 BB C2 BF)
    if (buf.slice(0, 6).equals(DOUBLE_BOM)) {
      buf = buf.slice(6);
      changed = true;
      console.log('[DBL-BOM] ' + path.relative(srcDir, file));
    }
    // Strip single BOM (3 bytes: EF BB BF)
    else if (buf.slice(0, 3).equals(SINGLE_BOM)) {
      buf = buf.slice(3);
      changed = true;
      console.log('[BOM]     ' + path.relative(srcDir, file));
    }

    // Check if now valid UTF-8
    let isValidUTF8 = true;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      isValidUTF8 = false;
    }

    if (!isValidUTF8) {
      // Convert latin1 to UTF-8
      const text = buf.toString('latin1');
      buf = Buffer.from(text, 'utf8');
      changed = true;
      console.log('[L1->U8]  ' + path.relative(srcDir, file));
    }

    if (changed) {
      fs.writeFileSync(file, buf);
      count++;
    }
  } catch(e) {
    console.error('ERROR: ' + path.relative(srcDir, file) + ': ' + e.message);
  }
}

console.log('\nFixed: ' + count + ' files');
