const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, '..', '..', 'food-expenses', 'groceries.txt');
const outputFilePath = path.join(__dirname, '..', '..', 'food-expenses', 'wip', 'groceries.csv');

function getCategory(productName) {
  productName = productName.toLowerCase();

  if (productName.includes('pfand')
   || productName.includes('leergut')) {
    return 'pfand';
  }

  if (productName.includes('bürste')
   || productName.includes('haushalt')
   || productName.includes('luftballon')
   || productName.includes('luftpolste')
   || productName.includes('papier')
   || productName.includes('shampoo')
   || productName.includes('seifenblasen')
   || productName.includes('sonnenspray')
   || productName.includes('spülbürste')
   || productName.includes('stam.')
   || productName.includes('waschmittel')
   || productName.includes('wäscheleine')
   || productName.includes('zugbandsäcke')) {
    return 'toiletries';
  }

  if (productName.includes('felix')
    || productName.includes('gourm.gold')
    || productName.includes('katzen')
    || productName.includes('sheba')) {
    return 'catfood';
  }

  if (productName.includes('apfel')
   || productName.includes('äpfel')
   || productName.includes('banane')
   || productName.includes('butter')
   || productName.includes('brokkoli')
   || productName.includes('eier')
   || productName.includes('erbsen')
   || productName.includes('filet')
   || productName.includes('gemüse')
   || productName.includes('gurke')
   || productName.includes('hackfleisch')
   || productName.includes('haferfloc')
   || productName.includes('hähn. geschn.')
   || productName.includes('heidelbeere')
   || productName.includes('lauchzwiebel')
   || productName.includes('milch')
   || productName.includes('rapsöl')
   || productName.includes('reis')
   || productName.includes('zwiebel')) {
    return 'healthy'
  }

  if (productName.includes('actimel')
   || productName.includes('beck')
   || productName.includes('cola')
   || productName.includes('cc zero')
   || productName.includes('durstlöscher')
   || productName.includes('energy')
   || productName.includes('heineken')
   || productName.includes('mocktails')
   || productName.includes('pfand')
   || productName.includes('saft')
   || productName.includes('somersby')
   || productName.includes('paulaner spezi')) {
    return 'drinks'
  }

  if (productName.includes('caramel')
  || productName.includes('chips')
  || productName.includes('choco')
  || productName.includes('elfbar')
  || productName.includes('elfa')
  || productName.includes('ferrero')
  || productName.includes('funny frisch')
  || productName.includes('haribo')
  || productName.includes('karamell')
  || productName.includes('kinder')
  || productName.includes('knoppers')
  || productName.includes('plombir')
  || productName.includes('pringles')
  || productName.includes('sahnekapseln')
  || productName.includes('schoko')
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
      const normalizedPrice = price.replace('€', '').replace('−', '-').replace('×', 'x').replace(',', '.').trim();
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