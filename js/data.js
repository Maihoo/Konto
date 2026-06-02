function initTextLines() {
  checkRadios();
  // insert permanent replacements
  for (let i = 0; i < permanentReplacements.length; i++) {
    datasets.forEach(dataset => {
      dataset.csv = dataset.csv.replace(permanentReplacements[i][0], permanentReplacements[i][1] ? permanentReplacements[i][1] : '');
      dataset.csv = dataset.csv.replace(/\.2026";"/g, '.26";"');
    });
  }

  // align dataset field headers
  datasets.forEach(dataset => {
    const lines = dataset.csv.split(/\r\n|\n/);
    const normalizedLines = [];
    let headerFields = [];
    let mapping = {};
    let insertedFields = 0;
    lines.forEach(line => {
      if (!line.trim()) return;
      const entries = line.split(';');
      const fields = line.replace(/"/g, '').split(';');

      // HEADER
      if (line.includes('Buchungstag')) {
        headerFields = fields;

        mapping.date = fields.indexOf('Buchungstag');

        if (fields.indexOf('Vorgang') >= 0) {
          mapping.content = fields.indexOf('Vorgang');
        } else if (fields.indexOf('Buchungstext') >= 0) {
          mapping.content = fields.indexOf('Buchungstext');
        }

        if (fields.indexOf('Verwendungszweck') >= 0) {
          mapping.purpose = fields.indexOf('Verwendungszweck');
        } else if (fields.indexOf('Buchungstext') >= 0) {
          mapping.purpose = fields.indexOf('Buchungstext');
        }else if (fields.indexOf('Vorgang') >= 0) {
          mapping.purpose = fields.indexOf('Vorgang');
        } else {
          mapping.purpose = mapping.content;
        }

        if (fields.indexOf('Beguenstigter/Zahlungspflichtiger') >= 0) {
          mapping.beneficiary = fields.indexOf('Beguenstigter/Zahlungspflichtiger');
        }

        mapping.amount = fields.indexOf('Umsatz in EUR') >= 0 ? fields.indexOf('Umsatz in EUR') : fields.indexOf('Betrag');

        // Build normalized header
        const normalizedHeader = new Array(17).fill('""');
        normalizedHeader[selectors.date] = '"Buchungstag"';
        normalizedHeader[selectors.content] = '"Buchungstext"';
        normalizedHeader[selectors.purpose] = '"Verwendungszweck"';
        normalizedHeader[selectors.beneficiary] = '"Beguenstigter"';
        normalizedHeader[selectors.amount] = '"Betrag"';
        normalizedLines.push(normalizedHeader.join(';'));
        return;
      }

      // in case there's no obvious beneficiary field, try to extract it from content
      if ((!mapping.beneficiary || insertedFields === 1) && headerFields.indexOf('Buchungstext') >= 0) {
        const contentIndex = headerFields.indexOf('Buchungstext');
        if (contentIndex && entries[contentIndex] && (entries[contentIndex].includes('Auftraggeber: ') || entries[contentIndex].includes('Empfänger: '))) {
          const beneficiary = '"' + entries[contentIndex].split(/Auftraggeber:|Empfänger:/)[1];
          if (beneficiary.includes('Buchungstext: ')) {
            // content also includes booking text
            entries.splice(contentIndex + 1, 0, beneficiary.split('Buchungstext:')[0].trim() + '"');
            entries[contentIndex] = '"' + beneficiary.split('Buchungstext:')[1].trim();
          } else {
            entries[contentIndex] = '""';
            entries.splice(contentIndex + 1, 0, entries[contentIndex]);
          }
        } else {
          entries.splice(contentIndex + 1, 0, '""');
        }

        insertedFields = 1;
        mapping.beneficiary = contentIndex + 1;
      }

      // Create normalized row with enough columns
      const normalized = new Array(17).fill('""');
      normalized[selectors.date] = entries[mapping.date] || '""';
      normalized[selectors.content] = entries[mapping.content] || '""';
      normalized[selectors.purpose] = entries[mapping.purpose] || '""';
      normalized[selectors.beneficiary] = mapping.beneficiary >= 0 ? entries[mapping.beneficiary] || '""' : '""';
      normalized[selectors.amount] = entries[mapping.amount + insertedFields] || '""';
      if (Object.keys(mapping).length > 0) {
        normalizedLines.push(normalized.join(';'));
      }
    });

    if (!mapping.beneficiary) {
      mapping.beneficiary = headerFields.indexOf('Buchungstext') + 1;
    }

    dataset.normalizedCsv = normalizedLines.join('\n');
  });

  allTextLines = [];
  datasets.forEach((dataset) => {
    allTextLines.push(...dataset.normalizedCsv.split(/\r\n|\n/));
    const lastLine = allTextLines[allTextLines.length - 1].split(';');
    const lastDay = lastLine[selectors.date].slice(1, -1);
    if (differenceInDays(lastDay, startDate) > differenceInDays(globallyLastDay, startDate)) {
      globallyLastDay = lastDay;
    }
  });

  allTextLines = allTextLines.filter(function(item) {
    return item !== '' && item !== '.' && item.length > 20 && item.split(';').length > 5;
  });

  firstLine = (allTextLines[0] + ';"Category";"Total";"Amount"').replace(';;', ';');

  // insert replacements
  for (let i = 0; i < replacements.length; i++) {
    const replacementParts = replacements[i].split(';');
    if (replacementParts.length < 3) {
      return;
    }

    const selectorIndex = parseInt(replacementParts[0]);
    const selectorValue = replacementParts[1];
    const toReplaceIndex = parseInt(replacementParts[2]);
    const toReplaceValue = replacementParts[3];

    for (let j = 0; j < allTextLines.length; j++) {
      let line = allTextLines[j];
      let lineParts = line.split(';');
      if (lineParts.length < selectorIndex || lineParts.length < toReplaceIndex) {
        return;
      }

      if (lineParts[selectorIndex].includes(selectorValue)) {
        lineParts[toReplaceIndex] = '"' + toReplaceValue + '"';
        line = '';
        for (let k = 0; k < lineParts.length; k++) {
          line += lineParts[k];
          if (k !== lineParts.length - 1) {
            line += ';';
          }
        }

        allTextLines[j] = line;
      }
    }
  }

  if (oneRadioUnchecked) {
    totalBudget = 10000;
  } else {
    totalBudget = STARTBUDGET;
  }

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 4);
  const currentDateString = '"' + addZeroToSingleDigit(currentDate.getDate()) + '.' + addZeroToSingleDigit(currentDate.getMonth() + 1) + '.' + ('' + currentDate.getFullYear()).slice(2) + '"';
  // insert date into constant positions
  for (let i = 0; i < constantPositions.length; i++) {
    let positionParts = constantPositions[i].split(';');
    let temp = positionParts[0] + ';';
    if (positionParts[1] === '""') {
      temp += currentDateString + ';' + currentDateString + ';';
    } else {
      temp += positionParts[1] + ';' + positionParts[1] + ';';
    }

    for (let j = 3; j < positionParts.length; j++) {
      temp += positionParts[j] + ';';
    }

    temp = temp.slice(0, -1);
    constantPositions[i] = temp;
  }

  // pushing constant positions
  for (let i = 0; i < constantPositions.length; i++) {
    const value = constantPositions[i].split(';')[selectors.amount].slice(1, -1);
    totalBudget += parseInt(value);
    let positionParts = constantPositions[i].split(';');
    if (positionParts[1] !== currentDateString) {
      let index = 1;
      while (differenceInDays(positionParts[1].slice(1, -1), allTextLines[index].split(';')[selectors.date].slice(1, -1)) > 0) {
        index++;
      }
      // insert into correct position
      allTextLines.splice(index, 0, constantPositions[i]);
    } else {
      // insert as last
      allTextLines.splice(1, 0, constantPositions[i]);
    }
  }

  if (showInvestments) {
    allTextLines = allTextLines.filter(function(item) {
      const entries = item.split(';');
      if (entries[selectors.purpose].includes('Kontofüllung')) {
        // const value = entries[selectors.amount].slice(1, -1);
        // totalBudget += Math.abs(parseInt(value));
        return false;
      }

      return true;
    });
  }

  // spreading monthly income onto every day
  if (spreadMonthlyIncomeTo > 0) {
    spreadIncomeToDaysOfMonth(allTextLines);
  }

  // apply date filter
  allTextLines = allTextLines.filter(function(item, index) {
    const date = item.split(';')[selectors.date].slice(1, -1);
    return (index > 0 && date && (startDate.length !== 8 || differenceInDays(startDate, date) > 0) && (endDate.length !== 8 || differenceInDays(endDate, date) < 0));
  });

  allTextLines.forEach((line, index) => {
    allTextLines[index] = line.replace('.2025";"', '.25";"').replace('.2026";"', '.26";"');
  });

  // filter out categories
  allTextLines = allTextLines.filter(function(line) {
    const entries = line.split(';');
    const category = getEntrieCategory(entries);
    if (document.getElementById('toggle-monthly').getAttribute('checked') !== 'checked' && category === 'monthly') { return false; }
    if (document.getElementById('toggle-income').getAttribute('checked')  !== 'checked' && category === 'income')  { return false; }
    if (document.getElementById('toggle-cash').getAttribute('checked')    !== 'checked' && category === 'cash')    { return false; }
    if (document.getElementById('toggle-amazon').getAttribute('checked')  !== 'checked' && category === 'amazon')  { return false; }
    if (document.getElementById('toggle-paypal').getAttribute('checked')  !== 'checked' && category === 'paypal')  { return false; }
    if (document.getElementById('toggle-takeout').getAttribute('checked') !== 'checked' && category === 'takeout') { return false; }
    if (document.getElementById('toggle-food').getAttribute('checked')    !== 'checked' && category === 'food')    { return false; }
    if (document.getElementById('toggle-gas').getAttribute('checked')     !== 'checked' && category === 'gas')     { return false; }
    if (document.getElementById('toggle-others').getAttribute('checked')  !== 'checked' && category === 'others')  { return false; }
    return true;
  });

  // inserting category to entry
  for (let i = 0; i < allTextLines.length; i++) {
    let entries = allTextLines[i].split(';');
    if (entries.length > 13) {
      allTextLines[i] += ';"' + getEntrieCategory(entries) + '"';
    }
  }

  // sorting by amount
  if (sortType === 'amount') {
    fixSortedArray(allTextLines, selectors.amount);
  } else {
    // sorting by date
    fixSortedArray(allTextLines, selectors.date);
  }

  if (groupByCategory) {
    allTextLines = groupArrayByField(allTextLines, selectors.category, currentDateString);
    allTextLines.shift();
  }

  // pushing total value
  let tempBudget = totalBudget;
  let lastCategory = "";
  for (let i = 0; i < allTextLines.length; i++) {
    let entries = allTextLines[i].split(';');
    if (entries.length > 10) {
      if (groupByCategory && lastCategory !== entries[selectors.category]) {
        lastCategory = entries[selectors.category];
        tempBudget = 0;
      }

      allTextLines[i] += ';"' + tempBudget.toFixed(2) + '"';
      const nextValue = parseFloat(entries[selectors.amount].slice(1, -1).replace(',', '.'));
      if (nextValue) {
        tempBudget -= nextValue;
      }
    }
  }

  if (allTextLines.length === 0) {
    return;
  }
  // align starts at 0
  let categoryTotal = parseFloat(allTextLines[allTextLines.length - 1].split(';')[selectors.total].slice(1, -1).replace(',', '.')).toFixed(2);
  if (groupByCategory) {
    for (let i = allTextLines.length - 3; i > 1; i--) {
      let entries = allTextLines[i].split(';');
      let nextEntries = allTextLines[i - 2].split(';');
      if (lastCategory !== nextEntries[selectors.category]) {
        lastCategory = nextEntries[selectors.category];
        categoryTotal = parseFloat(nextEntries[selectors.total].slice(1, -1).replace(',', '.')).toFixed(2);
      }
      // Calculate the difference and update the entry
      let currentValue = parseFloat(entries[selectors.total].slice(1, -1).replace(',', '.')).toFixed(2);
      let nextValue = currentValue - categoryTotal;
      // Update the entry only if the next value is different from the current value
      if (nextValue !== currentValue) {
        allTextLines[i] = allTextLines[i].replace(entries[selectors.total], '"' + nextValue.toFixed(2).toString().replace('.', ',') + '"');
      }
    }
  }
}

