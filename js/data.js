function initTextLines() {
  checkRadios();
  // insert permanent replacements
  for (let i = 0; i < permanentReplacements.length; i++) {
    permanentReplacements[i]
    dataset = dataset.replace(permanentReplacements[i][0], permanentReplacements[i][1] ? permanentReplacements[i][1] : '');
  }

  allTextLines = dataset.split(/\r\n|\n/);
  allTextLines = allTextLines.filter(function(item) {
    return item !== '' && item !== '.';
  });

  firstLine = allTextLines[0] + ';"Category";"Total";"Amount"';

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
  if (showInvestments) {
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
  }

  const lastLine = allTextLines[allTextLines.length - 1].split(';');
  globallyLastDay = lastLine[selectors.date].slice(1, -1);

  // spreading monthly income onto every day
  if (spreadMonthlyIncomeTo > 0) {
    spreadIncomeToDaysOfMonth(allTextLines);
  }

  // apply date filter
  if (startDate.length === 8) {
    allTextLines = allTextLines.filter(function(item, index) {
      const itemEntries = item.split(';');
      if (index === 0) { return false; }
      if (differenceInDays(startDate, itemEntries[selectors.date].slice(1, -1)) < 0) {
        return false;
      }

      return true;
    });
  }

  if (endDate.length === 8) {
    allTextLines = allTextLines.filter(function(item, index) {
      const itemEntries = item.split(';');
      if (index === 0) { return false; }
      if (differenceInDays(endDate, itemEntries[selectors.date].slice(1, -1)) > 0) {
        return false;
      }

      return true;
    });
  }

  // filter out categories
  allTextLines = allTextLines.filter(function(item, index) {
    const itemEntries = item.split(';');
    // if (index === 0) { return false; }
    if (document.getElementById('toggle-monthly').getAttribute('checked') !== 'checked' && getEntrieCategorie(itemEntries) === 'monthly') { return false; }
    if (document.getElementById('toggle-income').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'income')  { return false; }
    if (document.getElementById('toggle-cash').getAttribute('checked')    !== 'checked' && getEntrieCategorie(itemEntries) === 'cash')    { return false; }
    if (document.getElementById('toggle-amazon').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'amazon')  { return false; }
    if (document.getElementById('toggle-paypal').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'paypal')  { return false; }
    if (document.getElementById('toggle-takeout').getAttribute('checked') !== 'checked' && getEntrieCategorie(itemEntries) === 'takeout') { return false; }
    if (document.getElementById('toggle-food').getAttribute('checked')    !== 'checked' && getEntrieCategorie(itemEntries) === 'food')    { return false; }
    if (document.getElementById('toggle-gas').getAttribute('checked')     !== 'checked' && getEntrieCategorie(itemEntries) === 'gas')     { return false; }
    if (document.getElementById('toggle-others').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'others')  { return false; }
    return true;
  });


  // inserting category to entry
  for (let i = 0; i < allTextLines.length; i++) {
    let entries = allTextLines[i].split(';');
    if (entries.length > 13) {
      allTextLines[i] += ';"' + getEntrieCategorie(entries) + '"';
    }
  }

  // sorting by amount
  if (sortType === 'amount') {
    fixSortedArray(allTextLines, selectors.amount);
  } else {
    // sorting by date
    if (spreadMonthlyIncomeTo > 0) {
      fixSortedArray(allTextLines, selectors.date);
    }
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
  console.log(paydays);

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
        // console.log(currentDateString, amountPerDay)
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
          // console.log(currentDateString)
          allTextLines.splice(resultIndex + 1, 0, row);
        }
      }
    }
  }
  console.log(removed, added)
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

    console.log(index, nextIndex);
    console.log(firstDay, lastDay);

    // each day until the next PayDay
    if (amountPerDay > 0 && amountPerDay < 10000) {
      for (let j = index + dayDiff; j > index; j--) {
        let temp = lastDay.split('.');
        let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
        date.setDate(date.getDate() + j - index);
        let currentDateString = addZeroToSingleDigit(date.getDate()) + '.' + addZeroToSingleDigit(date.getMonth() + 1) + '.' + ('' + date.getFullYear()).slice(2);
        // console.log(currentDateString, amountPerDay)
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
          // console.log(currentDateString)
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