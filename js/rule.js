$(document).ready(async function () {
  // Set the worker source for pdf.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  try {
    const fileNames = await $.getJSON('files.json');
    datasets = [];
    for (const name of fileNames) {
      const csv = await $.get(`data/${name}.csv`);
      console.log('name', name);
      //if (name === 'spk') {
        datasets.push({name, csv});
      //}
    }

    // Runs only AFTER everything finished
    getFromSessionStorage();
    const tempDateOffset = new Date();
    tempDateOffset.setDate(tempDateOffset.getDate() - 90);
    document.getElementById('date-range-start').value = dateToString(tempDateOffset);
    handleDateChange();
    init();
  } catch (e) {
    console.error("Loading failed", e);
  }
});

function init() {
  initTextLines();
  initControls();
  initDrawing();
}

let canvasWidth = window.innerWidth - 490;
let canvasHeight = window.innerHeight - 300;
document.documentElement.style.setProperty('--canvas-zoom', 1);
document.documentElement.style.setProperty('--canvas-width', canvasWidth + 'px');
document.documentElement.style.setProperty('--canvas-height', canvasHeight + 'px');

// Constants
let startBudget = 0;
const ZOOMFACTOR = 0.8;
const EXTRAAREA = 0.00;

const categories = ['monthly', 'income', 'cash', 'amazon', 'paypal', 'food', 'takeout', 'gas', 'others'];

let activeCategories = {
  'monthly': true,
  'income': true,
  'cash': true,
  'amazon': true,
  'paypal': true,
  'food': true,
  'takeout': true,
  'gas': true,
  'others': true
};

const constantPositions = [
  '"DE45150505001101110771";"";"";"Investitionen";"Profit";"";"";"";"";"";"";"Kraken";"";"";"-685";"EUR";"";""',
  '"DE45150505001101110771";"27.04.26";"";"Kraken";"BitCoin";"";"";"";"";"";"";"Ich";"";"";"2000";"EUR";"";""',
  '"DE45150505001101110771";"30.01.26";"";"Kraken";"BitCoin";"";"";"";"";"";"";"Ich";"";"";"1800";"EUR";"";""',
  '"DE45150505001101110771";"21.11.25";"";"Kraken";"BitCoin";"";"";"";"";"";"";"Ich";"";"";"500";"EUR";"";""',
];

const selectors= {
  'date': 1,
  'content': 3,
  'purpose': 4,
  'beneficiary': 11,
  'amount': 14,
  'source': 17,
  'category': 18,
  'total': 19
};

const foodSelectors= {
  'date': 0,
  'store': 1,
  'productName': 2,
  'price': 3,
  'quantity': 4,
  'category': 5
};

const replacements = [
 // selectors.purpose + ';Finn Ole Stadtaus (Miete);' + selectors.amount + ';-1000'
]

// path drawing
const pathThickness = 2;
const shadowLength = 100; // how large the shadow should be
const shadowDistance = 4; // spacing between each blurred line
const shadowCount = shadowLength / shadowDistance;

// Variables
let totalBudget = startBudget;
let globallyLastDay = 0;

let zoomInPressed = false;
let zoomOutPressed = false;
let squaresVisible = false;
let combined = false;
let gridMode = false;
let showShadow = true;
let settingsExtended = false;
let settingsVertical = false;
let groupByCategory = false;
let filterSwaps = true;
let showFoodExpenses = false;
let oneRadioUnchecked = false;

let datasets;
let foodDataset;

let verticalScaleFactor = 1.0;
let zoomLevel = 1.0;

let spreadMonthlyIncomeTo = 0;
let legendMultiplier = 100;
let maxHeight = 500;
let startHeight = 0.0;
let budget = 0.0;
let lowest = 0.0;
let highest = 0.0;
let moveOffsetX = 0.0;
let moveOffsetY = 0.0;
let dragstartX = 0.0;
let dragstartXstorage = 0.0;
let dragstartY = 0.0;
let dragstartYstorage = 0.0;
let ts1 = 0;
let ts2 = 0;

const tempDateOffset = new Date();
tempDateOffset.setDate(tempDateOffset.getDate() - 90);
let startDate = dateToString(tempDateOffset);
let endDate = '';
let sortType = 'date';
let firstLine = '';

let backgroundColor = '25, 25, 25';
let lineColor = '255, 0, 0';
let uiColor = '255, 255, 255';

let pdfImportedLines = [];
let allTextLines = [];
let foodTextLines = [];
let dateLines = [];
let path = [];
let linepoints = [];

let monthlyEntries = [];
let incomeEntries = [];
let cashEntries = [];
let amazonEntries = [];
let paypalEntries = [];
let foodEntries = [];
let takeoutEntries = [];
let gasEntries = [];
let debtEntries = [];
let restEntries = [];

let groceriesEntries = [];