function spreadIncomeToDaysOfMonth() {
  let removed = 0;
  let added = 0;

  let paydays = [];
  paydays.push([0, '0.0', allTextLines[1].split(';')[selectors.date].slice(1, -1)]);

  let paydayIndex = 0;
  let totalAmount = 0;
  let date = '';
  allTextLines.forEach((row, index) => {
    const entries = row.split(';');
    if (parseInt(entries[selectors.amount].slice(1, -1)) > 800) {
      if (paydayIndex === 0) {
        date = entries[selectors.date].slice(1, -1);
      }

      totalAmount += parseFloat(entries[selectors.amount].slice(1, -1));
      removed += parseInt(entries[selectors.amount].slice(1, -1));
      if (paydayIndex >= spreadMonthlyIncomeTo) {
        paydayIndex = 0;
        paydays.push([index, '"' + totalAmount + '"', date]);
        date = '';
        totalAmount = 0;
      } else {
        paydayIndex++;
      }

      allTextLines[index] = allTextLines[index].replace(entries[selectors.amount].slice(1, -1), '0,00');
    }
  });

  paydays.push([allTextLines.length - 2, '0.0', allTextLines[allTextLines.length - 2].split(';')[selectors.date].slice(1, -1)]);

  // each Month
  for (let i = 1; i < paydays.length - 1; i++) {
    let localLoop = 0;
    const amount = parseInt(paydays[i][1].slice(1, -1));
    const index = paydays[i][0];
    const nextIndex = paydays[i + 1][0];
    const firstDay = paydays[i][2];
    const lastDay = paydays[i + 1][2];
    const dayDiff = Math.abs(differenceInDays(firstDay, lastDay))
    const amountPerDay = amount / dayDiff;

    // each day until the next PayDay
    if (amountPerDay > 0 && amountPerDay < 10000) {
      for (let j = index + dayDiff; j > index; j--) {
        let temp = lastDay.split('.');
        let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
        date.setDate(date.getDate() + j - index);
        let currentDateString = addZeroToSingleDigit(date.getDate()) + '.' + addZeroToSingleDigit(date.getMonth() + 1) + '.' + ('' + date.getFullYear()).slice(2);
        let resultIndex = nextIndex - 20;
        let lastDifferenceInDays = 9999999;

        // Search within a margin of 20 days backward
        for (let k = 0; k < 20 && resultIndex > index; k++) {
          const comparisonDay = allTextLines[resultIndex].split(';')[selectors.date].slice(1, -1);
          const diffDays = Math.abs(differenceInDays(currentDateString, comparisonDay));
          // If current difference is less than last one, update resultIndex
          if (diffDays <= lastDifferenceInDays) {
            resultIndex--;
            lastDifferenceInDays = diffDays;
          } else {
            break;
          }
        }

        if (resultIndex > -1) {
          localLoop += amountPerDay;
          added += amountPerDay;
          const row = `DE45150505001101110771";"${currentDateString}";"${currentDateString}";"Monatsausgleich";"Monatsausgleich";"";"";"";"";"";"";"Monatsausgleich";"";"";"${(amountPerDay).toFixed(2)}";"EUR";""`;
          allTextLines.splice(resultIndex + 1, 0, row);
        }
      }
    }
  }
}

