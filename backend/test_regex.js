const text = `Referente à Unidade: C-6
Após 10/11/2024`;
const unitMatch = text.match(/Unidade[:\s]*([a-zA-Z0-9-]+)/i);
console.log("UNIT MATCH:", unitMatch ? unitMatch[1] : "NULL");
