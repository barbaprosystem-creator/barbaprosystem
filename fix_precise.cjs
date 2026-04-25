const fs = require('fs');

// Map of file -> exact line replacements [bad, good]
const fixes = {
  'src/components/estimator/RoofingConfigurator.jsx': [
    ["Metal \u00C3\u00A2EUR\" Acero",    "Metal - Acero"],
    ["Metal \u00C3\u00A2EUR\" Aluminio", "Metal - Aluminio"],
    ["Cer\u00C3\u00A1mica",             "Ceramica"],
    ["Techo \u00C3\u00A2EUR\"",         "Techo -"],
  ],
  'src/components/estimator/SidingConfigurator.jsx': [
    ["cl\u00C3\u00A1sico",              "clasico"],
    ["Siding \u00C3\u00A2EUR\"",        "Siding -"],
  ],
  'src/components/estimator/GutterConfigurator.jsx': [
    ["M\u00C3\u00A1s comun",            "Mas comun"],
    ["cl\u00C3\u00A1sico",              "clasico"],
    ["est\u00C3\u00A1ndar",             "estandar"],
  ],
};

let total = 0;
for (const [file, replacements] of Object.entries(fixes)) {
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  for (const [bad, good] of replacements) {
    text = text.split(bad).join(good);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text, 'utf8');
    total++;
    console.log('Fixed: ' + file.split('/').pop());
  }
}

// Also rewrite ReceiptSidebar select placeholder
const rPath = 'src/components/estimator/ReceiptSidebar.jsx';
let receipt = fs.readFileSync(rPath, 'utf8');
// Fix the select default option text
receipt = receipt.replace(/value=""\s*>[^<]*Seleccionar[^<]*/g, 'value="">-- Seleccionar cliente --');
receipt = receipt.replace(/\u00C3\u00A2EUR[""\u201C\u201D]/g, '-');
fs.writeFileSync(rPath, receipt, 'utf8');
console.log('Fixed: ReceiptSidebar.jsx select placeholder');
total++;

console.log('\nTotal: ' + total + ' files fixed');
