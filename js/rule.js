$(document).ready(function () {
  // Set the worker source for pdf.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  // Read the first file (umsatz.csv)
  $.ajax({
    type: "GET",
    url: "umsatz.csv",
    dataType: "text",
    error: function (xhr, status, error) {
      console.error("AJAX Error:", error);
    },
    success: function (data) {
      dataset = data;
      resetHTML();
      getFromSessionStorage();
      initTextLines();
      initControls();
      init();
    }
  });
});

// Constants
const STARTBUDGET = 9807.20;
const ZOOMFACTOR = 0.8;
const EXTRAAREA = 0.00;
const categories = ['monthly' , 'amazon', 'paypal', 'food', 'ospa', 'negative', 'gas'];
const constantPositions = [
//  '"DE45150505001101110771";"";"";"SCHULDEN";"mir gegenüber";"";"";"";"";"";"";"Sarah";"";"";"40";"EUR";""'
];

const selectors= {
  'date': 1,
  'content': 3,
  'purpose': 4,
  'beneficiary': 11,
  'amount': 14,
  'total': 17
};

const replacements = [
//  selectors.purpose + ';Miete + Strom + Internet;' + selectors.amount + ';-1300'
]

// path drawing
const pathThickness = 2;
const shadowLength = 100; // how large the shadow should be
const shadowDistance = 4; // spacing between each blurred line

// Variables
let totalBudget = STARTBUDGET;

let zoomInPressed = false;
let zoomOutPressed = false;
let pathMode = false;
let gridMode = false;
let showShadow = true;
let optionsExtended = false;

let dataset;

let verticalZoomFactor = 1.0;
let pastEventsOffset = 0;
let pastEvents = 250;

let legendMultiplier = 100;
let maxHeight = 500;
let startHeight = 0.0;
let endbudget = 0.0;
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

let startDate = "";
let endDate = "";
let sortType = "date";

let backgroundColor = '35, 35, 35';
let lineColor = '255, 0, 0';
let gridColor = '255, 255, 255';

let pdfImportedLines = [];
let allTextLines = [];
let cutTextLines = [];
let dateLines = [];
let path = [];
let linepoint = [];

let amazonEntries = [];
let paypalEntries = [];
let foodEntries = [];
let monthlyEntries = [];
let ospaEntries = [];
let gasEntries = [];
let restEntries = [];

function resetSettings() {
  zoomInPressed = false;
  zoomOutPressed = false;
  pathMode = false;
  gridMode = false;
  showShadow = true;

  totalBudget = STARTBUDGET;
  verticalZoomFactor = 1.0;
  pastEventsOffset = 0;
  pastEvents = 250;
  legendMultiplier = 100;
  maxHeight = 500;
  startHeight = 0.0;
  endbudget = 0.0;
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

  startDate = "";
  endDate = "";
  backgroundColor = '35, 35, 35';
  lineColor = '255, 0, 0';
  gridColor = '255, 255, 255';

  document.getElementById('staticwrapper').style.backgroundColor = backgroundColor;
  document.getElementById('settings').style.backgroundColor = backgroundColor;
  document.body.style.backgroundColor = backgroundColor;

  clearSessionStorage();
  clearLines();
  resetHTML();
  initTextLines();
  initControls();
  init();
}

function resetHTML() {
  dateLines = [];
  path = [];
  linepoint = [];
  amazonEntries = [];
  paypalEntries = [];
  foodEntries = [];
  monthlyEntries = [];
  ospaEntries = [];
  gasEntries = [];
  restEntries = [];

  let canvas = document.getElementById('canvas');
  let pathCanvas = document.getElementById('pathCanvas');
  let pathBlurCanvas = document.getElementById('pathBlurCanvas');
  let uiline = document.getElementById('uiline');
  let uicanvas = document.getElementById('uicanvas');
  let uipopup = document.getElementById('uipopup');

  canvas.style.opacity = '100%';
  pathCanvas.style.opacity = '0%';
  pathCanvas.innerHTML = '';
  pathBlurCanvas.style.opacity = '0%';
  pathBlurCanvas.innerHTML = '';
  uiline.innerHTML = '';
  uicanvas.innerHTML = '';
  uipopup.innerHTML = '';
  canvas.innerHTML = '';

  canvas.style.marginLeft = '';
  canvas.style.marginTop = '';
  pathCanvas.style.marginLeft = '';
  pathCanvas.style.marginTop = '';
  pathBlurCanvas.style.marginLeft = '';
  pathBlurCanvas.style.marginTop = '';
  uiline.style.marginLeft = '';
  uiline.style.marginTop = '-600px';
  uilinetemp.style.marginLeft = '';
  uilinetemp.style.marginTop = '-600px';

  for (let i = 0; i < categories.length; i++) {
    document.getElementById('legend-' + categories[i] + '-negative').innerHTML = '';
    document.getElementById('legend-' + categories[i] + '-positive').innerHTML = '';
  }
}