let canvas = document.getElementById('canvas');
let pathCanvas = document.getElementById('pathCanvas');
let pathBlurCanvas = document.getElementById('pathBlurCanvas');
let uiLine = document.getElementById('uiLine');
let uiCanvas = document.getElementById('uiCanvas');
let uiCanvasHorizontal = document.getElementById('uiCanvasHorizontal');
let uiCanvasVertical = document.getElementById('uiCanvasVertical');
let overflowWrapper = document.getElementById('overflowWrapper');
let zoomingWrapper = document.getElementById('zoomingWrapper');
let movingWrapper = document.querySelectorAll('[data-move]');
let settingsElement = document.getElementById('settings');
let circleCanvas = document.getElementById('circleCanvas');
let foodCanvas = document.getElementById('foodCanvas');

// zooming
let originalWidth;
let originalHeight;
let originalMarginTop;
let originalMarginLeft;

if (!zoomingWrapper || !movingWrapper) {
  const observer = new MutationObserver(() => {
    zoomingWrapper = document.getElementById('zoomingWrapper')
    movingWrapper = document.querySelectorAll('movingWrapper');
    if (zoomingWrapper && movingWrapper) {
      observer.disconnect();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
}

function resetSettings() {
  zoomInPressed = false;
  zoomOutPressed = false;
  squaresVisible = false;
  combined = false;
  gridMode = false;
  showShadow = true;
  settingsExtended = false;
  settingsVertical = false;
  groupByCategory = false;
  filterSwaps = true;
  showFoodExpenses = true;
  oneRadioUnchecked = false;

  totalBudget = startBudget;
  spreadMonthlyIncomeTo = 0;
  globallyLastDay = 0;
  verticalScaleFactor = 1.0;
  zoomLevel = 1.0;
  legendMultiplier = 100;
  maxHeight = 500;
  startHeight = 0.0;
  budget = 0.0;
  lowest = 0.0;
  highest = 0.0;
  moveOffsetX = 0.0;
  moveOffsetY = 0.0;
  dragstartX = 0.0;
  dragstartXstorage = 0.0;
  dragstartY = 0.0;
  dragstartYstorage = 0.0;
  ts1 = 0;
  ts2 = 0;

  startDate = tempDateOffset.getDate() + '.' + (tempDateOffset.getMonth() + 1) + '.' + ('' + tempDateOffset.getFullYear()).slice(2);
  endDate = '';
  backgroundColor = '25, 25, 25';
  lineColor = '255, 0, 0';
  uiColor = '255, 255, 255';

  settingsElement.style.backgroundColor = backgroundColor;
  document.body.style.backgroundColor = backgroundColor;
  zoomingWrapper.style.backgroundColor = backgroundColor;

  clearSessionStorage();
  clearLines();
  location.reload(true);
  initTextLines();
  setColorDefault();
  initControls();
  initDrawing();
}

function resetHTML() {
  dateLines = [];
  path = [];
  linepoints = [];
  monthlyEntries = [];
  incomeEntries = [];
  cashEntries = [];
  amazonEntries = [];
  paypalEntries = [];
  foodEntries = [];
  takeoutEntries = [];
  gasEntries = [];
  debtEntries = [];
  restEntries = [];
  zoomLevel = 1.0;

  canvas = document.getElementById('canvas');
  pathCanvas = document.getElementById('pathCanvas');
  pathBlurCanvas = document.getElementById('pathBlurCanvas');
  uiLine = document.getElementById('uiLine');
  uiCanvas = document.getElementById('uiCanvas');
  uiCanvasHorizontal = document.getElementById('uiCanvasHorizontal');
  uiCanvasVertical = document.getElementById('uiCanvasVertical');
  overflowWrapper = document.getElementById('overflowWrapper');
  zoomingWrapper = document.getElementById('zoomingWrapper');
  movingWrapper = document.getElementById('movingWrapper');
  settingsElement = document.getElementById('settings');
  circleCanvas = document.getElementById('circleCanvas');
  foodCanvas = document.getElementById('foodCanvas');

  overflowWrapper.style.width = canvasWidth + 'px';
  overflowWrapper.style.height = canvasHeight + 'px';

  zoomingWrapper.style.width = canvasWidth + 'px';
  zoomingWrapper.style.height = canvasHeight + 'px';

  movingWrapper.style.width = canvasWidth + 'px';
  movingWrapper.style.height = canvasHeight + 'px';

  canvas.style.opacity = '100%';
  pathCanvas.style.opacity = '0%';
  pathBlurCanvas.style.opacity = '0%';

  canvas.innerHTML = '';
  uiLine.innerHTML = '';
  uiCanvas.innerHTML = '';
  pathCanvas.innerHTML = '';
  pathBlurCanvas.innerHTML = '';
  uiCanvasVertical.innerHTML = '';
  uiCanvasHorizontal.innerHTML = '';

  canvas.style.marginTop = '';
  canvas.style.marginLeft = '';
  uiCanvas.style.marginTop = '';
  uiCanvas.style.marginLeft = '';
  pathCanvas.style.marginTop = '';
  pathCanvas.style.marginLeft = '';
  pathBlurCanvas.style.marginTop = '';
  pathBlurCanvas.style.marginLeft = '';
  uiCanvasVertical.style.marginLeft = '';
  uiCanvasHorizontal.style.marginTop = '';
  uiCanvasHorizontal.style.marginLeft = '';

  uiCanvasVertical.style.marginTop = canvasHeight + 'px';
  pathCanvas.setAttribute('height', (canvasHeight) + 'px');
  pathCanvas.setAttribute('width', (canvasWidth - 100) + 'px');
  pathBlurCanvas.setAttribute('height', (canvasHeight) + 'px');
  pathBlurCanvas.setAttribute('width', (canvasWidth - 100) + 'px');
  uiLine.style.marginLeft = '';
  uiLine.style.width = (2 * canvasWidth) + 'px';
  uiLine.style.height = (2 * canvasHeight) + 'px';
  uiLine.style.marginTop = - canvasHeight + 'px';
  uiLine.setAttribute('width', (2 * canvasWidth) + 'px');
  uiLine.setAttribute('height', (2 * canvasHeight) + 'px');
  uiLineTemp.style.marginLeft = '';
  uiLineTemp.style.marginTop = '-700px';
  uiLineTemp.style.width = (2 * canvasWidth) + 'px';
  uiLineTemp.style.height = (2 * canvasHeight) + 'px';
  uiLineTemp.style.marginTop = - canvasHeight + 'px';
  uiLineTemp.setAttribute('width', (2 * canvasWidth) + 'px');
  uiLineTemp.setAttribute('height', (2 * canvasHeight) + 'px');

  for (let i = 0; i < categories.length; i++) {
    document.getElementById('legend-' + categories[i] + '-negative').innerHTML = '';
    document.getElementById('legend-' + categories[i] + '-positive').innerHTML = '';
  }
}

function initDrawing() {
  document.getElementById('spinner-element').style.display = 'block';

  setTimeout(() => {
    resetHTML();
    clearCanvases();

    originalWidth = zoomingWrapper.offsetWidth;
    originalHeight = zoomingWrapper.offsetHeight;
    originalMarginTop = parseInt(zoomingWrapper.style.marginTop.slice('0, -2'));
    originalMarginLeft = parseInt(zoomingWrapper.style.marginLeft.slice('0, -2'));

    maxHeight = getMaxPriceDiff();
    updateMaxHeightAround();

    requestIdleCallback(() => {
      drawPath(pathCanvas, 1, 0); // draws 2px solid line
      drawBlurPath();             // draws opaque background below path
      hidePathBlurTop();          // caps blurred paths above path

      setAmounts();
      setDates();
    });

    requestIdleCallback(() => {
      drawLegends();
    });

    requestIdleCallback(() => {
      drawTable();
    });

    drawCanvas();

    document.getElementById('spinner-element').style.display = 'none';
  }, 2);
}

function clearCanvases() {
  pathCanvas.getContext('2d').clearRect(0, 0, pathCanvas.width, pathCanvas.height);
  pathBlurCanvas.getContext('2d').clearRect(0, 0, pathBlurCanvas.width, pathBlurCanvas.height);
}

function drawPath(cnvs, opacity, yOffset) {
  ctx = cnvs.getContext('2d');
  for (let i = 0; i < path.length - 1; i++) {
    drawLine(ctx,
      parseInt(path[i][1]),
      parseInt(path[i][0] + yOffset),
      parseInt(path[i+1][1]),
      parseInt(path[i+1][0] + yOffset),
      `rgba(${removeRGB(lineColor)}, ${opacity})`,
      2);
  }
}

function drawBlurPath() {
  for (let j = shadowCount; j >= 0; j--) {
    drawPath(pathBlurCanvas, (shadowCount - j) / shadowCount, j * shadowDistance * verticalScaleFactor - 10);
  }
}

function hidePathBlurTop() {
  ctx = pathBlurCanvas.getContext('2d');

  // Fill the area below the graph with a fade effect
  ctx.beginPath();
  if (path[0] && path[0][0] && path[0][1]) {
    ctx.moveTo(parseInt(path[0][1]), parseInt(path[0][0]));
  }

  ctx.fillStyle = backgroundColor;

  // Draw the shape
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(parseInt(path[i][1]), parseInt(path[i][0]));
  }

  ctx.lineTo(canvasWidth, -100);
  ctx.lineTo(-canvasHeight, -100);
  ctx.closePath();
  ctx.fill();
}

function setAmounts() {
  uiCanvasVertical.style.marginTop = -(canvasHeight) + 'px';
  const lowestOffsetTop = valueToMarginTop(lowest);
  const highestOffsetTop = valueToMarginTop(highest);
  const currentOffsetTop = valueToMarginTop(totalBudget);

  const rightValue = (originalWidth / zoomLevel) + 'px';
  if (currentOffsetTop - highestOffsetTop > 45) {
    let valueTop = document.createElement('p');
    valueTop.id = 'ui-element-value-top';
    valueTop.innerHTML = `<p class="uiElementTop">max:</p> <p class="uiElementBot">${formatNumber(highest)}€</p>`;
    valueTop.className = 'uiElement amount-text-max sticky-right';
    valueTop.style.backgroundColor = `rgba(${removeRGB(backgroundColor)}, 0.75)`;
    valueTop.style.marginTop = '' + highestOffsetTop + 'px';
    valueTop.style.marginLeft = '5px';
    valueTop.style.right = rightValue;
    uiCanvasVertical.appendChild(valueTop);

    let valueCurrent = document.createElement('p');
    valueCurrent.id = 'ui-element-value-top';
    valueCurrent.innerHTML = `<p class="uiElementTop">current:</p> <p class="uiElementBot">${formatNumber(totalBudget)}€</p>`;
    valueCurrent.className = 'uiElement amount-text-max sticky-right';
    valueCurrent.style.backgroundColor = `rgba(${removeRGB(backgroundColor)}, 0.75)`;
    valueCurrent.style.position = 'absolute';
    valueCurrent.style.marginTop = '' + currentOffsetTop + 'px';
    valueCurrent.style.marginLeft = '5px';
    valueCurrent.style.right = rightValue;
    uiCanvasVertical.appendChild(valueCurrent);
  } else {
    let valueBoth = document.createElement('p');
    valueBoth.id = 'ui-element-value-top';
    valueBoth.innerHTML = `<p class="uiElementTop small">max:</p> <p class="uiElementBot small">${formatNumber(highest)}€</p><p class="uiElementTop small">current:</p> <p class="uiElementBot">${formatNumber(totalBudget)}€</p>`;
    valueBoth.className = 'uiElement amount-text-max sticky-right combined';
    valueBoth.style.backgroundColor = `rgba(${removeRGB(backgroundColor)}, 0.75)`;
    valueBoth.style.marginTop = '' + highestOffsetTop + 'px';
    valueBoth.style.marginLeft = '5px';
    valueBoth.style.right = rightValue;
    uiCanvasVertical.appendChild(valueBoth);
  }

  let valueBottom = document.createElement('p');
  valueBottom.innerHTML = '<p class="uiElementTop">min:</p> <p class="uiElementBot">' + formatNumber(lowest) + '€</p>';
  valueBottom.className = 'uiElement amount-text-min';
  valueBottom.style.backgroundColor = `rgba(${removeRGB(backgroundColor)}, 0.75)`;
  valueBottom.style.marginTop = '' + lowestOffsetTop + 'px'
  valueBottom.style.marginLeft = '5px';
  uiCanvasVertical.appendChild(valueBottom);

  // draw Lines
  const uiColorClear = removeRGB(uiColor);
  for (let i = -50; i <= 250; i++) {
    let valueLine = document.createElement('div');
    valueLine.classList.add('value-line');
    if (i === 0)           { valueLine.style.backgroundColor = uiColor; valueLine.style.height = '3px'; }
    else if (i % 20 === 0) { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.7)'; }
    else if (i % 10 === 0) { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.4)'; }
    else if (i % 2 === 0)  { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.1)'; }
    else                   { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.02)'; }
    valueLine.style.opacity = '100%';
    valueLine.style.marginTop = `${parseInt(valueToMarginTop(i * 500))}px`;
    uiCanvasVertical.appendChild(valueLine);
  }

  // draw Amounts
  let amountHolder = document.createElement('div');
  amountHolder.id = 'amount-holder';
  amountHolder.style.backgroundColor = backgroundColor;
  for (let i = 100; i >= -10; i--) {
    if (pxToValue('0px') < 30000 || (pxToValue('0px') < 150000 && i % 5 === 0) || i % 10 === 0) {
      let valueText = document.createElement('div');
      valueText.classList.add('value-text');
      valueText.innerHTML = i + 'k';
      valueText.style.color = 'rgba(' + uiColorClear + ', 0.4)';
      if (i % 5 === 0)  { valueText.style.color = 'rgba(' + uiColorClear + ', 0.7)'; }
      if (i % 10 === 0) { valueText.style.color = 'rgba(' + uiColorClear + ', 1.0)'; }
      if (i === 0)      { valueText.style.color = 'rgba(' + uiColorClear + ', 1.0)'; }
      valueText.style.opacity = '100%';
      valueText.style.marginTop = `${parseInt(valueToMarginTop(i * 1000)) - 7}px`;
      amountHolder.appendChild(valueText);
    }
  }

  uiCanvasVertical.appendChild(amountHolder);
}

function setDates() {
  const uiColorClear = removeRGB(uiColor);
  const dateLineHeight = 2000 + valueToMarginTop(lowest) + 'px';

  let dateLeft = document.createElement('p');
  let tempLeft1 = allTextLines[allTextLines.length - 1].split(';');
  let tempLeft2 = tempLeft1[1].slice(1, -1).split('.');
  dateLeft.innerHTML = tempLeft2[0] + '.' + tempLeft2[1] + '.' + '20' + tempLeft2[2];
  dateLeft.className = 'uiElement';
  dateLeft.style.position = 'absolute';
  dateLeft.style.marginTop = '-40px';
  dateLeft.style.marginLeft = `${canvasWidth * 0.12}px`;
  dateLeft.style.visibility = 'visible';
  uiCanvasHorizontal.appendChild(dateLeft);

  let dateRight = document.createElement('p');
  let tempRight1 = allTextLines[1].split(';');
  let tempRight2 = tempRight1[1].slice(1, -1).split('.');
  dateRight.innerHTML = tempRight2[0] + '.' + tempRight2[1] + '.' + '20' + tempRight2[2];
  dateRight.className = 'uiElement';
  dateRight.style.position = 'absolute';
  dateRight.style.marginTop = '-40px';
  dateRight.style.marginLeft = `${canvasWidth * 0.77}px`;
  uiCanvasHorizontal.appendChild(dateRight);

  for (let i = 0; i < dateLines.length; i++) {
    let dateLine = document.createElement('div');
    dateLine.style.position = 'absolute';
    dateLine.style.zIndex = '80';
    dateLine.style.height = dateLineHeight;
    dateLine.style.width = '1px';
    dateLine.style.opacity = '100%';
    dateLine.style.marginTop = '-2000px';
    dateLine.style.marginLeft = `${parseInt(dateLines[i].slice(0, -2))}px`;

    dateLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.2)';;
    if (dateLines[i].charAt(0) === 'y') {
      dateLine.style.marginLeft = `${parseInt(dateLines[i].slice(1, -2))}px`;
      dateLine.style.backgroundColor = uiColor;
    }

    if (dateLines[i].charAt(0) === 'w') {
      dateLine.style.marginLeft = `${parseInt(dateLines[i].slice(1, -2))}px`;
      dateLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.05)';;
    }

    uiCanvasHorizontal.appendChild(dateLine);
  }
}

