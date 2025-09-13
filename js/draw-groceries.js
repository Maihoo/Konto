function initGroceries() {
  $.ajax({
    type: 'GET',
    url: 'food-expenses/wip/groceries.csv',
    dataType: 'text',
    error: function (xhr, status, error) {
      console.error('AJAX Error:', error);
    },
    success: function (foodData) {
      foodDataset = foodData;
      drawGroceries();
    }
  });
}

function drawGroceries() {
  foodTextLines = foodDataset.split(/\r\n|\n/);
  foodTextLines = foodTextLines.filter(function(item) {
    return item !== '' && item !== '.';
  });

  const groceriesMaxHeight = 100;

  path = [];
  dateLines = [];
  const paddingLeft = 980 + moveOffsetX;
  let lastDayDiff = 0;
  let fgOffset = 0;

  groceriesEntries = [];

  // Pre-compute date values
  const dates = foodTextLines.map(line => {
    const entry = line.split(';');
    return {
      date: entry[foodSelectors.date].slice(1, -1),
      store: entry[foodSelectors.store].slice(1, -1),
      productName: entry[foodSelectors.productName].slice(1, -1),
      price: entry[foodSelectors.price].slice(1, -1),
      quantity: entry[foodSelectors.quantity].slice(1, -1)
    };
  });

  const lastDay = dates[0].date;
  const firstDay = dates[dates.length - 1].date;
  // Get the number of distinct dates
  const uniqueDates = [...new Set(dates.map(d => d.date))];
  const totalDays = (sortType === 'amount') ? dates.length : uniqueDates.length;
  const dayWidth = 875 / totalDays;
  const foregroundOffset = dayWidth / 4;

  // Precompute shared dates using a hashmap
  const sharedDateCount = {};
  for (const entry of dates) {
    sharedDateCount[entry.date] = (sharedDateCount[entry.date] || 0) + 1;
  }

  const fragment = document.createDocumentFragment();

  for (let i = dates.length - 1; i >= 0; i--) {
    let entries = foodTextLines[i].split(';');
    const entry = dates[i];
    const lastTotalValue = valueToMarginTop(dates[(i === 0 ? 0 : i - 1)].total, groceriesMaxHeight);
    const totalValue = valueToMarginTop(entry.total, groceriesMaxHeight);
    let nextTotalValue = valueToMarginTop(dates[i + 1]?.total, groceriesMaxHeight);
    if (!nextTotalValue || isNaN(nextTotalValue)) {
      nextTotalValue = totalValue;
    }

    const amountValue = entry.price;
    let value = valueToPx(amountValue, groceriesMaxHeight);
    let diffDays = lastDayDiff - differenceInDays(entries[foodSelectors.date].slice(1, -1), lastDay);
    if (diffDays < 0) {
      diffDays = 2;
    }

    const square = document.createElement('div');
    square.className = 'square';
    const category = 'food'; // todo
    if (diffDays > 0) {
      square.id = `linePoint${i * 2}`;
    }

    Object.assign(square.style, {
      height: `${Math.abs(value)}px`,
      marginTop: `${(amountValue.charAt(0) !== '-') ? totalValue : nextTotalValue}px`
    });

    lastDayDiff = differenceInDays(entry.date, lastDay);
    if (sortType === 'amount') {
      lastDayDiff = i;
    }

    // Differentiate negative Events
    if (amountValue.charAt(1) === '-') {
      square.classList.add('negative-background');
      square.category = 'Sonstige Abbuchung';
    }

    // Make foreground squares smaller
    if (diffDays > 0) {
      fgOffset = 0;
    }

    let pastNegative = foodTextLines[i + 1]?.split(';')[foodSelectors.amount]?.charAt(1) === '-';
    if (diffDays === 0 && ((amountValue.charAt(0) === '-' && !pastNegative) || (amountValue.charAt(0) !== '-' && pastNegative))) {
      fgOffset += foregroundOffset;
    }

    // Adjust width and marginLeft after fgOffset
    square.style.width = `${-2 + dayWidth - fgOffset}px`;
    square.style.marginLeft = `${paddingLeft - (lastDayDiff * dayWidth) + fgOffset}px`;

    if (entry.date.charAt(0) === '_') {
      square.style.opacity = '50%';
    }

    // Push Path Points
    if (i < dates.length - 5) {
      path.push([lastTotalValue, paddingLeft - (lastDayDiff * dayWidth)]);
    }

    // Legend filling - Kategorien
    square.classList.add(`${category}-background`);
    square.category = category;
    // categorizeEntries(entries, category !== 'others', i); // Pass index 'i' as argument

    // Adding Popups
    square.index = i;
    setupHover(square, amountValue, entry.date);
    fragment.appendChild(square);
  }

  foodCanvas.appendChild(fragment);
}