function initTextLines() {
  allTextLines = dataset.split(/\r\n|\n/);
  allTextLines = allTextLines.filter(function(item) {
    return item !== '' && item !== '.';
  });

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

        line = "";
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

  if (pastEvents > allTextLines.length - 1) {
    pastEvents = allTextLines.length - 1;
  }

  cutTextLines = allTextLines.slice(pastEventsOffset, pastEventsOffset + pastEvents + 1);

  //insert date into constant positions
  const currentDate = new Date();
  const currentDateString = '"' + addZeroToSingleDigit(currentDate.getDate()) + '.' + addZeroToSingleDigit(currentDate.getMonth() + 1) + '.' + ('' + currentDate.getFullYear()).slice(2) + '"';
  for (let i = 0; i < constantPositions.length; i++) {
    let positionParts = constantPositions[i].split(';');
    let temp = positionParts[0] + ';';
    temp += currentDateString + ';' + currentDateString + ';';
    for (let j = 3; j < positionParts.length; j++) {
      temp  += positionParts[j] + ';';
    }

    temp = temp.slice(0, -1);
    constantPositions[i] = temp;
  }

  totalBudget = STARTBUDGET;

  //pushing constant positions
  for (let i = 0; i < constantPositions.length; i++) {
    const value = constantPositions[i].split(';')[selectors.amount].slice(1, -1);
    totalBudget += parseInt(value);
    cutTextLines.splice(1, 0, constantPositions[i]);
  }

  let tempBudget = totalBudget;
  for (let i = 0; i < cutTextLines.length; i++) {
    let entries = cutTextLines[i].split(';');
    if (i > 0 && entries.length > 13) {
      tempBudget -= parseFloat(entries[selectors.amount].slice(1, -1));
      cutTextLines[i] += ';' + tempBudget;
    }
  }

  if (sortType === 'amount') {
    fixSortedArray(cutTextLines, 14);
  }
}

function fixSortedArray(arr, fieldIndex) {
  if (arr.length <= 1) {
    return;
  }

  const firstElement = arr[0];

  sortArrayByField(arr, fieldIndex);

  arr.unshift(firstElement);
  arr.pop();
}

function sortArrayByField(arr, fieldIndex) {
  arr.sort(function (a, b) {
    const aValue = parseInt(a.split(';')[fieldIndex].slice(1, -1));
    const bValue = parseInt(b.split(';')[fieldIndex].slice(1, -1));

    if (isNaN(aValue)) return 1; // Treat non-integer values as greater
    if (isNaN(bValue)) return -1; // Treat non-integer values as greater

    return aValue - bValue;
  });
}

function clearSessionStorage() {
  sessionStorage.setItem('pastEvents', '');
  sessionStorage.setItem('pastEventsOffset', '');
  sessionStorage.setItem('backgroundColor', '');
  sessionStorage.setItem('lineColor', '');
  sessionStorage.setItem('gridColor', '');
  sessionStorage.setItem('optionsExtended', '');
  sessionStorage.setItem('sortType', '');
  sessionStorage.setItem('verticalZoomFactor', '');
  sessionStorage.setItem('legendMultiplyer', '');
}

function getFromSessionStorage() {
  let sessionValue = sessionStorage.getItem("pastEvents");
  if (sessionValue && parseInt(sessionValue) >= 0) {
    pastEvents = parseInt(sessionValue);
  }

  sessionValue = sessionStorage.getItem("pastEventsOffset");
  if (sessionValue && parseInt(sessionValue) >= 0) {
    pastEventsOffset = parseInt(sessionValue);
  }

  sessionValue = sessionStorage.getItem("backgroundColor");
  if (sessionValue && sessionValue.length > 0) {
    backgroundColor = sessionValue;
    document.getElementById('staticwrapper').style.backgroundColor = sessionValue;
    document.getElementById('background-color-picker').value = rgbToHex(sessionValue);
  }

  sessionValue = sessionStorage.getItem("lineColor");
  if (sessionValue && sessionValue.length > 0) {
    lineColor = sessionValue;
    document.getElementById('line-color-picker').value = rgbToHex(sessionValue);
  }

  sessionValue = sessionStorage.getItem("gridColor");
  if (sessionValue && sessionValue.length > 0) {
    gridColor = sessionValue;
    document.getElementById('grid-color-picker').value = rgbToHex(sessionValue);
  }

  sessionValue = sessionStorage.getItem("sortType");
  if (sessionValue && sessionValue.length > 0) {
    sortType = sessionValue;
  }

  sessionValue = sessionStorage.getItem("verticalZoomFactor");
  if (sessionValue && sessionValue.length > 0) {
    verticalZoomFactor = sessionValue;
  }

  sessionValue = sessionStorage.getItem("legendMultiplyer");
  if (sessionValue && sessionValue.length > 0) {
    legendMultiplier = sessionValue;
  }

  sessionValue = sessionStorage.getItem("optionsExtended");
  if (sessionValue && sessionValue.length > 0) {
    if (sessionValue === 'true') {
      optionsExtended = true;
      document.getElementById('settings').classList.add('settings-hidden');
    } else {
      optionsExtended = false;
      document.getElementById('settings').classList.remove('settings-hidden');
    }
  }
}