function drawCanvas() {
  path = [];
  dateLines = [];
  const paddingLeft = canvasWidth - 150 + moveOffsetX;
  let lastDayDiff = 0;
  let fgOffset = 0;

  monthlyEntries = incomeEntries = cashEntries = amazonEntries = paypalEntries = foodEntries = takeoutEntries = gasEntries = debtEntries = restEntries = [];

  // Remove last line if total is invalid
  if (!parseInt(allTextLines[allTextLines.length - 1][selectors.total].slice(1, -1))) {
    allTextLines.shift();
  }

  // Pre-compute date values
  const dates = allTextLines.map(line => {
    const entry = line.split(';');
    return {
      date: entry[selectors.date].slice(1, -1),
      total: entry[selectors.total].slice(1, -1),
      amount: entry[selectors.amount].slice(1, -1)
    };
  });

  const lastDay = dates[0].date;
  const firstDay = dates[dates.length - 1].date;
  const totalDays = (sortType === 'amount') ? dates.length : Math.abs(differenceInDays(firstDay, lastDay) + 2);
  const dayWidth = (canvasWidth - 300) / totalDays;
  const foregroundOffset = dayWidth / 4;

  // Pushing date lines
  for (let year = 0; year < 30; year++) {
    for (let month = 1; month <= 12; month++) {
      dateLines.push('' + parseInt(paddingLeft + (differenceInDays(lastDay, '1.' + month + '.' + (19 + year)) * dayWidth)) + 'px');
      if (month === 1) {
        dateLines[dateLines.length - 1] = 'y' + dateLines[dateLines.length - 1];
      }

      for (let day = 1; day <= 31; day++) {
        if (getDayOfWeek(day, month, year) === 'Wednesday') {
          dateLines.push('' + parseInt(paddingLeft + (differenceInDays(lastDay, day + '.' + month + '.' + (19 + year)) * dayWidth)) + 'px');
          dateLines[dateLines.length - 1] = 'w' + dateLines[dateLines.length - 1];
        }
      }
    }
  }

  const fragment = document.createDocumentFragment();
  let lastCategory = '';

  const performanceMode = dates.length > 1000 && !groupByCategory;
  console.log('performanceMode', performanceMode);
  for (let i = dates.length - 1; i >= 0; i--) {
    let entries = allTextLines[i].split(';');
    const entry = dates[i];
    const lastTotalValue = valueToMarginTop(dates[(i === 0 ? 0 : i - 1)].total);
    const totalValue = valueToMarginTop(entry.total);
    let nextTotalValue = valueToMarginTop(dates[i + 1]?.total);
    if (!nextTotalValue || isNaN(nextTotalValue)) {
      nextTotalValue = totalValue;
    }

    const value = entry.amount;
    let height = valueToPx(value);
    let diffDays = lastDayDiff - differenceInDays(entry.date, lastDay);
    if (diffDays < 0) {
      diffDays = 2;
    }

    const square = document.createElement('div');
    square.className = 'square';
    const category = getEntrieCategory(entries);

    if (performanceMode) {
      square.classList.add('square-relative');
      const amountSign = value.charAt(0) === '-' ? -1 : 1;
      const xPosition = paddingLeft - (lastDayDiff * dayWidth) + fgOffset;
      Object.assign(square.style, {
        height: `${Math.abs(height).toFixed(2)}px`,
        width: `${(dayWidth - fgOffset).toFixed(2)}px`,
        marginLeft: `${(xPosition - dayWidth).toFixed(2)}px`,
        marginTop: `${parseFloat((-height * (amountSign + 1)).toFixed(2)) + 0.02}px`,
        transform: `translateY(${(amountSign > 0 ? Math.abs(height) : 0).toFixed(2)}px)`
      });
      // set correct height to the "first" square
      if (i === dates.length - 1) {
        square.style.marginTop = `${valueToMarginTop(dates[dates.length - 1].total)}px`;
      }

      if (groupByCategory && lastCategory !== entries[selectors.category]) {
        lastCategory = entries[selectors.category];
        square.style.marginTop = `${valueToMarginTop(10)}px`;
      }
    } else {
      Object.assign(square.style, {
        height: `${Math.abs(height)}px`,
        marginTop: `${(value.charAt(0) !== '-') ? totalValue : nextTotalValue}px`
      });
    }
    // Fill empty days
    if (diffDays > 1 && sortType !== 'amount' && i < dates.length - 1) {
      const placeholder = document.createElement('div');
      placeholder.className = 'square placeholder';
      placeholder.classList.add(`${category}-background`);
      const width = (diffDays - 1) * dayWidth;
      Object.assign(placeholder.style, {
        height: '1px',
        width: `${width}px`,
        marginTop: `${performanceMode ? 0 : nextTotalValue}px`,
        marginLeft: `${paddingLeft - ((lastDayDiff - 1) * dayWidth)}px`
      });
      fragment.appendChild(placeholder);
    }

    lastDayDiff = differenceInDays(entry.date, lastDay);
    if (sortType === 'amount') {
      lastDayDiff = i;
    }

    // Differentiate negative Events
    if (value.charAt(1) === '-') {
      square.classList.add('negative-background');
      square.category = 'Sonstige Abbuchung';
    }

    // Make foreground squares smaller
    if (diffDays > 0) {
      fgOffset = 0;
    }

    const lastWasNegative = allTextLines[i + 1]?.split(';')[selectors.amount]?.charAt(1) === '-';
    if (diffDays === 0 && ((value.charAt(0) === '-' && !lastWasNegative) || (value.charAt(0) !== '-' && lastWasNegative))) {
      fgOffset += foregroundOffset;
    }

    // Adjust width and marginLeft after fgOffset
    let width = dayWidth - 2 - fgOffset;
    square.style.width = `${width > 0 ? width : 1}px`;
    square.style.marginLeft = `${paddingLeft - (lastDayDiff * dayWidth) + fgOffset}px`;

    if (entries[selectors.content] && entries[selectors.content].charAt('1') === '_') {
      square.style.opacity = '50%';
    }

    // Push Path Points
    if (i < dates.length - 5) {
      path.push([lastTotalValue, paddingLeft - (lastDayDiff * dayWidth)]);
    }

    // Legend filling - Kategorien
    square.classList.add(`${category}-background`);
    square.category = category;
    square.source = entries[selectors.source].slice(1, -1);
    categorizeEntries(entries, category !== 'others', i); // Pass index 'i' as argument

    // Adding Popups
    square.index = i;
    const total = numberToCurrency(parseFloat(entry.total));
    setupHover(square, value, entry.date, total, entries[selectors.purpose].slice(1, -1).replace(/[0-9]/g, ' ').replace(/-/g, ' ').replace(/\./g, ' ').replace(/  /g, ' ').replace(/ ,/g, '').replace(/ :/g, ''));
    fragment.appendChild(square);
  }

  canvas.appendChild(fragment);
}

