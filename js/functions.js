
function differenceInDays(input1, input2) {
  let temp1 = input1.split('.');
  let temp2 = input2.split('.');
  let date1 = new Date('20' + temp1[2] + '-' + temp1[1] + '-' + temp1[0]);
  let date2 = new Date('20' + temp2[2] + '-' + temp2[1] + '-' + temp2[0]);
  return (Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)));
}

Date.prototype.addDays = function(days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

function pxToValue(yPixel) {
  let pixel = 550 - parseInt(yPixel.slice(0, -2));
  return parseInt((pixel * (maxHight / 500) + lowest) / verticalZoomFactor);
}

function pxToDate(xPixel) {
  let paddingLeft = 1000 + moveOffsetX;
  let lastDay = allTextLines[pastEventsOffset + 2].split(';')[1].slice(1, -1);
  let firstDay = allTextLines[pastEvents].split(';')[1].slice(1, -1);
  let totalDays = differenceInDays(firstDay, lastDay) + 2;
  let distance = 100000;
  let daysDiff = -50;

  for(let i = 0; i < 2*allTextLines.length; i++) {
    if(distance > Math.abs(parseInt(xPixel) - paddingLeft - ((i-allTextLines.length) * (1000 / totalDays)))) {
      distance  = Math.abs(parseInt(xPixel) - paddingLeft - ((i-allTextLines.length) * (1000 / totalDays)));
    } else {
      daysDiff = i;
      break;
    }
  }

  let temp = lastDay.split('.');
  let date = new Date('20' + temp[2] + '-' + temp[1] + '-' + temp[0]);
  date.addDays(daysDiff);
  let dateParts = date.toISOString().split('T')[0].split('-');
  return dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];
}

function valueToPx(value) {
  return parseInt(value) * verticalZoomFactor * (500 / maxHight);
}

function dayDiffToPx(dayDiff) {

}

function drawLine(ctx, x1, y1, x2, y2, stroke = 'black', width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function togglePath() {
  if(pathMode) {
    document.getElementById('canvas').style.opacity = '100%';
    document.getElementById('pathCanvas').style.opacity = 0;
  } else {
    document.getElementById('canvas').style.opacity = 0;
    document.getElementById('pathCanvas').style.opacity = '100%';
  }
  pathMode = !pathMode;
}

function toggleGrid() {
  if(gridMode) {
    document.getElementById('uicanvas').style.opacity = "100%";
  } else {
    document.getElementById('uicanvas').style.opacity = 0;
  }
  gridMode = !gridMode;
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

function getMaxHight() {
  let current = STARTBUDGET;
  let tempLowest = 100000.0;
  let tempHighest = 0.0;
  let limiter = pastEvents;
  if(allTextLines.length < limiter) { limiter = allTextLines.length; }

  for (let i = limiter; i > 0; i--) {
    let entries = allTextLines[i].split(';');
    current += parseFloat(entries[14].slice(1, -1));
    if(current < tempLowest)  { tempLowest  = current; }
    if(current > tempHighest) { tempHighest = current; }
  }

  return tempHighest - tempLowest;
}

function getMaxHightAround() {
  let current = STARTBUDGET;
  lowest = 100000.0;
  highest = 0.0;

  let limiter = pastEvents;
  if(allTextLines.length < limiter) {
    limiter = allTextLines.length;
  }

  for (let i = 1; i < limiter + 1; i++) {
    let entries = allTextLines[i].split(';');
    current -= parseFloat(entries[14].slice(1, -1));
    if(i > pastEventsOffset + 1) {
      if(current < lowest)  { lowest  = current; }
      if(current > highest) { highest = current; }
      if(i === 1) { endDate = entries[1].slice(1, -1); }
    }

    startDate = entries[1].slice(1, -1);
    endbudget = current;
  }
}