function init() {
  maxHeight = getMaxHeight();
  getMaxHeightAround();

  drawCanvas();
  drawPath();         //draws 2px solid line
  drawBlurPath();     //draws opaque background below path
  hidePathBlurTop();  //caps blurred paths above path

  setAmounts();
  setDates();

  drawLegends();
  drawTable();

  pathMode = !pathMode;
  togglePath();
}

function drawPath() {
  let canvas = document.getElementById('pathCanvas'),
  ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const lineColorParts = lineColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  for (let i = 0; i < path.length - 1; i++) {
    drawLine(ctx,
      parseInt(path[i][1]),
      parseInt(path[i][0]),
      parseInt(path[i+1][1]),
      parseInt(path[i+1][0]),
      `rgb(${lineColorParts[0]}, ${lineColorParts[1]}, ${lineColorParts[2]})`,
      2);
  }
}

function drawBlurPath() {
  let blurCanvas = document.getElementById('pathBlurCanvas'),
  ctx = blurCanvas.getContext('2d');
  ctx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
  const lineColorParts = lineColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  for (let i = shadowLength/shadowDistance; i >= 0; i--) {
    for (let j = 0; j < path.length - 1; j++) {
      const heightFactor = 1000 / path[j][0];
      drawLine(ctx,
        parseInt(path[j][1]),
        parseInt(path[j][0] - 20 + i * shadowDistance * verticalZoomFactor),
        parseInt(path[j+1][1]),
        parseInt(path[j+1][0] - 20 + i * shadowDistance*verticalZoomFactor),
        `rgba(${lineColorParts[0]}, ${lineColorParts[1]}, ${lineColorParts[2]}, ${(shadowLength/shadowDistance - i) / 200 * heightFactor})`,
        1);
    }
  }

  blurCanvas.style.filter = 'blur(5px)';
}

function hidePathBlurTop() {
  const backgroundColorParts = backgroundColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  let canvas = document.getElementById('pathBlurCanvas'),
  ctx = canvas.getContext('2d');

  // Fill the area below the graph with a fade effect
  ctx.beginPath();
  ctx.moveTo(parseInt(path[0][1]), parseInt(path[0][0]));

  ctx.fillStyle = `rgb(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]})`;

  // Draw the shape
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(parseInt(path[i][1]), parseInt(path[i][0]));
  }

  ctx.lineTo(1200, -100);
  ctx.lineTo(-500, -100);
  ctx.closePath();
  ctx.fill();
}

