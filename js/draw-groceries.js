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

function parseDate(s) {
  if (!s) return 0;
  if (s.includes('.')) { // dd.mm.yyyy
    const [d, m, y] = s.split('.');
    return new Date(+y, +m - 1, +d).getTime();
  }
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

function groupCategoriesWithinDates(arr) {
  // collect entries per date
  const dateBuckets = new Map();
  for (const item of arr) {
    const key = item.date;
    if (!dateBuckets.has(key)) dateBuckets.set(key, []);
    dateBuckets.get(key).push(item);
  }

  // sort date chronologically
  const dateKeys = Array.from(dateBuckets.keys()).sort((a, b) => parseDate(a) - parseDate(b));

   // for each date, group by store, then category
  const result = [];
  for (const dateKey of dateKeys) {
    const items = dateBuckets.get(dateKey);
    const catOrder = [];
    const catMap = new Map();
    for (const it of items) {
      if (!catMap.has(it.category)) {
        catMap.set(it.category, []);
        catOrder.push(it.category);
      }
      catMap.get(it.category).push(it);
    }
    for (const cat of catOrder) {
      result.push(...catMap.get(cat));
    }
  }

  return result;
}

function groupCategoriesWithinDatesAndStores(arr) {
  const CATEGORY_ORDER = ['catfood', 'toiletries', 'sweets', 'drinks', 'food', 'healthy'];

  // collect entries per date
  const dateBuckets = new Map();
  for (const item of arr) {
    const key = item.date;
    if (!dateBuckets.has(key)) dateBuckets.set(key, []);
    dateBuckets.get(key).push(item);
  }

  // sort date chronologically
  const dateKeys = Array.from(dateBuckets.keys()).sort(
    (a, b) => parseDate(a) - parseDate(b)
  );

  // for each date, group by category
  const result = [];
  for (const dateKey of dateKeys) {
    const items = dateBuckets.get(dateKey);

    const storeOrder = [];
    const storeMap = new Map();

    for (const it of items) {
      if (!storeMap.has(it.store)) {
        storeMap.set(it.store, []);
        storeOrder.push(it.store);
      }
      storeMap.get(it.store).push(it);
    }

    for (const store of storeOrder) {
      const storeItems = storeMap.get(store);
      const catMap = new Map();

      for (const it of storeItems) {
        if (!catMap.has(it.category)) {
          catMap.set(it.category, []);
        }

        catMap.get(it.category).push(it);
      }

      const catOrder = CATEGORY_ORDER.filter(c => catMap.has(c));
      for (const cat of catOrder) {
        result.push(...catMap.get(cat));
      }
    }
  }

  return result;
}

function prepareFoodData(inputLines) {

  foodTextLines = inputLines.filter(function(item, index) {
    return item !== '' && item !== '.' && index !== 0;
  });

  groceriesEntries = [];
  // Pre-compute date values
  const dates = foodTextLines.map(line => {
    const entry = line.split(';');
    return {
      date: entry[foodSelectors.date].slice(1, -1),
      store: entry[foodSelectors.store].slice(1, -1),
      productName: entry[foodSelectors.productName].slice(1, -1),
      price: entry[foodSelectors.price].slice(1, -1),
      quantity: entry[foodSelectors.quantity].slice(1, -1),
      category: entry[foodSelectors.category].slice(1, -1)
    };
  });

  return dates;
}

function drawGroceries() {
  const unsortedDates = prepareFoodData(foodDataset.split(/\r\n|\n/));
  const dates = groupCategoriesWithinDatesAndStores(unsortedDates);
  drawCircleDiagram(unsortedDates);

  const groceriesMaxHeight = 100;

  let dayOffset = 0;
  let heightOffset = 0;

  let lastDay = dates[0].date;
  let lastStore = dates[0].store;
  // Get the number of distinct dates
  const uniqueDates = [...new Set(dates.map(d => d.date))];
  const uniqueStores = [...new Set(dates.map(d => d.store))];
  const totalDays = (2 * uniqueDates.length) + uniqueStores.length;
  const dayWidth = (850 / totalDays).toFixed(2);

  // Precompute shared dates using a hashmap
  const sharedDateCount = {};
  for (const entry of dates) {
    sharedDateCount[entry.date] = (sharedDateCount[entry.date] || 0) + 1;
  }

  let bar = document.createElement('div');
  bar.classList = 'square-holder-bar';
  bar.style.marginLeft = dayWidth + 'px';

  for (let i = 0; i < dates.length; i++) {
    const entry = dates[i];
    const newDay = entry.date !== lastDay;
    const newStore = newDay || entry.store !== lastStore;

    lastStore = entry.store;
    lastDay = entry.date;

    if (newDay) {
      dayOffset++;
    }

    if (newStore) {
      dayOffset++;
    }

    if (newDay || newStore) {
      heightOffset = 0;
      foodCanvas.appendChild(bar);
      bar = document.createElement('div');
      bar.classList = 'square-holder-bar';
      if (newDay) {
        bar.style.marginLeft = dayWidth + 'px';
      } else {
        bar.style.marginLeft = '2px';
      }
    }

    const totalValue = valueToMarginTop(entry.total, groceriesMaxHeight);
    let nextTotalValue = valueToMarginTop(dates[i + 1]?.total, groceriesMaxHeight);
    if (!nextTotalValue || isNaN(nextTotalValue)) {
      nextTotalValue = totalValue;
    }

    const amountValue = parseFloat(entry.price) * -1;
    let height = valueToPx(amountValue, groceriesMaxHeight);

    const square = document.createElement('div');
    square.className = 'square square-relative';
    heightOffset += parseFloat(Math.abs(height));
    Object.assign(square.style, {
      height: `${Math.abs(height).toFixed(2)}px`,
      width: `${dayWidth}px`
    });

    // legend filling - categories
    square.classList.add(`${entry.category}-background`);
    square.category = entry.category;

    // adding Popups
    square.index = i;
    setupHover(square, amountValue, entry.date, entry.productName);
    bar.appendChild(square);
  }

  foodCanvas.appendChild(bar);
}

function drawCircleDiagram(data) {
  const CATEGORY_ORDER = ['catfood', 'toiletries', 'sweets', 'drinks', 'food', 'healthy'];
  const ctx = circleCanvas.getContext("2d");
  ctx.clearRect(0, 0, circleCanvas.width, circleCanvas.height);

  const categoryTotals = {};
  data.forEach(item => {
    const category = item.category;
    const price = parseFloat(item.price);
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += price;
  });

  const categories = CATEGORY_ORDER.filter(cat => categoryTotals[cat] > 0);
  const values = categories.map(cat => categoryTotals[cat]);
  const computedStyle = getComputedStyle(document.documentElement);

  const colors = [
    computedStyle.getPropertyValue(`--${CATEGORY_ORDER[0]}-color`).trim(), // catfood, @amazon-color
    computedStyle.getPropertyValue(`--${CATEGORY_ORDER[1]}-color`).trim(), // toiletries, @paypal-color
    computedStyle.getPropertyValue(`--${CATEGORY_ORDER[2]}-color`).trim(), // sweets, @takeout-color
    computedStyle.getPropertyValue(`--${CATEGORY_ORDER[3]}-color`).trim(), // drinks, @cash-color
    computedStyle.getPropertyValue(`--${CATEGORY_ORDER[4]}-color`).trim(), // food, @food-color
    computedStyle.getPropertyValue(`--${CATEGORY_ORDER[5]}-color`).trim()  // healthy, @income-color
  ];

  let startAngle = -Math.PI / 2;
  const total = values.reduce((a, b) => a + b, 0);

  categories.forEach((cat, i) => {
    const value = values[i];
    const sliceAngle = (value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    const radius = Math.min(circleCanvas.width, circleCanvas.height) / 2 - 10;
    for (let j = 5; j >= 0; j--) {
      ctx.beginPath();
      ctx.moveTo(circleCanvas.width / 2, circleCanvas.height / 2);
      ctx.arc(
        circleCanvas.width / 2,
        circleCanvas.height / 2,
        radius,
        startAngle,
        endAngle
      );
      ctx.closePath();

      const alpha = (5 - j) / 20;
      ctx.fillStyle = colors[i].replace("rgb", "rgba").replace(")", `,${alpha})`);
      ctx.fill();
    }

    startAngle = endAngle;
  });
}