function spreadIncomeToDaysOfMonth2() {
  let removed = 0;
  let added = 0;

  let paydays = [];
  paydays.push([0, '0.0', allTextLines[0].split(';')[selectors.date].slice(1, -1)]);
  allTextLines.forEach((row, index) => {
    const entries = row.split(';');
    if (parseInt(entries[selectors.amount].slice(1, -1)) > 800) {
      paydays.push([index, entries[selectors.amount], entries[selectors.date].slice(1, -1)])
      removed += parseInt(entries[selectors.amount].slice(1, -1));
      allTextLines[index] = allTextLines[index].replace(entries[selectors.amount].slice(1, -1), '0,00');
    }
  });

  paydays.push([allTextLines.length - 2, '0.0', allTextLines[allTextLines.length - 2].split(';')[selectors.date].slice(1, -1)]);

  // each Month
  for (let i = 1; i < paydays.length - 1; i++) {
    let localLoop = 0;
    const amount = parseInt(paydays[i][1].slice(1, -1));
    const index = paydays[i][0];
    const nextIndex = paydays[i + 1][0];
    const firstDay = paydays[i][2];
    const lastDay = paydays[i + 1][2];
    const dayDiff = Math.abs(differenceInDays(firstDay, lastDay))
    const amountPerDay = amount / dayDiff;

    // each day until the next PayDay
    if (amountPerDay > 0 && amountPerDay < 10000) {
      for (let j = index + dayDiff; j > index; j--) {
        let temp = lastDay.split('.');
        let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
        date.setDate(date.getDate() + j - index);
        let currentDateString = addZeroToSingleDigit(date.getDate()) + '.' + addZeroToSingleDigit(date.getMonth() + 1) + '.' + ('' + date.getFullYear()).slice(2);
        let resultIndex = nextIndex - 20;
        let lastDifferenceInDays = 9999999;

        // Search within a margin of 20 days backward
        for (let k = 0; k < 20 && resultIndex > index; k++) {
          const comparisonDay = allTextLines[resultIndex].split(';')[selectors.date].slice(1, -1);
          const diffDays = Math.abs(differenceInDays(currentDateString, comparisonDay));
          // If current difference is less than last one, update resultIndex
          if (diffDays <= lastDifferenceInDays) {
            resultIndex--;
            lastDifferenceInDays = diffDays;
          } else {
            break;
          }
        }

        if (resultIndex > -1) {
          localLoop += amountPerDay;
          added += amountPerDay;
          const row = `DE45150505001101110771";"${currentDateString}";"${currentDateString}";"Monatsausgleich";"Monatsausgleich";"";"";"";"";"";"";"Monatsausgleich";"";"";"${(amountPerDay).toFixed(2)}";"EUR";""`;
          allTextLines.splice(resultIndex + 1, 0, row);
        }
      }
    }
  }
}

