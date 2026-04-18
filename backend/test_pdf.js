const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
    let dataBuffer = fs.readFileSync('./uploads/1776261970597-Boleto.pdf');
    let data = await pdfParse(dataBuffer);
    console.log("PDF TEXT START---");
    console.log(data.text);
    console.log("PDF TEXT END---");
}
test();
