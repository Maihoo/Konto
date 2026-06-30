
function differenceInDays(input1, input2) {
  if (!input1.split || !input2.split) {
    return 0;
  }

  let temp1 = input1.split('.');
  let temp2 = input2.split('.');
  let date1 = new Date((temp1[2] && temp1[2].length === 2 ? '20' : '') + temp1[2] + '-' + temp1[1] + '-' + temp1[0]);
  let date2 = new Date((temp2[2] && temp2[2].length === 2 ? '20' : '') + temp2[2] + '-' + temp2[1] + '-' + temp2[0]);
  return (Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)));
}

function getEntrieCategory(entryParts) {
  const beneficiary = entryParts[selectors.beneficiary].toLowerCase();
  const purpose = entryParts[selectors.purpose].toLowerCase();

  if (purpose.includes('bafoeg') ||
      purpose.includes('lohn/gehalt')) {
    return 'income';
  }

  if (beneficiary.includes('adac') ||
      beneficiary.includes('apotheke') ||
      beneficiary.includes('axa versicherung') ||
      beneficiary.includes('buendingen med') ||
      beneficiary.includes('buedingen med') ||
      beneficiary.includes('bundeskasse do kiel') ||
      beneficiary.includes('bundeskasse - dienstort kiel') ||
      beneficiary.includes('klarmobil') ||
      beneficiary.includes('landeszentralkasse') ||
      beneficiary.includes('techniker krankenkasse') ||
      beneficiary.includes('wg union') ||
      beneficiary.includes('mecklenburgische') ||
      beneficiary.includes('wilhelm.tel') ||
      purpose.includes('123-reg') ||
      purpose.includes('netflix') ||
      purpose.includes('miete') ||
      purpose.includes('spotify')) {
    return 'monthly';
  }

  if (beneficiary.includes('amazon') ||
      purpose.includes('aliexpress') ||
      purpose.includes('temu.com')) {
    return 'amazon';
  }
  
  if (beneficiary.includes('hot chickeria') ||
      beneficiary.includes('b sieben') ||
      beneficiary.includes('mcdonalds') ||
      beneficiary.includes('restaurant') ||
      beneficiary.includes('pizza') ||
      purpose.includes('burgerme') ||
      purpose.includes('takeaway.com')) {
    return 'takeout';
  }

  if (beneficiary.includes('otto payments') ||
      beneficiary.includes('paypal')) {
    return 'paypal';
  }

  if (beneficiary.includes('ostseesparkasse') ||
      purpose.includes('bargeldausz')) {
    return 'cash';
  }

  if (beneficiary.includes('avia') ||
      beneficiary.includes('aral') ||
      beneficiary.includes('classic') ||
      beneficiary.includes('esso') ||
      beneficiary.includes('famila tank') ||
      beneficiary.includes('jet dankt') ||
      beneficiary.includes('mecklenburgische') ||
      beneficiary.includes('sb tank') ||
      (beneficiary.includes('shell') && !beneficiary.includes('shell-autoservice')) ||
      beneficiary.includes('tankstelle') ||
      beneficiary.includes('total') ||
      beneficiary.includes('warnowquerung') ||
      purpose.includes('kfz-kauf')) {
    return 'gas';
  }

  if (beneficiary.includes('aldi') ||
      beneficiary.includes('baeckerei') ||
      beneficiary.includes('edeka') ||
      beneficiary.includes('famila') ||
      beneficiary.includes('getraenkemark') ||
      beneficiary.includes('globus') ||
      beneficiary.includes('kaufland') ||
      beneficiary.includes('lidl') ||
      beneficiary.includes('netto') ||
      beneficiary.includes('penny') ||
      beneficiary.includes('rewe') ||
      beneficiary.includes('tabak') ||
      purpose.includes('tobacco')) {
    return 'food';
  }

  if (purpose.includes('schulden')) {
    return 'debt';
  }

  return 'others';
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

function pxToValue(yPixel, maximumHeight = maxHeight) {
  let pixel = canvasHeight - parseInt(yPixel.slice(0, -2));
  return parseInt((pixel * (maximumHeight / (canvasHeight * 0.7)) + lowest) / verticalScaleFactor);
}

function valueToPx(value, maximumHeight = maxHeight) {
  return (parseFloat(value) * verticalScaleFactor * (canvasHeight * 0.7)) / maximumHeight;
}

function valueToMarginTop(value, maximumHeight = maxHeight) {
  let pixel = valueToPx(value - lowest, maximumHeight);
  return canvasHeight - pixel - 0.15 * canvasHeight;
}

function cursorPosToMargin(cursorPos, orientation = 'top', parentSelector = '#uiLine') {
  if (orientation === 'top') {
    return parseInt((cursorPos - $(parentSelector).offset().top) / zoomLevel + window.scrollY);
  } else {
    return parseInt((cursorPos - $(parentSelector).offset().left) / zoomLevel);
  }
}

function parseDate(dateString) {
  const parts = dateString.split('.');
  if (parts.length < 3) return null;
  const date = new Date('20' + parts[2] + '-' + parts[1] + '-' + parts[0]);
  if (isNaN(date.getTime())) return null;
  return date.getTime();
}

function numberToCurrency(number) {
  if (number.replace !== undefined) {
    number = parseInt(number.replace(',', '.'));
  }

  return number.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }).replace(' ', '');
}