function fixSortedArray(array, fieldIndex) {
  if (array.length <= 1) {
    return;
  }

  const firstElement = array[0];
  sortArrayByField(array, fieldIndex);

  array.unshift(firstElement);
  array.pop();
}

function sortArrayByField(array, fieldIndex) {
  array.sort(function (a, b) {
    let aValue = parseInt(a.split(';')[fieldIndex].slice(1, -1));
    let bValue = parseInt(b.split(';')[fieldIndex].slice(1, -1));

    if (fieldIndex === selectors.date) {
      aValue = parseDate(b.split(';')[fieldIndex].slice(1, -1));
      bValue = parseDate(a.split(';')[fieldIndex].slice(1, -1));
    }

    if (isNaN(aValue)) return 1;
    if (isNaN(bValue)) return -1;

    return aValue - bValue;
  });
}

function groupArrayByField(array, fieldIndex, currentDate) {
  if (array.length <= 1) {
    return array;
  }

  const groupedArray = [];
  const groups = {};

  array.forEach(element => {
    const fieldValue = getFieldValue(element, fieldIndex);
    if (!groups[fieldValue]) {
      groups[fieldValue] = [];
    }

    groups[fieldValue].push(element);
  });

  for (const fieldValue in groups) {
    // add a filler entry for today to each category
    groupedArray.push(`"filler";${currentDate};${currentDate};"filler";"filler";"";"";"";"";"";"";"filler";"";"";"0";"EUR";"";${fieldValue};""`);
    // Collect groups maintaining chronological order
    groupedArray.push(...groups[fieldValue]);
  }

  return groupedArray;
}

function getFieldValue(element, fieldIndex) {
  return element.split(';')[fieldIndex].trim();
}