function setAmounts() {
  const uiCanvas = document.getElementById('uicanvas');
  const backgroundColorParts = backgroundColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  uiCanvas.style.marginTop  = -EXTRAAREA + 'px';
  uiCanvas.style.marginLeft = -EXTRAAREA + 'px';
  let valueTop = document.createElement('p');
  valueTop.innerHTML = '<p class="uiElementTop">max:</p> <p class="uiElementBot">' + parseInt(highest) + ',00€</p>';
  valueTop.className = 'uiElement';
  valueTop.classList.add('vertical');
  valueTop.classList.add('amount-texts');
  valueTop.style.backgroundColor = `rgba(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]}, 0.75)`;
  valueTop.style.marginTop = '' + parseInt(530 - valueToPx(highest) + valueToPx(lowest) + EXTRAAREA) + 'px';
  valueTop.style.marginLeft = '' + (5 + EXTRAAREA) + 'px';
  uiCanvas.appendChild(valueTop);

  let valueBottom = document.createElement('p');
  valueBottom.innerHTML = '<p class="uiElementTop">min:</p> <p class="uiElementBot">' + parseInt(lowest) + ',00€</p>';
  valueBottom.className = 'uiElement';
  valueBottom.classList.add('vertical');
  valueBottom.classList.add('amount-texts');
  valueBottom.style.backgroundColor = `rgba(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]}, 0.75)`;
  valueBottom.style.marginTop = '' + (525 + EXTRAAREA) + 'px'
  valueBottom.style.marginLeft = '' + (5 + EXTRAAREA) + 'px';
  uiCanvas.appendChild(valueBottom);

  //draw Lines
  for (let i = 0; i < 100; i++) {
    let valueLine = document.createElement('div');
    valueLine.classList.add('vertical');
    valueLine.classList.add('value-line');
    const gridColorParts = gridColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
    const gridColorClear = `${gridColorParts[0]}, ${gridColorParts[1]}, ${gridColorParts[0]}`;

    valueLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 0.02)';
    if (i % 2 === 0)  { valueLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 0.1)'; }
    if (i % 10 === 0) { valueLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 0.4)'; }
    if (i % 20 === 0) { valueLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 0.7)'; }
    if (i === 0) {      valueLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 1.0)'; valueLine.style.height = '2px'; }

    valueLine.style.opacity = '100%';
    valueLine.style.marginTop = '' + parseInt(550 - valueToPx(i * 500) + valueToPx(lowest) + EXTRAAREA) + 'px';
    uiCanvas.appendChild(valueLine);
  }

  //draw Amounts
  let amountHolder = document.createElement('div');
  amountHolder.classList.add('amount-holder');
  amountHolder.classList.add('vertical');
  amountHolder.style.backgroundColor = `rgb(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]})`;
  for (let i = 20; i >= -10; i--) {
    let valueText = document.createElement('div');
    valueText.classList.add('value-text');
    valueText.innerHTML = i + 'k';

    const gridColorParts = gridColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
    const gridColorClear = `${gridColorParts[0]}, ${gridColorParts[1]}, ${gridColorParts[0]}`;
    valueText.style.color = 'rgba(' + gridColorClear + ', 0.1)';
    if (i % 2 === 0)  { valueText.style.color = 'rgba(' + gridColorClear + ', 0.3)'; }
    if (i % 10 === 0) { valueText.style.color = 'rgba(' + gridColorClear + ', 0.6)'; }
    if (i % 20 === 0) { valueText.style.color = 'rgba(' + gridColorClear + ', 0.8)'; }
    if (i === 0)      { valueText.style.color = 'rgba(' + gridColorClear + ', 1.0)'; }

    valueText.style.opacity = '100%';
    valueText.style.marginTop = '' + parseInt(550 - valueToPx(i * 1000) + valueToPx(lowest) + EXTRAAREA) + 'px';
    amountHolder.appendChild(valueText);
  }

  uiCanvas.appendChild(amountHolder);
}

function setDates() {
  const uiCanvas = document.getElementById('uicanvas');
  let dateLeft = document.createElement('p');
  let tempLeft1 = cutTextLines[pastEvents].split(';');
  let tempLeft2 = tempLeft1[1].slice(1, -1).split('.');
  dateLeft.innerHTML = tempLeft2[0] + '.' + tempLeft2[1] + '.' + '20' + tempLeft2[2];
  dateLeft.className = 'uiElement';
  dateLeft.classList.add('horizontal');
  dateLeft.style.position = 'absolute';
  dateLeft.style.marginTop = '' + (560 + EXTRAAREA) + 'px';
  dateLeft.style.marginLeft = '' + (10 + EXTRAAREA) + 'px';
  dateLeft.style.visibility = 'visible';
  uiCanvas.appendChild(dateLeft);

  let dateRight = document.createElement('p');
  let tempRight1 = cutTextLines[pastEventsOffset + 1].split(';');
  let tempRight2 = tempRight1[1].slice(1, -1).split('.');
  dateRight.innerHTML = tempRight2[0] + '.' + tempRight2[1] + '.' + '20' + tempRight2[2];
  dateRight.className = 'uiElement';
  dateRight.classList.add('horizontal');
  dateRight.style.position = 'absolute';
  dateRight.style.marginTop =  '' + (560 + EXTRAAREA) + 'px';
  dateRight.style.marginLeft = '' + (960 + EXTRAAREA) + 'px';
  uiCanvas.appendChild(dateRight);

  for (let i = 0; i < dateLines.length; i++) {
    let dateLine = document.createElement('div');
    dateLine.classList.add('horizontal');
    dateLine.classList.add('vertical');
    dateLine.style.position = 'absolute';
    dateLine.style.zIndex = '80';
    dateLine.style.height = '3000px';
    dateLine.style.width = '1px';
    dateLine.style.opacity = '100%';
    dateLine.style.marginTop =  '-1000px';
    dateLine.style.marginLeft = (parseInt(dateLines[i].slice(0, -2)) + EXTRAAREA) + 'px';

    const gridColorParts = gridColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
    const gridColorClear = `${gridColorParts[0]}, ${gridColorParts[1]}, ${gridColorParts[0]}`;

    dateLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 0.2)';;
    if (dateLines[i].charAt(0) === 'y') {
      dateLine.style.marginLeft = (parseInt(dateLines[i].slice(1, -2)) + EXTRAAREA) + 'px';
      dateLine.style.backgroundColor = 'rgb(' + gridColorClear + ')';
    }

    if (dateLines[i].charAt(0) === 'w') {
      dateLine.style.marginLeft = (parseInt(dateLines[i].slice(1, -2)) + EXTRAAREA) + 'px';
      dateLine.style.backgroundColor = 'rgba(' + gridColorClear + ', 0.05)';;
    }

    uiCanvas.appendChild(dateLine);
  }
}

