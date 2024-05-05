function initTextLines() {
  checkRadios();
  allTextLines = dataset.split(/\r\n|\n/);
  allTextLines = allTextLines.filter(function(item) {
    return item !== '' && item !== '.';
  });

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

    for (let j = 0; j < allTextLines.length - 1; j++) {
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

  // insert date into constant positions
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 7);
  const currentDateString = '"' + addZeroToSingleDigit(currentDate.getDate()) + '.' + addZeroToSingleDigit(currentDate.getMonth() + 1) + '.' + ('' + currentDate.getFullYear()).slice(2) + '"';
  for (let i = 0; i < constantPositions.length; i++) {
    let positionParts = constantPositions[i].split(';');
    let temp = positionParts[0] + ';';
    temp += currentDateString + ';' + currentDateString + ';';
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
    cutTextLines.splice(1, 0, constantPositions[i]);
  }

  if (oneRadioUnchecked) {
    totalBudget = 0;
  } else {
    totalBudget = STARTBUDGET;
  }

  // filter out categories
  allTextLines = allTextLines.filter(function(item) {
    const itemEntries = item.split(';');
    if (document.getElementById('toggle-monthly').getAttribute('checked') !== 'checked' && getEntrieCategorie(itemEntries) === 'monthly') { return false; }
    if (document.getElementById('toggle-amazon').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'amazon')  { return false; }
    if (document.getElementById('toggle-paypal').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'paypal')  { return false; }
    if (document.getElementById('toggle-takeout').getAttribute('checked') !== 'checked' && getEntrieCategorie(itemEntries) === 'takeout') { return false; }
    if (document.getElementById('toggle-food').getAttribute('checked')    !== 'checked' && getEntrieCategorie(itemEntries) === 'food')    { return false; }
    if (document.getElementById('toggle-cash').getAttribute('checked')    !== 'checked' && getEntrieCategorie(itemEntries) === 'cash')    { return false; }
    if (document.getElementById('toggle-gas').getAttribute('checked')     !== 'checked' && getEntrieCategorie(itemEntries) === 'gas')     { return false; }
    if (document.getElementById('toggle-others').getAttribute('checked')  !== 'checked' && getEntrieCategorie(itemEntries) === 'others')  { return false; }

    return true;
  });

  if (pastEvents > allTextLines.length - 1) {
    pastEvents = allTextLines.length - 1;
  }

  cutTextLines = allTextLines.slice(pastEventsOffset, pastEventsOffset + pastEvents + 1);


  // spreading monthly income onto every day
  if (spreadMonthlyIncome) {
    spreadIncomeToDaysOfMonth(cutTextLines);
  }

  // inserting category to entry
  for (let i = 0; i < cutTextLines.length; i++) {
    let entries = cutTextLines[i].split(';');
    if (entries.length > 13) {
      cutTextLines[i] += ';"' + getEntrieCategorie(entries) + '"';
    }
  }

  // sorting by amount
  if (sortType === 'amount') {
    fixSortedArray(cutTextLines, selectors.amount);
  } else {
    // sorting by date
    fixSortedArray(cutTextLines, selectors.date);
  }

  // pushing total value
  let tempBudget = totalBudget;
  for (let i = 0; i < cutTextLines.length; i++) {
    let entries = cutTextLines[i].split(';');
    if (entries.length > 10) {
      cutTextLines[i] += ';"' + tempBudget.toFixed(2) + '"';
      const nextValue = parseFloat(entries[selectors.amount].slice(1, -1).replace(',', '.'));
      if (nextValue) {
        tempBudget -= nextValue;
      }
    }
  }

  if (categories.monthly) {
    // TODO
  }

  if (groupByCategory) {
    // TODO
  }
}