function pxToDate(xPixel) {
  const squares = canvas.querySelectorAll('.square:not(.placeholder)');
  const paddingLeft = squares[0].style.marginLeft.slice(0, -2);
  const lastSquareIndex = squares.length >= allTextLines.length ? allTextLines.length - 1 : squares.length - 1;
  const paddingRight = squares[lastSquareIndex].style.marginLeft.slice(0, -2);
  const marginDiffBetweenFirstAndLast = paddingRight - paddingLeft;
  xPixel = parseInt(xPixel.slice(0, -2));
  xPixel = xPixel - paddingLeft;
  let firstDayVisible = allTextLines[allTextLines.length - 1].split(';')[1].slice(1, -1);
  let lastDayVisible = allTextLines[1].split(';')[1].slice(1, -1);
  let totalDaysVisible = differenceInDays(firstDayVisible, lastDayVisible) + 2;
  let distancePerDay = marginDiffBetweenFirstAndLast / totalDaysVisible;
  let daysDiff = parseInt(xPixel / distancePerDay);
  let temp = firstDayVisible.split('.');
  let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
  date = date.addDays(daysDiff);
  let dateParts = date.toISOString().split('T')[0].split('-');
  return dateParts[2] + '.' + dateParts[1] + ('.' + dateParts[0]).replace('20', '');
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

function drawLine(ctx, x1, y1, x2, y2, stroke = 'black', width = 1, zoomFactor = 1) {
  ctx.beginPath();
  ctx.moveTo(x1 / zoomFactor, y1 / zoomFactor);
  ctx.lineTo(x2 / zoomFactor, y2 / zoomFactor);
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

function clearLines() {
  let uiLine = document.getElementById('uiLine');
  ctx = uiLine.getContext('2d');
  ctx.clearRect(0, 0, uiLine.width, uiLine.height);
  let circles = document.getElementsByClassName('circle');
  Array.from(circles).forEach(circle => {
    try {
      canvas.removeChild(circle);
    } catch (error) { }
  });
}

function getMaxPriceDiff() {
  let tempLowest = 1000000.0;
  let tempHighest = 0.0;

  for (let i = allTextLines.length - 1; i > 0; i--) {
    if (allTextLines[i]) {
      let current = parseFloat(allTextLines[i].split(';')[selectors.total].slice(1, -1));
      if (current < tempLowest) { tempLowest = current; }
      if (current > tempHighest) { tempHighest = current; }
    }
  }

  return tempHighest - tempLowest;
}

function updateMaxHeightAround() {
  lowest = 1000000.0;
  highest = 0;
  //starts at 1 to ignore first row
  for (let i = 1; i < allTextLines.length && i < allTextLines.length - 1; i++) {
    let entries = allTextLines[i].split(';');
    const current = parseFloat(entries[selectors.total].slice(1, -1));
    if (i > 1) {
      if (current < lowest) { lowest = current; }
      if (current > highest) { highest = current; }
    }
  }
}

function addRGB(input) {
  return `rgb(${input.replace('rgb(', '').replace(')', '')})`;
}

function removeRGB(input) {
  return input.replace('rgb(', '').replace(')', '').replace(/\s/g, '');
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  return `rgb(${parseInt(fullHex.slice(0, 2), 16)}, ${parseInt(fullHex.slice(2, 4), 16)}, ${parseInt(fullHex.slice(4, 6), 16)})`;
}

function rgbToHex(input) {
  input = input.replace('rgb(', '').replace(')', '').replace(/\s/g, '');
  const inputParts = input.split(',');
  if (inputParts.length === 3) {
    const componentToHex = (c) => {
      const hex = parseInt(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + componentToHex(inputParts[0]) + componentToHex(inputParts[1]) + componentToHex(inputParts[2]);
  }
  return '#000000';
}