function drawCanvas() {
  path = [];
  dateLines = [];
  let canvas = document.getElementById('canvas');
  let paddingLeft = 1000 + moveOffsetX;
  let diffHeight = 550 - valueToPx(endbudget - lowest);
  let diffHeightIndex = 0;
  let lastDayDiff = 0;
  let fgOffset = 0;
  let evenFgOffset = 0;

  amazonEntries = [];
  paypalEntries = [];
  foodEntries = [];
  monthlyEntries = [];
  ospaEntries = [];
  gasEntries = [];
  restEntries = [];

  if (pastEvents > cutTextLines.length - 2) {
    pastEvents = cutTextLines.length - 5;
  }

  let lastDay = cutTextLines[pastEventsOffset + 2].split(';')[1].slice(1, -1);
  let firstDay = cutTextLines[pastEvents].split(';')[1].slice(1, -1);

  let totalDays = differenceInDays(firstDay, lastDay) + 2;
  if (sortType === 'amount') {
    totalDays = cutTextLines.length;
  }

  totalDays = Math.abs(totalDays);

  let dayWidth = 1000 / Math.abs(totalDays);

  let foregroundoffset = dayWidth/4;

  // pushing date lines
  for (let year = 0; year < 30; year++) {
    for (let month = 1; month <= 12; month++) {
      dateLines.push(''  +  parseInt(paddingLeft + (differenceInDays(lastDay, '1.' + month + '.' + (19 + year)) * dayWidth)) + 'px');
      if (month === 1) {
        dateLines[dateLines.length - 1] = 'y' + dateLines[dateLines.length - 1];
      }

      for (let day = 1; day <= 31; day++) {
        if (getDayOfWeek(day, month, year) === 'Wednesday') {
          dateLines.push(''  +  parseInt(paddingLeft + (differenceInDays(lastDay, day + '.' + month + '.' + (19 + year)) * dayWidth)) + 'px');
          dateLines[dateLines.length - 1] = 'w' + dateLines[dateLines.length - 1];
        }
      }
    }
  }

  for (let i = pastEvents; i >= pastEventsOffset + 1; i--) {
    let entries = cutTextLines[i].split(';');
    let decided = false;
    let value = valueToPx(entries[selectors.amount].slice(1, -1));
    let diffBefore = diffHeight;
    let diffDays = lastDayDiff - differenceInDays(entries[selectors.date].slice(1, -1), lastDay);
    let sharedDates = 0;
    for (let j = i - 1; j > 0 + 1; j--) {
      let comparison = cutTextLines[j].split(';');
      if (comparison[1] === entries[selectors.date]) {
        sharedDates++;
      }
    }

    for (let l = i + 1; l < cutTextLines.length - 1; l++) {
      let comparison = cutTextLines[l].split(';');
      if (comparison[1] === entries[selectors.date]) {
        sharedDates++;
      }
    }

    let evenForegroundOffset = dayWidth / sharedDates;

    let square = document.createElement('div');
    square.className = 'square';
    square.category = 'Einzahlung';
    square.style.height = '' + Math.abs(value) + 'px';
    square.style.width = '' + (dayWidth - 2) + 'px';

    diffHeight -= value;
    if (diffDays > 0) { square.id = "linePoint" + diffHeightIndex; diffHeightIndex += 2; }
    if (entries[selectors.amount].charAt(1) !== '-') { square.style.marginTop = diffHeight + 'px'; }
    else                               { square.style.marginTop = (diffHeight + value) + 'px'; }

    // Fill empty days
    if (diffDays > 1 && sortType !== 'amount') {
      let lueckenfueller = document.createElement('div');

      lueckenfueller.className = 'square';
      lueckenfueller.classList.add('negative-background');
      lueckenfueller.style.height = '1px';
      lueckenfueller.style.width = '' + ((diffDays - 1) * dayWidth) + 'px';
      lueckenfueller.style.marginTop = (diffBefore) + 'px'
      lueckenfueller.style.marginLeft = (paddingLeft - ((lastDayDiff - 1) * dayWidth)) + 'px';
      canvas.appendChild(lueckenfueller);
    }


    lastDayDiff = differenceInDays(entries[selectors.date].slice(1, -1), lastDay);
    if (sortType === 'amount') {
      lastDayDiff = i;
    }

    square.style.marginLeft = (paddingLeft - (lastDayDiff * dayWidth)) + 'px';

    // Differenciate negative Events
    if (entries[selectors.amount].charAt(1) === '-') {
      square.classList.add('negative-background');
      square.category = 'Sonstige Abbuchung';
    }

    // Make foreground squares smaller
    if (diffDays > 0) {
      fgOffset = 0;
      evenFgOffset = 0;
    } else {
      evenFgOffset += evenForegroundOffset;
    }

    let pastNegative = false;
    if (cutTextLines[i+1] !== null && cutTextLines[i+1].split(';')[selectors.amount] !== null) {
      pastNegative = cutTextLines[i+1].split(';')[selectors.amount].charAt(1) === '-';
    }

    if (diffDays === 0 && ((entries[selectors.amount].charAt(1) === '-' && !pastNegative) || (entries[selectors.amount].charAt(1) !== '-' && pastNegative))) {
      fgOffset += foregroundoffset;
    }

    square.style.width =      (         -2 + (              dayWidth) - fgOffset) + 'px';
    square.style.marginLeft = (paddingLeft - (lastDayDiff * dayWidth) + fgOffset) + 'px';

    if (entries[0].charAt(0) === '_') {
      square.style.opacity = '50%';
    }

    // Push Path Points
    let temp = [];
    temp.push(diffHeight);
    temp.push(paddingLeft - (lastDayDiff * dayWidth) + evenFgOffset);
    path.push(temp);

    // legend filling - Kategorien
    if (entries[selectors.beneficiary].includes('ADAC') ||
        entries[selectors.beneficiary].includes('klarmobil') ||
        entries[selectors.beneficiary].includes('Mecklenburgische') ||
        entries[selectors.purpose].includes('Miete')) {
      square.classList.add('monthly-background');
      square.category = 'Monthly';
      monthlyEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[selectors.beneficiary].includes('AMAZON')) {
      square.classList.add('amazon-background');
      square.category = 'Amazon';
      amazonEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[selectors.beneficiary].includes('PayPal')) {
      square.classList.add('paypal-background');
      square.category = 'PayPal';
      paypalEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[selectors.beneficiary].includes('REWE') || entries[selectors.beneficiary].includes('EDEKA') || entries[selectors.beneficiary].includes('NETTO')) {
      square.classList.add('food-background');
      square.category = 'food';
      foodEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[selectors.beneficiary].includes('OstseeSparkasse')) {
      square.classList.add('ospa-background');
      square.category = 'Bargeld';
      ospaEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[selectors.beneficiary].includes('Tankstelle') || entries[selectors.beneficiary].includes('SHELL') || entries[selectors.beneficiary].includes('ARAL')) {
      square.classList.add('gas-background');
      square.category = 'Tanken';
      gasEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[selectors.purpose].includes('SCHULDEN')) {
      square.classList.add('debt-background');
      square.category = 'Schulden';
      decided = true;
    }

    if (!decided) {
      restEntries.push(cutTextLines[i]);
    }

    // Adding Popups
    square.index = i;
    square.hovered = '0';
    square.onmouseover = function(event) {
      let pop = document.getElementById('popup' + this.index);
      pop.classList.add('fade');
      this.hovered = '1';
      pop.style.top = (event.clientY + window.scrollY - 100) + 'px';
      pop.style.left = (event.clientX + 5) + 'px';
    };

    square.onmousemove = function(event) {
      let pop = document.getElementById('popup' + this.index);
      if (this.hovered === '1') {
        pop.style.top = (event.clientY + window.scrollY - 100) + 'px';
        pop.style.left = (event.clientX + 5) + 'px';
      }
    };

    square.onmouseout = function(event) {
      let pop = document.getElementById('popup' + this.index);
      pop.classList.remove('fade');
      this.hovered = '0';
    };
    let popup = document.createElement('div');
    const dateParts = entries[selectors.date].slice(1, -1).split('.');
    popup.innerHTML = '<p class="popupText">Index: ' + i + '</p>'
                    + '<p class="popupText">Date: ' + entries[selectors.date].slice(1, -1) + '</p>'
                    + '<p class="popupText">Day: ' + getDayOfWeek(dateParts[0], dateParts[1], dateParts[2]) + '</p>'
                    + '<p class="popupText">Value: ' + entries[selectors.amount].slice(1, -1) + '€</p>'
                    + '<p class="popupText">Total: '  + (parseInt(entries[selectors.total]) + parseInt(entries[selectors.amount].slice(1, -1))) + ',00€</p>'
                    + '<p class="popupText">Category: ' + square.category + '</p>';
    popup.id = 'popup' + i;
    popup.className = 'popup';
    popup.style.position = 'absolute';
    popup.style.marginTop = '0';
    popup.style.marginLeft = '0';
    document.getElementById('uipopup').appendChild(popup);

    canvas.appendChild(square);
  }
}