function categorizeEntries(entries, decided, index) {
  const entryCatergory = getEntrieCategory(entries);
  if (entryCatergory === 'monthly') { monthlyEntries.push(allTextLines[index]); }
  if (entryCatergory === 'income') { incomeEntries.push(allTextLines[index]); }
  if (entryCatergory === 'cash') { cashEntries.push(allTextLines[index]); }
  if (entryCatergory === 'amazon') { amazonEntries.push(allTextLines[index]); }
  if (entryCatergory === 'paypal') { paypalEntries.push(allTextLines[index]); }
  if (entryCatergory === 'food') { foodEntries.push(allTextLines[index]); }
  if (entryCatergory === 'takeout') { takeoutEntries.push(allTextLines[index]); }
  if (entryCatergory === 'gas') { gasEntries.push(allTextLines[index]); }
  if (entryCatergory === 'debt') { debtEntries.push(allTextLines[index]); }

  if (!decided) {
    restEntries.push(allTextLines[index]);
  }
}

function setupHover(square, value, date, total, content) {
  square.onmouseover = function(event) {
    const popup = document.getElementById('singlePopup'); // Get the single popup element
    popup.classList.add('fade');
    popup.style.top = `${event.clientY}px`;
    popup.style.left = `${event.clientX + 25}px`;
    const marginLeft = square.style.marginLeft ? square.style.marginLeft : window.getComputedStyle(square).marginLeft;
    // Update popup content
    const dateParts = date.split('.');
    popup.innerHTML = `
      <div class="grid-wrapper">
        <span class="popup-text">Index                  </span><span class="popup-text">${square.index + 1}</span>
        <span class="popup-text">Content                </span><span class="popup-text-small marquee"><span>${content}</span></span>
        <hr></hr><hr></hr>
        <span class="popup-text">Date                   </span><span class="popup-text">${date}</span>
        <span class="popup-text">Value                  </span><span class="popup-text">${numberToCurrency(value)}</span>
        <hr></hr><hr></hr>
        <span class="popup-text">Total                  </span><span class="popup-text">${total}</span>
        <span class="popup-text">Category               </span><span class="popup-text">${square.category}</span>
        <span class="popup-text">Source                 </span><span class="popup-text">${square.source}</span>
        <hr></hr><hr></hr>
        <span class="popup-text-small">Margin-Top       </span><span class="popup-text-small">${square.style.marginTop}</span>
        <span class="popup-text-small">Margin-Left      </span><span class="popup-text-small">${marginLeft}</span>
        <span class="popup-text-small">Width            </span><span class="popup-text-small">${square.style.width}</span>
        <span class="popup-text-small">Height           </span><span class="popup-text-small">${square.style.height}</span>
        <span class="popup-text-small">Calculated Total </span><span class="popup-text-small">${numberToCurrency(parseFloat(pxToValue(square.offsetTop + 'px')) + (parseFloat(value) < 0 ? parseFloat(value) : 0))}</span>
        <span class="popup-text-small">Calculated Date  </span><span class="popup-text-small">${pxToDate(marginLeft)}</span>
        <span class="popup-text-small">Day of Week      </span><span class="popup-text-small">${getDayOfWeek(dateParts[0], dateParts[1], dateParts[2])}</span>
      </div>
    `;
  };

  square.onmousemove = function(event) {
    let popup = document.getElementById('singlePopup');
    popup.style.top = `${event.clientY}px`;
    popup.style.left = `${event.clientX + 25}px`;
  };

  square.onmouseout = function() {
    document.getElementById('singlePopup').classList.remove('fade');
  };
}

