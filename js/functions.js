
function differenceInDays(input1, input2) {
  let temp1 = input1.split('.');
  let temp2 = input2.split('.');
  let date1 = new Date('20' + temp1[2] + '-' + temp1[1] + '-' + temp1[0]);
  let date2 = new Date('20' + temp2[2] + '-' + temp2[1] + '-' + temp2[0]);
  return (Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)));
}

function addZeroToSingleDigit(number) {
  let numberString = number.toString();
  if (numberString.length === 1) {
    numberString = '0' + numberString;
  }

  return numberString;
}

Date.prototype.addDays = function(days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

function pxToValue(yPixel) {
  let pixel = 550 - parseInt(yPixel.slice(0, -2));
  return parseInt((pixel * (maxHeight / 500) + lowest) / verticalZoomFactor);
}

function pxToDate(xPixel) {
  xPixel = xPixel.slice(0, -2);
  let firstDayVisible = cutTextLines[pastEvents].split(';')[1].slice(1, -1);
  let lastDayVisible = cutTextLines[pastEventsOffset + 2].split(';')[1].slice(1, -1);
  let totalDaysVisible = differenceInDays(firstDayVisible, lastDayVisible) + 2;
  let distancePerDay = 1000 / totalDaysVisible;
  let daysDiff = parseInt(parseInt((xPixel) + moveOffsetX) / distancePerDay);
  let temp = firstDayVisible.split('.');
  let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
  date = date.addDays(daysDiff);
  let dateParts = date.toISOString().split('T')[0].split('-');
  return dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];
}

function valueToPx(value) {
  return parseInt(value) * verticalZoomFactor * (500 / maxHeight);
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

function formatNumber(number) {
  let numberString = number.toString();
  let [integerPart, decimalPart] = numberString.split('.');
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  decimalPart = decimalPart ? decimalPart.slice(0, 2) : '';
  let formattedNumber = decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  return formattedNumber;
}

function drawLine(ctx, x1, y1, x2, y2, stroke = 'black', width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function getDayOfWeek(day, month, year) {
  const date = new Date('20' + year + '-' + month + '-' + day);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
}

function togglePath() {
  pathMode = !pathMode;

  if (pathMode) {
    document.getElementById('canvas').style.opacity = 0;
    document.getElementById('pathCanvas').style.opacity = '100%';
    document.getElementById('pathBlurCanvas').style.opacity = '100%';
  } else {
    document.getElementById('canvas').style.opacity = '100%';
    document.getElementById('pathCanvas').style.opacity = 0;
    document.getElementById('pathBlurCanvas').style.opacity = 0;
  }
}

function toggleGrid() {
  if (gridMode) {
    document.getElementById('uicanvas').style.opacity = "100%";
  } else {
    document.getElementById('uicanvas').style.opacity = 0;
  }
  gridMode = !gridMode;
}

function toggleOptions() {
  optionsExtended = !optionsExtended;
  sessionStorage.setItem('optionsExtended', optionsExtended);

  if (optionsExtended) {
    document.getElementById('settings').classList.add('settings-hidden');
  } else {
    document.getElementById('settings').classList.remove('settings-hidden');
  }
}

function toggleSort() {
  switch (sortType) {
    case 'amount':
      sortType = 'date';
      sessionStorage.setItem('sortType', sortType);
      break;

    case 'date':
      sortType = 'amount';
      sessionStorage.setItem('sortType', sortType);
      break;

    default:
      break;
  }

  initTextLines();
  initRangeSlider2();
  init();
}

function clearLines() {
  let uiLine = document.getElementById('uiline');
  ctx = uiLine.getContext('2d');
  ctx.clearRect(0, 0, uiLine.width, uiLine.height);
  let circles = document.getElementsByClassName('circle');
  Array.from(circles).forEach(circle => {
    try {
      document.getElementById('canvas').removeChild(circle);
    } catch (error) { }
  });
}

function getMaxHeight() {
  let current = totalBudget;
  let tempLowest = 1000000.0;
  let tempHighest = 0.0;

  for (let i = pastEvents; i > 0; i--) {
    if (cutTextLines[i]) {
      let entries = cutTextLines[i].split(';');
      current += parseFloat(entries[14].slice(1, -1));
      if (current < tempLowest)  { tempLowest  = current; }
      if (current > tempHighest) { tempHighest = current; }
    }
  }

  return tempHighest - tempLowest;
}

function getMaxHeightAround() {
  let current = totalBudget;
  lowest = 1000000.0;
  highest = totalBudget;

  //starts at 1 to ignore first row
  for (let i = 1; i <= pastEvents; i++) {
    let entries = cutTextLines[i].split(';');
    current -= parseFloat(entries[14].slice(1, -1));
    if (i > pastEventsOffset) {
      if (current < lowest)  { lowest  = current; }
      if (current > highest) { highest = current; }
    }

    if (i === 1) { endDate = entries[1].slice(1, -1); }

    startDate = entries[1].slice(1, -1);
    endbudget = current;
  }
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return  `rgb(${r}, ${g}, ${b})`;
}

function rgbToHex(input) {
  input = input.replace('rgb(', '');
  input = input.replace(')', '');
  input = input.replace(/\s/g, '');

  const inputParts = input.split(',');
  if (inputParts.length === 3) {
    const componentToHex = (c) => {
      const hex = parseInt(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const hexR = componentToHex(inputParts[0]);
    const hexG = componentToHex(inputParts[1]);
    const hexB = componentToHex(inputParts[2]);

    return `#${hexR}${hexG}${hexB}`;
  }

  return '';
}