function drawLegends() {
  var legendSquareHolders = document.getElementsByClassName('legend-square-holder');
  for (var i = 0; i < legendSquareHolders.length; i++) {
    legendSquareHolders[i].innerHTML = '';
  }

  let positiveTotal = 0;
  positiveTotal += getTotal(monthlyEntries, true);
  positiveTotal += getTotal(amazonEntries, true);
  positiveTotal += getTotal(paypalEntries, true);
  positiveTotal += getTotal(foodEntries, true);
  positiveTotal += getTotal(ospaEntries, true);
  positiveTotal += getTotal(gasEntries, true);
  positiveTotal += getTotal(restEntries, true);

  let negativeTotal = 0;
  negativeTotal += getTotal(monthlyEntries, false);
  negativeTotal += getTotal(amazonEntries, false);
  negativeTotal += getTotal(paypalEntries, false);
  negativeTotal += getTotal(foodEntries, false);
  negativeTotal += getTotal(ospaEntries, false);
  negativeTotal += getTotal(gasEntries, false);
  negativeTotal += getTotal(restEntries, false);

  let maxTotal = positiveTotal;
  if (negativeTotal > positiveTotal) {
    maxTotal = negativeTotal;
  }

  drawPositiveLegend(maxTotal, monthlyEntries, 'monthly');
  drawPositiveLegend(maxTotal, amazonEntries, 'amazon');
  drawPositiveLegend(maxTotal, paypalEntries, 'paypal');
  drawPositiveLegend(maxTotal, foodEntries, 'food');
  drawPositiveLegend(maxTotal, ospaEntries, 'ospa');
  drawPositiveLegend(maxTotal, gasEntries, 'gas');
  drawPositiveLegend(maxTotal, restEntries, 'negative');

  drawNegativeLegend(maxTotal, monthlyEntries, 'monthly');
  drawNegativeLegend(maxTotal, amazonEntries, 'amazon');
  drawNegativeLegend(maxTotal, paypalEntries, 'paypal');
  drawNegativeLegend(maxTotal, foodEntries, 'food');
  drawNegativeLegend(maxTotal, ospaEntries, 'ospa');
  drawNegativeLegend(maxTotal, gasEntries, 'gas');
  drawNegativeLegend(maxTotal, restEntries, 'negative');

  drawTotalLegend(maxTotal, monthlyEntries, 'monthly');
  drawTotalLegend(maxTotal, amazonEntries, 'amazon');
  drawTotalLegend(maxTotal, paypalEntries, 'paypal');
  drawTotalLegend(maxTotal, foodEntries, 'food');
  drawTotalLegend(maxTotal, ospaEntries, 'ospa');
  drawTotalLegend(maxTotal, gasEntries, 'gas');
  drawTotalLegend(maxTotal, restEntries, 'negative');
}