function drawLegends() {
  const legendSquareHolders = document.getElementsByClassName('legend-square-holder');
  Array.from(legendSquareHolders).forEach(holder => {
    holder.innerHTML = '';
  });

  let positiveTotal = 0;
  positiveTotal += getTotal(monthlyEntries, true);
  positiveTotal += getTotal(incomeEntries, true);
  positiveTotal += getTotal(cashEntries, true);
  positiveTotal += getTotal(amazonEntries, true);
  positiveTotal += getTotal(paypalEntries, true);
  positiveTotal += getTotal(foodEntries, true);
  positiveTotal += getTotal(takeoutEntries, true);
  positiveTotal += getTotal(gasEntries, true);
  positiveTotal += getTotal(restEntries, true);

  let negativeTotal = 0;
  negativeTotal += getTotal(monthlyEntries, false);
  negativeTotal += getTotal(incomeEntries, false);
  negativeTotal += getTotal(cashEntries, false);
  negativeTotal += getTotal(amazonEntries, false);
  negativeTotal += getTotal(paypalEntries, false);
  negativeTotal += getTotal(foodEntries, false);
  negativeTotal += getTotal(takeoutEntries, false);
  negativeTotal += getTotal(gasEntries, false);
  negativeTotal += getTotal(restEntries, false);

  let maxTotal = positiveTotal;
  if (negativeTotal > positiveTotal) {
    maxTotal = negativeTotal;
  }

  drawPositiveLegend(maxTotal, monthlyEntries, 'monthly');
  drawPositiveLegend(maxTotal, incomeEntries, 'income');
  drawPositiveLegend(maxTotal, cashEntries, 'cash');
  drawPositiveLegend(maxTotal, amazonEntries, 'amazon');
  drawPositiveLegend(maxTotal, paypalEntries, 'paypal');
  drawPositiveLegend(maxTotal, takeoutEntries, 'takeout');
  drawPositiveLegend(maxTotal, foodEntries, 'food');
  drawPositiveLegend(maxTotal, gasEntries, 'gas');
  drawPositiveLegend(maxTotal, restEntries, 'others');

  drawNegativeLegend(maxTotal, monthlyEntries, 'monthly');
  drawNegativeLegend(maxTotal, incomeEntries, 'income');
  drawNegativeLegend(maxTotal, cashEntries, 'cash');
  drawNegativeLegend(maxTotal, amazonEntries, 'amazon');
  drawNegativeLegend(maxTotal, paypalEntries, 'paypal');
  drawNegativeLegend(maxTotal, foodEntries, 'food');
  drawNegativeLegend(maxTotal, takeoutEntries, 'takeout');
  drawNegativeLegend(maxTotal, gasEntries, 'gas');
  drawNegativeLegend(maxTotal, restEntries, 'others');

  drawTotalLegend(maxTotal, monthlyEntries, 'monthly');
  drawTotalLegend(maxTotal, incomeEntries, 'income');
  drawTotalLegend(maxTotal, cashEntries, 'cash');
  drawTotalLegend(maxTotal, amazonEntries, 'amazon');
  drawTotalLegend(maxTotal, paypalEntries, 'paypal');
  drawTotalLegend(maxTotal, foodEntries, 'food');
  drawTotalLegend(maxTotal, takeoutEntries, 'takeout');
  drawTotalLegend(maxTotal, gasEntries, 'gas');
  drawTotalLegend(maxTotal, restEntries, 'others');
}

