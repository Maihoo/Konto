
function differenceInDays(input1, input2) {
  if (!input1.split || !input2.split) {
    return 0;
  }

  let temp1 = input1.split('.');
  let temp2 = input2.split('.');
  let date1 = new Date('20' + temp1[2] + '-' + temp1[1] + '-' + temp1[0]);
  let date2 = new Date('20' + temp2[2] + '-' + temp2[1] + '-' + temp2[0]);
  return (Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)));
}

function getEntrieCategorie(entryParts) {
  const beneficiary = entryParts[selectors.beneficiary]
  const purpose = entryParts[selectors.purpose]

  if (purpose.toLowerCase().includes('bafoeg') ||
      purpose.toLowerCase().includes('lohn/gehalt')) {
    return 'income';
  }

  if (beneficiary.toLowerCase().includes('adac') ||
      beneficiary.toLowerCase().includes('apotheke') ||
      beneficiary.toLowerCase().includes('axa versicherung') ||
      beneficiary.toLowerCase().includes('buendingen med') ||
      beneficiary.toLowerCase().includes('buedingen med') ||
      beneficiary.toLowerCase().includes('bundeskasse do kiel') ||
      beneficiary.toLowerCase().includes('bundeskasse - dienstort kiel') ||
      beneficiary.toLowerCase().includes('klarmobil') ||
      beneficiary.toLowerCase().includes('landeszentralkasse') ||
      beneficiary.toLowerCase().includes('techniker krankenkasse') ||
      beneficiary.toLowerCase().includes('wg union') ||
      purpose.toLowerCase().includes('123-reg') ||
      purpose.toLowerCase().includes('netflix') ||
      purpose.toLowerCase().includes('miete') ||
      purpose.toLowerCase().includes('spotify')) {
    return 'monthly';
  }

  if (beneficiary.toLowerCase().includes('amazon')) {
    return 'amazon';
  }

  if (beneficiary.toLowerCase().includes('hot chickeria') ||
      beneficiary.toLowerCase().includes('b sieben') ||
      beneficiary.toLowerCase().includes('mcdonalds') ||
      beneficiary.toLowerCase().includes('restaurant') ||
      beneficiary.toLowerCase().includes('pizza') ||
      purpose.toLowerCase().includes('takeaway.com')) {
    return 'takeout';
  }

  if (beneficiary.toLowerCase().includes('otto payments') ||
      beneficiary.toLowerCase().includes('paypal')) {
    return 'paypal';
  }

  if (beneficiary.toLowerCase().includes('ostseesparkasse') ||
      purpose.toLowerCase().includes('bargeldausz')) {
    return 'cash';
  }

  if (beneficiary.toLowerCase().includes('avia') ||
      beneficiary.toLowerCase().includes('aral') ||
      beneficiary.toLowerCase().includes('classic') ||
      beneficiary.toLowerCase().includes('esso') ||
      beneficiary.toLowerCase().includes('famila tank') ||
      beneficiary.toLowerCase().includes('jet dankt') ||
      beneficiary.toLowerCase().includes('mecklenburgische') ||
      beneficiary.toLowerCase().includes('sb tank') ||
      beneficiary.toLowerCase().includes('shell') ||
      beneficiary.toLowerCase().includes('tankstelle') ||
      beneficiary.toLowerCase().includes('total') || 
      beneficiary.toLowerCase().includes('warnowquerung') ||
      purpose.toLowerCase().includes('kfz-kauf')) {
    return 'gas';
  }

  if (beneficiary.toLowerCase().includes('aldi') ||
      beneficiary.toLowerCase().includes('baeckerei') ||
      beneficiary.toLowerCase().includes('edeka') ||
      beneficiary.toLowerCase().includes('famila') ||
      beneficiary.toLowerCase().includes('getraenkemark') ||
      beneficiary.toLowerCase().includes('globus') ||
      beneficiary.toLowerCase().includes('kaufland') ||
      beneficiary.toLowerCase().includes('lidl') ||
      beneficiary.toLowerCase().includes('netto') ||
      beneficiary.toLowerCase().includes('penny') ||
      beneficiary.toLowerCase().includes('rewe') ||
      beneficiary.toLowerCase().includes('tabak')) {
    return 'food';
  }

  if (purpose.toLowerCase().includes('schulden')) {
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

function pxToValue(yPixel) {
  let pixel = 550 - parseInt(yPixel.slice(0, -2));
  return parseInt((pixel * (maxHeight / 500) + lowest) / verticalScaleFactor);
}

function valueToPx(value) {
  return parseFloat(value) * verticalScaleFactor * (500 / maxHeight);
}

function valueToMarginTop(value) {
  let pixel = (parseFloat(value) - lowest) * verticalScaleFactor * 500 / (maxHeight);
  return 550 - pixel;
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
  xPixel = xPixel.slice(0, -2);
  let firstDayVisible = allTextLines[allTextLines.length - 1].split(';')[1].slice(1, -1);
  let lastDayVisible = allTextLines[1].split(';')[1].slice(1, -1);
  let totalDaysVisible = differenceInDays(firstDayVisible, lastDayVisible) + 2;
  let distancePerDay = 1000 / totalDaysVisible;
  let daysDiff = parseInt(parseInt((xPixel) + moveOffsetX) / distancePerDay);
  let temp = firstDayVisible.split('.');
  let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
  date = date.addDays(daysDiff);
  let dateParts = date.toISOString().split('T')[0].split('-');
  return dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];
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

function clearLines() {
  let uiLine = document.getElementById('uiline');
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
      if (current < tempLowest)  { tempLowest  = current; }
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
      if (current < lowest)  { lowest  = current; }
      if (current > highest) { highest = current; }
    }

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

  return `rgb(${r}, ${g}, ${b})`;
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
