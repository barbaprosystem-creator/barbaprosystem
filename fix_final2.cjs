const fs = require('fs');

// Fix WindowsConfigurator - U+00C3 U+0083 where a quote should be
let win = fs.readFileSync('src/components/estimator/WindowsConfigurator.jsx', 'utf8');
const BAD_QUOTE = '\u00C3\u0083';
win = win.split(BAD_QUOTE).join('"');
fs.writeFileSync('src/components/estimator/WindowsConfigurator.jsx', win, 'utf8');
console.log('WindowsConfigurator: fixed');

// Fix PaymentTracker - strip garbage before <strong on warning line
let pay = fs.readFileSync('src/pages/admin/PaymentTracker.jsx', 'utf8');
const lines = pay.split('\n');
const idx = lines.findIndex(l => l.includes('Pendiente configuracion'));
if (idx >= 0) {
  const before = [...lines[idx].slice(0, 25)].map(c => c.codePointAt(0).toString(16)).join(' ');
  console.log('PT L' + (idx + 1) + ' start:', before);
  // Remove non-printable high chars before <strong
  lines[idx] = lines[idx].replace(/^[^\x20-\x7E]+/, '          ');
  pay = lines.join('\n');
  fs.writeFileSync('src/pages/admin/PaymentTracker.jsx', pay, 'utf8');
  console.log('PaymentTracker: fixed');
}
