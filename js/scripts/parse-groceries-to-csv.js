const fs = require('fs');
const path = require('path');

const inputFilePath = path.join('..', '..', 'food-expenses', 'groceries.txt');
const outputFilePath = path.join('..', '..', 'food-expenses', 'wip', 'groceries.csv');

function getCategory(productName) {
  productName = productName.toLowerCase();

  if (productName.includes('pfand')) {
    return 'pfand';
  }

  if (productName.includes('sonnenspray')
   || productName.includes('papier')
   || productName.includes('haushalt')
   || productName.includes('shampoo')) {
    return 'toiletries';
  }

  if (productName.includes('felix')
   || productName.includes('sheba')) {
    return 'catfood';
  }

  if (productName.includes('äpfel')
   || productName.includes('banane')
   || productName.includes('eier')
   || productName.includes('gemüse')
   || productName.includes('heidelbeere')
   || productName.includes('milch')) {
    return 'healthy'
  }

  if (productName.includes('beck')
   || productName.includes('cola')
   || productName.includes('cc')
   || productName.includes('energy')
   || productName.includes('heineken')
   || productName.includes('pfand')
   || productName.includes('saft')
   || productName.includes('somersby')
   || productName.includes('spezi')) {
    return 'drinks'
  }

  if (productName.includes('caramel')
  || productName.includes('chips')
  || productName.includes('choco')
  || productName.includes('elfbar')
  || productName.includes('ferrero')
  || productName.includes('haribo')
  || productName.includes('kinder')
  || productName.includes('knoppers')
  || productName.includes('plombir')
  || productName.includes('pringles')
  || productName.includes('snickers')) {
    return 'sweets'
  }

  return 'food';
}

function parseGroceriesToCSV() {
  const data = fs.readFileSync(inputFilePath, 'utf-8');
  let currentDate = '';
  let currentStore = '';
  const lines = data.split('\n');
  const csvRows = ['"date";"store";"productName";"price";"quantity";"category"'];

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
      const normalizedPrice = price.replace('€', '').replace('−', '-').replace(',', '.').trim();
      const category = getCategory(productName);
      if (category !== 'pfand') {
        csvRows.push(`"${currentDate}";"${currentStore}";"${productName}";"${normalizedPrice}";"${quantity}";"${category}"`);
      }
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