function getTotal(input, positive) {
  let total = 0;
  for (let i = 0; i < input.length; i++) {
    let entries = input[i].split(';');
    if ((positive && entries[selectors.amount].charAt(1) !== '-') || (!positive && entries[selectors.amount].charAt(1) === '-')) {
      total += Math.abs(parseFloat(entries[selectors.amount].slice(1, -1)));
    }
  }

  return total;
}

function drawTotalLegend(total, input, groupname) {
  let totalAmount = getTotal(input, false) - getTotal(input, true);
  totalAmount *= -1;

  let legend = document.getElementById('legend-total-negative');

  if (totalAmount > 0) {
    legend = document.getElementById('legend-total-positive');
  }

  let legendSquare = document.createElement('div');
  legendSquare.className = 'legendsquare';
  legendSquare.classList.add(groupname + '-background');
  let value = Math.abs(legendMultiplier * parseFloat(totalAmount) / (total));
  legendSquare.style.height = '' + (value) + 'px';
  if (groupname === 'negative') {
    legendSquare.classList.remove(groupname + '-background');
    legendSquare.classList.add('positive' + '-background');
  }

  legend.appendChild(legendSquare);
}

function drawNegativeLegend(total, input, groupname) {
  let legend = document.getElementById('legend-' + groupname + '-negative');
  for (let i = 0; i < input.length; i++) {
    let entries = input[i].split(';');
    if (entries[selectors.amount].charAt(1) === '-') {
      let legendSquare = document.createElement('div');
      legendSquare.className = 'legendsquare';
      legendSquare.classList.add(groupname + '-background');
      let value = Math.abs(legendMultiplier * parseFloat(entries[selectors.amount].slice(1, -1)) / (total));
      legendSquare.style.height = '' + (value) + 'px';
      legend.appendChild(legendSquare);
    }
  }
}

