const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, '..', '..', 'food-expenses', 'groceries.txt');
const outputFilePath = path.join(__dirname, '..', '..', 'food-expenses', 'wip', 'groceries.csv');

function getCategory(productName) {
  productName = productName.toLowerCase();

  if ( productName.includes('leergut')
    || productName.includes('pfand')) {
    return 'pfand';
  }

  if ( productName.includes('alltag')
    || productName.includes('bürste')
    || productName.includes('frischhaltedose')
    || productName.includes('haushalt')
    || productName.includes('klappbox')
    || productName.includes('luftballon')
    || productName.includes('luftpolste')
    || productName.includes('papier')
    || productName.includes('pixel')
    || productName.includes('reiniger')
    || productName.includes('seifenblasen')
    || productName.includes('shampoo')
    || productName.includes('shoulders')
    || productName.includes('sonnenspray')
    || productName.includes('spülbürste')
    || productName.includes('spülmittel')
    || productName.includes('stam.')
    || productName.includes('tücher')
    || productName.includes('waschmittel')
    || productName.includes('wäscheleine')
    || productName.includes('zugbandsäcke')) {
    return 'toiletries';
  }

  if ( productName.includes('felix')
    || productName.includes('gourm.gold')
    || productName.includes('katzen')
    || productName.includes('sheba')) {
    return 'catfood';
  }

  if ( productName.includes('apfel')
    || productName.includes('äpfel')
    || productName.includes('banane')
    || productName.includes('blumenkohl')
    || productName.includes('brokkoli')
    || productName.includes('brötchen')
    || productName.includes('brombeeren')
    || productName.includes('butter')
    || productName.includes('cornichon')
    || productName.includes('creme fraiche')
    || productName.includes('eier')
    || productName.includes('erbsen')
    || productName.includes('filet')
    || productName.includes('franz. kräuter')
    || productName.includes('frischkäse')
    || productName.includes('gemüse')
    || productName.includes('geschnetzeltes')
    || productName.includes('gurke')
    || productName.includes('hackfl')
    || productName.includes('haferfloc')
    || productName.includes('hähn. geschn.')
    || productName.includes('heidelbeere')
    || productName.includes('joghurt')
    || productName.includes('kartoffeln')
    || productName.includes('karotten')
    || productName.includes('lauchzwiebel')
    || productName.includes('milch')
    || productName.includes('naturreis')
    || productName.includes('rapsöl')
    || productName.includes('reis')
    || productName.includes('rinderhack')
    || productName.includes('salat')
    || productName.includes('sonnenblumenöl')
    || productName.includes('thomy les sau')
    || productName.includes('tomatenmark')
    || (productName.includes('zwiebel') && !productName.includes('röstzwiebeln'))) {
    return 'healthy';
  }

  if ( productName.includes('actimel')
    || productName.includes('beck')
    || productName.includes('capri sun')
    || productName.includes('cc zero')
    || productName.includes('cola')
    || productName.includes('crazy wolf')
    || productName.includes('durstlöscher')
    || productName.includes('energy')
    || productName.includes('ginseng guarana')
    || productName.includes('gönrgy')
    || productName.includes('heineken')
    || productName.includes('mocktails')
    || productName.includes('paulaner spezi')
    || productName.includes('radler')
    || productName.includes('rockstar')
    || productName.includes('rostocker pils')
    || productName.includes('saft')
    || productName.includes('somersby')) {
    return 'drinks';
  }

  if ( productName.includes('caramel')
    || productName.includes('chips')
    || productName.includes('choco')
    || productName.includes('crunchips')
    || productName.includes('elfa')
    || productName.includes('elfbar')
    || productName.includes('ferrero')
    || productName.includes('funny frisch')
    || productName.includes('funny-fr')
    || productName.includes('haribo')
    || productName.includes('karamell')
    || productName.includes('kinder')
    || productName.includes('knoppers')
    || productName.includes('onion rings')
    || productName.includes('oreo')
    || productName.includes('plombir')
    || productName.includes('pringles')
    || productName.includes('rainbow')
    || productName.includes('sahnekapseln')
    || productName.includes('salzstangen')
    || productName.includes('schoko')
    || productName.includes('schlümpfe')
    || productName.includes('snickers')) {
    return 'sweets';
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

    if (line.startsWith('//')) {
      const content = line.replace('//', '').trim();
      // Match both DD.MM.YYYY and DD.MM.YY
      const dateMatch = content.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
      if (dateMatch) {
        let [ , day, month, year ] = dateMatch;
        if (year.length === 2) {
          year = '20' + year;
        }

        const formattedDate = `${day}.${month}.${year}`;
        currentDate = formattedDate;
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