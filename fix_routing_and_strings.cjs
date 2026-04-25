const fs = require('fs');
const path = require('path');

// 1. Fix App.jsx - remove devPreview block entirely, fix routing
const appPath = path.join(__dirname, 'src', 'App.jsx');
let app = fs.readFileSync(appPath, 'utf8');

// Remove the entire devPreview block
const devPreviewStart = app.indexOf("// DEV PREVIEW:");
const devPreviewEnd = app.indexOf("  if (loading) return");
if (devPreviewStart !== -1 && devPreviewEnd !== -1) {
  app = app.slice(0, devPreviewStart) + app.slice(devPreviewEnd);
  fs.writeFileSync(appPath, app, 'utf8');
  console.log('App.jsx: devPreview block removed');
} else {
  console.log('App.jsx: devPreview block not found (already clean or different structure)');
  console.log('devPreviewStart:', devPreviewStart, 'devPreviewEnd:', devPreviewEnd);
}

// 2. Fix RoofingConfigurator - clean remaining corrupt strings
const roofPath = path.join(__dirname, 'src', 'components', 'estimator', 'RoofingConfigurator.jsx');
if (fs.existsSync(roofPath)) {
  let roofing = fs.readFileSync(roofPath, 'utf8');
  // Replace all remaining garbage with clean text
  roofing = roofing.replace(/Metal [^'",\n]*(?:Aluminio|Steel|Acero)/g, (m) => {
    if (m.includes('Aluminio')) return 'Metal - Aluminio';
    if (m.includes('Steel')) return 'Metal - Steel';
    if (m.includes('Acero')) return 'Metal - Acero';
    return m;
  });
  roofing = roofing.replace(/CerA[^'"\n,]*(mica)/gi, 'Ceramica');
  roofing = roofing.replace(/anti-corrosiA[^'"\n,]*/gi, 'anti-corrosion');
  roofing = roofing.replace(/ArquitectA[^'"\n,]*/gi, 'Arquitectonico');
  roofing = roofing.replace(/DimensiA[^'"\n,]*/gi, 'Dimension alta');
  roofing = roofing.replace(/a[Ã\u00C3][^'"\n,]*os/gi, 'anos');
  fs.writeFileSync(roofPath, roofing, 'utf8');
  console.log('RoofingConfigurator.jsx: cleaned');
}

// 3. Fix select placeholder in ReceiptSidebar  
const receiptPath = path.join(__dirname, 'src', 'components', 'estimator', 'ReceiptSidebar.jsx');
if (fs.existsSync(receiptPath)) {
  let receipt = fs.readFileSync(receiptPath, 'utf8');
  receipt = receipt.replace(/[^'"<>]*Seleccionar cliente[^'"<>]*/g, '-- Seleccionar cliente --');
  receipt = receipt.replace(/[\u00C0-\u00FF]{2,}/g, ''); // strip remaining latin garbage
  fs.writeFileSync(receiptPath, receipt, 'utf8');
  console.log('ReceiptSidebar.jsx: placeholder cleaned');
}

console.log('\nAll fixes applied');
