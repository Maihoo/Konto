const fs = require('fs');
const path = require('path');

const inputFilePath = path.join('..', '..', 'food-expenses', 'groceries.txt');
const outputFilePath = path.join('..', '..', 'food-expenses', 'wip', 'groceries.csv');

function parseGroceriesToCSV() {
  const data = fs.readFileSync(inputFilePath, 'utf-8');
  let currentDate = '';
  let currentStore = '';
  const lines = data.split('\n');
  const csvRows = ['"date";"store";"productName";"price";"quantity"'];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('// ')) {
      const content = line.substring(3).trim();
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(content)) {
        currentDate = content;
      } else {
        currentStore = content;
      }

      continue;
    }

    const parts = line.split(' -- ').map(p => p.trim());
    if (parts.length === 3) {
      const [productName, price, quantity] = parts;
      const normalizedPrice = price.replace('€', '').replace(',', '.').trim();
      csvRows.push(`"${currentDate}";"${currentStore}";"${productName}";"${normalizedPrice}";"${quantity}"`);
    }
  }

  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFilePath, csvRows.join('\n'), 'utf-8');
  console.log(`CSV file created at ${outputFilePath}`);
}

parseGroceriesToCSV();