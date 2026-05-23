import fs from 'fs';
import * as pdfParseModule from 'pdf-parse';

const pdf = pdfParseModule.default || pdfParseModule;
const dataBuffer = fs.readFileSync('C:\\TRABAJO\\barba construction\\_Retail Construction Agreement  (9).pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(console.error);
