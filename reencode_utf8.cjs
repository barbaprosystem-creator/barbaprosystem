// Re-encode all src files from latin1 to proper UTF-8
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

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
    // Read as raw bytes
    const buf = fs.readFileSync(file);
    
    // Check if it's already valid UTF-8
    let isValidUTF8 = true;
    try {
      const test = buf.toString('utf8');
      // If no replacement characters appeared, it's valid UTF-8
      if (test.includes('\uFFFD')) isValidUTF8 = false;
    } catch {
      isValidUTF8 = false;
    }

    if (!isValidUTF8) {
      // File is latin1 — convert to UTF-8
      const textLatin1 = buf.toString('latin1');
      fs.writeFileSync(file, Buffer.from(textLatin1, 'latin1'));
      // Actually the above doesn't help. We need to re-encode:
      // latin1 chars 0x00-0xFF -> UTF-8
      const utf8Buf = Buffer.from(textLatin1, 'latin1');
      // Just write the same bytes - latin1 0x00-0x7F is valid UTF-8
      // The issue is chars 0x80-0xFF which are not valid UTF-8 single bytes
      // We need to convert latin1 string to UTF-8 buffer
      const utf8String = textLatin1; // string is already Unicode in JS
      fs.writeFileSync(file, utf8String, { encoding: 'utf8' });
      count++;
      console.log('Re-encoded: ' + path.relative(srcDir, file));
    }
  } catch(e) {
    console.error('Error on ' + file + ': ' + e.message);
  }
}

console.log('\nRe-encoded ' + count + ' files to UTF-8');
