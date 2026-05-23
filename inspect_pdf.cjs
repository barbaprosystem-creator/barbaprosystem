const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function inspectPDF() {
  const filePath = process.argv[2];
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`Found ${fields.length} fields:`);
  fields.forEach(field => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`${type}: ${name}`);
  });
}

inspectPDF().catch(console.error);