function drawPositiveLegend(total, input, groupname) {
  let legend = document.getElementById('legend-' + groupname + '-positive');
  for (let i = 0; i < input.length; i++) {
    let entries = input[i].split(';');
    if (entries[selectors.amount].charAt(1) !== '-') {
      let legendSquare = document.createElement('div');
      legendSquare.className = 'legendsquare';
      legendSquare.classList.add(groupname + '-background');
      let value = Math.abs(legendMultiplier * parseFloat(entries[selectors.amount].slice(1, -1)) / (total));
      legendSquare.style.height = '' + (value) + 'px';
      legend.appendChild(legendSquare);
    }
  }
}

function drawTable() {
  let table = document.getElementById('table');
  table.innerHTML = '';

  for (let i = 0; i < cutTextLines.length; i++) {
    let entries = cutTextLines[i].split(';');
    let row = document.createElement('div');

    row.id = "row" + i;
    row.className = "row";
    row.style.display = "inline-flex";

    // Header Row
    if (i === 0) {
      row.style.paddingTop = '0.8vh';
      row.style.fontSize = 'medium';
      row.style.fontWeight = 'bolder';
      row.style.backgroundColor = 'black';
    }

    for (let j = 0; j < entries.length; j++) {
      let entrie = entries[j];
      let cell = document.createElement('p');
      cell.innerHTML = entrie.slice(1, -1);
      cell.className = "cell";

      if (j === 0) {
        let cell = document.createElement('p');
        if (i === 0) { cell.innerHTML = 'Index'; }
        else       { cell.innerHTML = ''  + i; }
        cell.className = "cell";
        cell.style.width = "3vw";
        row.appendChild(cell);
      }

      if (j === 1) { cell.style.width = "8vw"; row.appendChild(cell); }     // Date
      if (j === 3) { cell.style.width = "10vw"; row.appendChild(cell); }    // Buchungstext
      if (j === 4) { cell.style.width = "40vw"; row.appendChild(cell); }    // Purpose
      if (j === 11) {                                                       // Beneficiary
        cell.style.width = "25vw";
        row.appendChild(cell);
      }
      if (j === 14) {                                                       // Amount
        cell.style.width = "5vw";
        cell.style.paddingRight = "0.5vw";
        row.appendChild(cell);
        if (entries[selectors.amount].charAt(1) !==  '-') { cell.classList.add('positive-background'); }
        if (entries[selectors.amount].charAt(1) === '-') { cell.classList.add('negative-background'); }
      }

      if (i === 0) { cell.classList.remove('positive-background'); }
    }

    // Kategorien
    if (entries[selectors.beneficiary] !== null) {
      if (entries[selectors.beneficiary].includes('ADAC') || entries[selectors.beneficiary].includes('klarmobil') || entries[selectors.beneficiary].includes('Mecklenburgische') || entries[selectors.purpose].includes('Miete')) {
        row.classList.add('monthly-background-transparent');
      }

      if (entries[selectors.beneficiary].includes('AMAZON')) {
        row.classList.add('amazon-background-transparent');
      }

      if (entries[selectors.beneficiary].includes('PayPal') || entries[selectors.purpose].includes('PAYPAL')) {
        row.classList.add('paypal-background-transparent');
      }

      if (entries[selectors.beneficiary].includes('REWE') || entries[selectors.beneficiary].includes('EDEKA') || entries[selectors.beneficiary].includes('NETTO')) {
        row.classList.add('food-background-transparent');
      }

      if (entries[selectors.beneficiary].includes('Tankstelle') || entries[selectors.beneficiary].includes('SHELL') || entries[selectors.beneficiary].includes('ARAL')) {
        row.classList.add('gas-background-transparent');
      }

      if (entries[selectors.beneficiary].includes('OstseeSparkasse')) {
        row.classList.add('ospa-background-transparent');
      }

      if (entries[4].includes('SCHULDEN')) {
        row.classList.add('debt-background-transparent');
      }
    }

    let rowHolder = document.createElement('div');
    rowHolder.style.display = "block";
    rowHolder.style.paddingBottom = "1px";

    rowHolder.appendChild(row)
    table.appendChild(rowHolder);
  }
}
