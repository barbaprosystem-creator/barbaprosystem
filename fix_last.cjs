const fs = require('fs');

// 1. Fix CRMPipeline SOURCES array and remaining garbage
let crm = fs.readFileSync('src/pages/admin/CRMPipeline.jsx', 'utf8');
const newSources = `const SOURCES = [
  { id: 'google',    label: 'Google',    icon: 'G',   color: '#4285F4' },
  { id: 'facebook',  label: 'Facebook',  icon: 'FB',  color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: 'IG',  color: '#E1306C' },
  { id: 'tiktok',    label: 'TikTok',    icon: 'TT',  color: '#010101' },
  { id: 'referral',  label: 'Referido',  icon: 'REF', color: '#10b981' },
  { id: 'phone',     label: 'Telefono',  icon: 'TEL', color: '#6b7280' },
  { id: 'walk_in',   label: 'Walk-in',   icon: 'WLK', color: '#f59e0b' },
  { id: 'web',       label: 'Web',       icon: 'WEB', color: '#8b5cf6' },
  { id: 'other',     label: 'Otro',      icon: 'OTR', color: '#6b7280' },
];`;
crm = crm.replace(/const SOURCES = \[[\s\S]*?\];/, newSources);
// Fix closed_lost label - strip the garbage icon char
crm = crm.replace(/'[^']{0,10} Perdido'/, "'Perdido'");
// Strip any remaining C3/C2 garbage (non-printable combos)
crm = crm.replace(/[\u00C3][\u0082-\u0087][\u0080-\u00BF]/g, '');
crm = crm.replace(/[\u00C2][\u0082-\u0087][\u0080-\u00BF]/g, '');
fs.writeFileSync('src/pages/admin/CRMPipeline.jsx', crm, 'utf8');
console.log('CRMPipeline: fixed');

// 2. Fix PaymentTracker - strip leading garbage on warning line
let pay = fs.readFileSync('src/pages/admin/PaymentTracker.jsx', 'utf8');
// Remove any non-ASCII chars before <strong on warning lines
pay = pay.replace(/[\u00C0-\u00FF ]+(<strong)/g, '$1');
pay = pay.replace(/[\u00C3][\u0082-\u0087][\u0080-\u00BF]/g, '');
fs.writeFileSync('src/pages/admin/PaymentTracker.jsx', pay, 'utf8');
console.log('PaymentTracker: fixed');

// 3. Fix WindowsConfigurator size descriptions
let win = fs.readFileSync('src/components/estimator/WindowsConfigurator.jsx', 'utf8');
win = win.replace(/Hasta 24\u00C3 - 36/g, 'Hasta 24" - 36');
win = win.replace(/28\u00C3 - 54/g, '28" - 54');
win = win.replace(/36\u00C3 - 60/g, '36" - 60');
win = win.replace(/\u00C3(?= -)/g, '"');
fs.writeFileSync('src/components/estimator/WindowsConfigurator.jsx', win, 'utf8');
console.log('WindowsConfigurator: fixed');