function drawTotalLegend(total, input, groupname) {
  const totalAmount = Math.abs(getTotal(input, false) - getTotal(input, true));
  const legendId = totalAmount > 0 ? 'legend-total-positive' : 'legend-total-negative';
  const legend = document.getElementById(legendId);

  const legendSquare = document.createElement('div');
  legendSquare.className = `legendsquare ${groupname}-background`;
  legendSquare.style.height = `${legendMultiplier * totalAmount / total}px`;
  if (groupname === 'negative') {
    legendSquare.classList.replace(`${groupname}-background`, 'positive-background');
  }

  legend.appendChild(legendSquare);
}

function drawLegend(total, input, groupname, isPositive) {
  const legend = document.getElementById(`legend-${groupname}-${isPositive ? 'positive' : 'negative'}`);
  input.forEach(entry => {
    const entries = entry.split(';');
    const amount = parseFloat(entries[selectors.amount].slice(1, -1));
    if ((isPositive && entries[selectors.amount].charAt(1) !== '-') || 
        (!isPositive && entries[selectors.amount].charAt(1) === '-')) {
      const legendSquare = document.createElement('div');
      legendSquare.className = 'legendsquare ' + groupname + '-background';
      legendSquare.style.height = `${legendMultiplier * Math.abs(amount) / total}px`;
      legend.appendChild(legendSquare);
    }
  });
}