function spreadIncomeToDaysOfMonth() {
  let removed = 0;
  let added = 0;

  let paydays = [];
  paydays.push(["0.0", 0]);
  cutTextLines.forEach((row, index) => {
    const entries = row.split(';');
    console.log(parseInt(entries[selectors.amount].slice(1, -1)));
    if (parseInt(entries[selectors.amount].slice(1, -1)) > 800) {
      paydays.push([entries[selectors.amount], index])
      removed += parseInt(entries[selectors.amount].slice(1, -1));
      console.log('removed', parseInt(entries[selectors.amount].slice(1, -1)));
      console.log(cutTextLines[index]);
      cutTextLines[index] = cutTextLines[index].replace(entries[selectors.amount].slice(1, -1), '0,00');
      console.log(cutTextLines[index]);
    }
  });

  paydays.push(["0.0", cutTextLines.length - 2]);

  console.log(paydays);
  /*
  for (let i = 1; i < paydays.length - 2; i++) {
    const amount = parseInt(paydays[i][0].slice(1, -1));
    const nextAmount = paydays[i + 1][0];
    const index = paydays[i][1];
    const nextIndex = paydays[i + 1][1];
    const firstDay = cutTextLines[index].split(';')[selectors.date].slice(1, -1);
    const lastDay = cutTextLines[nextIndex].split(';')[selectors.date].slice(1, -1);
    const dayDiff = Math.abs(differenceInDays(firstDay, lastDay))
    const amountPerDay = amount / dayDiff;
    if (dayDiff < 3 && false) {
      console.log(amountPerDay);
      paydays.remove(i);
      paydays.remove(i);
      paydays.push([amount + nextAmount, index]);
    }

    if (amountPerDay > 200) {
      console.log(firstDay, lastDay, amount, '/', dayDiff)
      console.log('amountPerDay!!!!!!', amountPerDay);
    }
  }*/

  // each PayDay
  for (let i = 1; i < paydays.length - 1; i++) {
    let localLoop = 0;
    console.log('went into Payday loop')
    const amount = parseInt(paydays[i][0].slice(1, -1));
    const index = paydays[i][1];
    const nextIndex = paydays[i + 1][1];
    const firstDay = cutTextLines[index].split(';')[selectors.date].slice(1, -1);
    const lastDay = cutTextLines[nextIndex].split(';')[selectors.date].slice(1, -1);
    const dayDiff = Math.abs(differenceInDays(firstDay, lastDay))
    const indexDiff = nextIndex - index;
    const amountPerDay = amount / dayDiff;

    if (amountPerDay > 200) {
      console.log(firstDay, lastDay, amount, '/', dayDiff)
      console.log('amountPerDay', amountPerDay);
    }
    // each day until the next PayDay
    if (amountPerDay > 0 && amountPerDay < 10000) {
      for (let j = index + dayDiff; j > index; j--) {
        console.log('went into day loop')
        let temp = lastDay.split('.');
        let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
        date.setDate(date.getDate() + j - index);
        let currentDateString = addZeroToSingleDigit(date.getDate()) + '.' + addZeroToSingleDigit(date.getMonth() + 1) + '.' + ('' + date.getFullYear()).slice(2);
        let resultIndex = nextIndex - 20;
        let lastDifferenceInDays = 9999999;
        for (let k = -5; k < indexDiff && cutTextLines[nextIndex - k]; k++) {
          const testedIndex = nextIndex - k;
          const comparisonDay = cutTextLines[testedIndex].split(';')[selectors.date].slice(1, -1);
          const diffDays = Math.abs(differenceInDays(currentDateString, comparisonDay))
          // console.log(lastDifferenceInDays, '>', diffDays, comparisonDay, currentDateString);
          if (lastDifferenceInDays < diffDays || comparisonDay === currentDateString) {
            // console.log('closest match', testedIndex, cutTextLines[testedIndex + 1].split(';')[selectors.date], currentDateString);
            resultIndex = testedIndex;
            break;
          } else {
            // continue
            resultIndex = testedIndex;
            lastDifferenceInDays = diffDays;
          }
        }

        if (resultIndex > -1) {
          localLoop += amountPerDay
          added += amountPerDay;
          const row = `DE45150505001101110771";"${currentDateString}";"${currentDateString}";"Monatsausgleich";"Monatsausgleich";"";"";"";"";"";"";"Monatsausgleich";"";"";"${(amountPerDay).toFixed(2)}";"EUR";""`
          cutTextLines.splice(resultIndex + 1, 0, row);
        }
      }

      console.log('added', localLoop)
    }
  }

  console.log('added', added, 'removed', removed);
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