function drawNegativeLegend(total, input, groupname) {
  drawLegend(total, input, groupname, false);
}

function drawPositiveLegend(total, input, groupname) {
  drawLegend(total, input, groupname, true);
}

function drawTable() {
  const table = document.getElementById('table');
  table.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const lines = [firstLine, ...allTextLines];

  // Cache CSS classes and properties
  const rowHolder = document.createElement('div');
  rowHolder.className = 'row-holder';

    // Create and append cells in the specified order
  const cellConfigs = [
    { index: 0, width: '1vw', align: 'end', isIndex: true },
    { index: selectors.date, width: '5vw', align: 'end' },
    { index: selectors.content, width: '10vw' },
    { index: selectors.beneficiary, width: '20vw' },
    { index: selectors.purpose, width: '30vw', flex: 'auto' },
    { index: selectors.source, width: '5vw' },
    { index: selectors.category, width: '5vw' },
    { index: selectors.amount, width: '5vw', align: 'end'},
    { index: selectors.total, width: '5vw', align: 'end' }
  ];

  // Main table construction
  for (let i = 0; i < lines.length; i++) {
    const entries = lines[i].split(';');
    const row = document.createElement('div');
    const isHeader = i === 0;
    // Row setup
    row.id = `row${i}`;
    row.className = `row${isHeader ? ' header-row' : ''}`;
    // Create cells
    for (const config of cellConfigs) {
      const cell = document.createElement('p');
      cell.className = 'cell';
      // Cell content
      cell.textContent = config.isIndex ? (isHeader ? '' : `${i}`) : (entries[config.index]?.slice(1, -1) || '');
      // Cell styling
      let style = '';
      if (config.width) style += `width:${config.width};`;
      if (config.align) style += `text-align:${config.align};`;
      if (config.flex) style += `flex:${config.flex};`;
      cell.style.cssText = style;
      // Special amount handling
      if (config.index === selectors.amount && !isHeader) {
        const amount = entries[config.index] || '';
        cell.classList.add(amount.charAt(1) !== '-' ? 'positive-background' : 'negative-background');
      }

      if (isHeader) {
        if (config.index === selectors.date) cell.textContent = 'Day';
        if (config.index === selectors.content) cell.textContent = 'Content';
        if (config.index === selectors.beneficiary) cell.textContent = 'Beneficiary';
        if (config.index === selectors.purpose) cell.textContent = 'Purpose';
        if (config.index === selectors.source) cell.textContent = 'Source';
        if (config.index === selectors.category) cell.textContent = 'Category';
        if (config.index === selectors.amount) cell.textContent = 'Amount';
      }

      row.appendChild(cell);
    }

    // Category styling
    const category = entries[selectors.category]?.slice(1, -1);
    if (category) row.classList.add(`${category}-background-transparent`);

    // Add to fragment
    const clone = rowHolder.cloneNode();
    clone.appendChild(row);
    fragment.appendChild(clone);
  }

  table.appendChild(fragment);
}
