$(document).ready(function () {
  $.ajax({
    type: "GET",
    url: "umsatz.csv",
    dataType: "text",
  success: function (data) {
    dataset = data;
    initTextLines();
    initControls();
    init(); }
  });
});

//Constants
const STARTBUDGET = 4576.33;
const ZOOMFACTOR = 0.8;
const EXTRAAREA = 500;
const FOREGROUNDOFFSET = 5;

//Variables
let dragging = false;
let zoomInPressed = false;
let zoomOutPressed = false;
let pathMode = false;
let gridMode = false;

let dataset;

let verticalZoomFactor = 1.0;
let pastEventsDataset = 70;
let pastEventsOffsetDataset = 0;

let pastEvents = pastEventsDataset-1;
let pastEventsOffset = 0;

let legendMultiplier = 0.2;
let maxHight = 500;
let starthight = 0.0;
let endbudget = 0.0;
let budget = 0.0;
let lowest = 0.0;
let highest = 0.0;
let moveOffsetX = 0.0;
let moveOffsetY = 0.0;
let dragstartX = 0.0;
let dragstartY = 0.0;
let ts1 = 0;

let startDate = "";
let endDate = "";

let allTextLines = [];
let cutTextLines = [];
let dateLines = [];
let path = [];
let linepoint = [];
let categories = ['monthly' , 'amazon', 'paypal', 'rewe', 'ospa', 'negative'];

let amazonEntries = [];
let paypalEntries = [];
let reweEntries = [];
let monthlyEntries = [];
let ospaEntries = [];
let restEntries = [];

function reset() {
  dateLines = [];
  path = [];
  linepoint = [];
  amazonEntries = [];
  paypalEntries = [];
  reweEntries = [];
  monthlyEntries = [];
  ospaEntries = [];
  restEntries = [];
  document.getElementById('canvas').style.opacity = '100%';
  document.getElementById('pathCanvas').style.opacity = '0%';
  document.getElementById('pathCanvas').innerHTML = '';
  document.getElementById('uiline').innerHTML = '';
  document.getElementById('uicanvas').innerHTML = '';
  document.getElementById('uipopup').innerHTML = '';
  document.getElementById('canvas').innerHTML = '';
  for (let i = 0; i < categories.length; i++) {
    document.getElementById('legend' + categories[i]).innerHTML = '';
  }
}

function initTextLines() {
  allTextLines = dataset.split(/\r\n|\n/);
  cutTextLines = allTextLines.slice(pastEventsOffsetDataset, pastEventsOffsetDataset + pastEventsDataset);

  let tempBudget = STARTBUDGET;
  for (let i = 0; i < cutTextLines.length; i++) {
    let entries = cutTextLines[i].split(';');
    if (i > 0 && entries.length > 13) {
      tempBudget -= parseFloat(entries[14].slice(1, -1));
      cutTextLines[i] += ';' + tempBudget;
    }
  }
}

function init() {
  reset();
  legendMultiplier = 60 / (pastEvents - pastEventsOffset);
  maxHight = getMaxHight();
  getMaxHightAround();

  setAmounts();
  drawCanvas();
  drawPath();
  setDates();

  drawLegends();
  drawTable();

  pathMode = !pathMode;
  togglePath()
}

function drawPath() {
  let canvas = document.getElementById('pathCanvas'),
  ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < path.length-1; i++) {
    drawLine(
      ctx,
      parseInt(path[i][1]),
      parseInt(path[i][0]),
      parseInt(path[i+1][1]),
      parseInt(path[i+1][0]),
      'red', 1);
  }
}

function setAmounts() {
  const uiCanvas = document.getElementById('uicanvas');
  uiCanvas.style.marginTop  = -EXTRAAREA + 'px';
  uiCanvas.style.marginLeft = -EXTRAAREA + 'px';
  let valueTop = document.createElement('p');
  valueTop.innerHTML = '<p class="uiElementTop">Höchststand:</p> <p class="uiElementBot">~' + parseInt(highest) + ',00€</p>';
  valueTop.className = 'uiElement';
  valueTop.classList.add('vertical');
  valueTop.style.position = 'absolute';
  valueTop.style.marginTop = '' + parseInt(530 - valueToPx(highest) + valueToPx(lowest) + EXTRAAREA) + 'px';
  valueTop.style.marginLeft = '' + (5 + EXTRAAREA) + 'px';
  uiCanvas.appendChild(valueTop);

  let valueBottom = document.createElement('p');
  valueBottom.innerHTML = '<p class="uiElementTop">Tiefststand:</p> <p class="uiElementBot">~' + parseInt(lowest) + ',00€</p>';
  valueBottom.className = 'uiElement';
  valueBottom.classList.add('vertical');
  valueBottom.style.position = 'absolute';
  valueBottom.style.marginTop = '' + (525 + EXTRAAREA) + 'px'
  valueBottom.style.marginLeft = '' + (5 + EXTRAAREA) + 'px';
  uiCanvas.appendChild(valueBottom);

  for (let i = 0; i < 20; i++) {
    let valueLine = document.createElement('div');
    valueLine.classList.add('vertical');
    valueLine.style.position = 'absolute';
    valueLine.style.zIndex = '80';
    valueLine.style.height = '1px';
    valueLine.style.width = '2000px';
    if (i % 2 === 0) {
      valueLine.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    }
    else {
      valueLine.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    }

    valueLine.style.opacity = '100%';
    valueLine.style.marginTop = '' + parseInt(550 - valueToPx(i * 500) + valueToPx(lowest) + EXTRAAREA) + 'px';
    uiCanvas.appendChild(valueLine);
  }
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
    dateLine.style.position = 'absolute';
    dateLine.style.zIndex = '80';
    dateLine.style.height = '2000px';
    dateLine.style.width = '1px';
    dateLine.style.opacity = '100%';
    dateLine.style.marginTop = '-1px';
    dateLine.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    dateLine.style.marginLeft = (parseInt(dateLines[i].slice(0, -2)) + EXTRAAREA) + 'px';
    if (dateLines[i].charAt(0) === 'y') {
      dateLine.style.backgroundColor = 'rgba(255, 255, 255, 1.0)';
      dateLine.style.marginLeft = (parseInt(dateLines[i].slice(1, -2)) + EXTRAAREA) + 'px';
    }

    uiCanvas.appendChild(dateLine);
  }
}

function drawCanvas() {
  path = [];
  dateLines = [];
  let canvas = document.getElementById('canvas');
  let paddingLeft = 1000 + moveOffsetX;

  let diffHight = 550 - valueToPx(endbudget - lowest);
  let diffHightIndex = 0;
  let lastDayDiff = 0;
  let fgOffset = 0;
  let evenFgOffset = 0;

  amazonEntries = [];
  paypalEntries = [];
  reweEntries = [];
  monthlyEntries = [];
  ospaEntries = [];
  restEntries = [];

  let lastDay = cutTextLines[pastEventsOffset + 2].split(';')[1].slice(1, -1);
  let firstDay = cutTextLines[pastEvents].split(';')[1].slice(1, -1);
  let totalDays = differenceInDays(firstDay, lastDay) + 2;
  let dayWidth = 1000 / totalDays;

  //pushing date lines
  for (let year = 0; year < 6; year++) {
    for (let month = 1; month <= 12; month++) {
      if (month !== 1) { dateLines.push(''  +  parseInt(paddingLeft + (differenceInDays(lastDay, '1.' + month + '.' + (19 + year)) * dayWidth)) + 'px'); }
      else             { dateLines.push('y' +  parseInt(paddingLeft + (differenceInDays(lastDay, '1.' + month + '.' + (19 + year)) * dayWidth)) + 'px'); }
    }
  }

  for (let i = pastEvents; i >= pastEventsOffset + 1; i--) {
    let entries = cutTextLines[i].split(';');
    let decided = false;
    let value = valueToPx(entries[14].slice(1, -1));
    let diffBefore = diffHight;
    let diffDays = lastDayDiff - differenceInDays(entries[1].slice(1, -1), lastDay);
    let sharedDates = 0;
    for (let j = i - 1; j > 0 + 1; j--) {
      let comparison = cutTextLines[j].split(';');
      if (comparison[1] === entries[1]) {
        sharedDates++;
      }
    }

    for (let l = i + 1; l < cutTextLines.length - 1; l++) {
      let comparison = cutTextLines[l].split(';');
      if (comparison[1] === entries[1]) {
        sharedDates++;
      }
    }

    let evenForegroundOffset = dayWidth / sharedDates;

    let square = document.createElement('div');
    square.className = 'square';
    square.category = 'Einzahlung';
    square.style.height = '' + Math.abs(value) + 'px';
    square.style.width = '' + (dayWidth - 2) + 'px';

    diffHight -= value;
    if (diffDays > 0) { square.id = "linePoint" + diffHightIndex; diffHightIndex += 2; }
    if (entries[14].charAt(1) !== '-') { square.style.marginTop = diffHight + 'px'; }
    else                              { square.style.marginTop = (diffHight + value) + 'px'; }

    //Fill empty days
    if (diffDays > 1) {
      let lueckenfueller = document.createElement('div');
      lueckenfueller.className = 'square';
      lueckenfueller.classList.add('negative-background');
      lueckenfueller.style.height = '1px';
      lueckenfueller.style.width = '' + ((diffDays - 1) * dayWidth) + 'px';
      lueckenfueller.style.marginTop = (diffBefore) + 'px'
      lueckenfueller.style.marginLeft = (paddingLeft - ((lastDayDiff - 1) * dayWidth)) + 'px';
      canvas.appendChild(lueckenfueller);
    }

    lastDayDiff = differenceInDays(entries[1].slice(1, -1), lastDay);
    square.style.marginLeft = (paddingLeft - (lastDayDiff * dayWidth)) + 'px';

    //Differenciate negative Events
    if (entries[14].charAt(1) === '-') {
      square.classList.add('negative-background');
      square.category = 'Sonstige Abbuchung';
    }

    //Make foreground squares smaller
    if (diffDays > 0) {
      fgOffset = 0;
      evenFgOffset = 0;
    } else {
      evenFgOffset += evenForegroundOffset;
    }

    let pastNegative = false;
    if (cutTextLines[i+1] !== null && cutTextLines[i+1].split(';')[14] !== null) {
      pastNegative = cutTextLines[i+1].split(';')[14].charAt(1) === '-';
    }
    let tes = 0;

    if (diffDays === 0 && ((entries[14].charAt(1) === '-' && !pastNegative) || (entries[14].charAt(1) !== '-' && pastNegative))) {
      fgOffset += FOREGROUNDOFFSET;
      square.style.width =      (         -2 + (              dayWidth) - fgOffset) + 'px';
      square.style.marginLeft = (paddingLeft - (lastDayDiff * dayWidth) + fgOffset) + 'px';
    }

    //Push Path Points
    let temp = [];
    temp.push(diffHight);
    temp.push(paddingLeft - (lastDayDiff * dayWidth) + evenFgOffset);
    path.push(temp);

    //legend filling - Kategorien
    if (entries[11].includes('ADAC') ||
      entries[11].includes('klarmobil') ||
      entries[4].includes('Miete')) {
      square.classList.add('monthly-background');
      square.category = 'Monthly';
      monthlyEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[11].includes('AMAZON')) {
      square.classList.add('amazon-background');
      square.category = 'Amazon';
      amazonEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[11].includes('PayPal')) {
      square.classList.add('paypal-background');
      square.category = 'PayPal';
      paypalEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[11].includes('REWE')) {
      square.classList.add('rewe-background');
      square.category = 'REWE';
      reweEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[11].includes('OstseeSparkasse')) {
      square.classList.add('ospa-background');
      square.category = 'Bargeldauszahlung';
      ospaEntries.push(cutTextLines[i]);
      decided = true;
    }

    if (entries[0].charAt(0) === "_") {
      square.style.opacity = '50%';
    }

    if (!decided) {
      restEntries.push(cutTextLines[i]);
    }

    //Adding Popups
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
    popup.innerHTML = '<p class="popupText">Index: ' + i + '</p>'
                    + '<p class="popupText">Date: ' + entries[1].slice(1, -1) + '</p>'
                    + '<p class="popupText">fgOffset: ' + fgOffset + '</p>'
                    + '<p class="popupText">Value: ' + entries[14].slice(1, -1) + '€</p>'
                    + '<p class="popupText">Total: '  + (parseInt(entries[17]) + parseInt(entries[14].slice(1, -1))) + ',00€</p>'
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
  let total = 0;
  total += getTotal(monthlyEntries);
  total += getTotal(amazonEntries);
  total += getTotal(paypalEntries);
  total += getTotal(reweEntries);
  total += getTotal(ospaEntries);
  total += getTotal(restEntries);

  drawLegend(monthlyEntries, 'monthly', total);
  drawLegend(amazonEntries, 'amazon', total);
  drawLegend(paypalEntries, 'paypal', total);
  drawLegend(reweEntries, 'rewe', total);
  drawLegend(ospaEntries, 'ospa', total);
  drawLegend(restEntries, 'negative', total);
}

function getTotal(input) {
  let total = 0;
  for (let i = 0; i < input.length; i++) {
    let entries = input[i].split(';');
    if (entries[14].charAt(1) === '-') {
      let value = Math.abs(legendMultiplier * valueToPx(entries[14].slice(1, -1)));
      total += value;
    }
  }

  return total;
}

function drawLegend(input, groupname, total) {
  let legend = document.getElementById('legend' + groupname);
  for (let i = 0; i < input.length; i++) {
    let entries = input[i].split(';');
    if (entries[14].charAt(1) === '-') {
      let legendSquare = document.createElement('div');
      legendSquare.className = 'square';
      legendSquare.classList.add(groupname + '-background');
      legendSquare.style.position = 'relative';
      legendSquare.style.marginTop = '-2px';
      let value = Math.abs(0.001 * total * valueToPx(entries[14].slice(1, -1)));
      legendSquare.style.height = '' + (value) + 'px';
      legendSquare.style.width = '' + (1000 / 20) + 'px';
      legend.appendChild(legendSquare);
    }
  }
}

function drawTable() {
  let table = document.getElementById('table');

  for (let i = 0; i < cutTextLines.length; i++) {
    let entries = cutTextLines[i].split(';');
    let row = document.createElement('div');

    row.id = "row" + i;
    row.className = "row";
    row.style.display = "inline-flex";

    //Header Row
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
        if (i === 0) { cell.innerHTML = 'index'; }
        else       { cell.innerHTML = ''  + i; }
        cell.className = "cell";
        cell.style.width = "3vw";
        row.appendChild(cell);
      }

      if (j === 1) { cell.style.width = "8vw"; row.appendChild(cell); }    //Datum
      //if (j === 3) { cell.style.width = "10vw"; row.appendChild(cell); } //Buchungstext
      if (j === 4) { cell.style.width = "40vw"; row.appendChild(cell); }   //Verwendungszweck
      if (j === 11) {                                                      //Begünstigter
        cell.style.width = "25vw";
        row.appendChild(cell);
      }
      if (j === 14) {                                                      //Betrag
        cell.style.width = "5vw";
        cell.style.paddingRight = "0.5vw";
        row.appendChild(cell);
        if (entries[14].charAt(1) !==  '-') { cell.classList.add('positive-background'); }
        if (entries[14].charAt(1) === '-') { cell.classList.add('negative-background'); }
      }

      if (i === 0) { cell.classList.remove('positive-background'); }
    }

    //Kategorien
    if (entries[11] !== null) {
      if (entries[11].includes('ADAC') || entries[11].includes('klarmobil') || entries[4].includes('Miete')) { row.classList.add('monthly-background-dark'); }
      if (entries[11].includes('AMAZON')) { row.classList.add('amazon-background-dark'); }
      if (entries[11].includes('PayPal')) { row.classList.add('paypal-background-dark'); }
      if (entries[11].includes('REWE')) { row.classList.add('rewe-background-dark'); }
      if (entries[11].includes('OstseeSparkasse')) { row.classList.add('ospa-background-dark'); }
    }

    let rowHolder = document.createElement('div');
    rowHolder.style.display = "block";
    rowHolder.style.paddingBottom = "1px";

    rowHolder.appendChild(row)
    table.appendChild(rowHolder);
  }
}

function resetControls() {
  let range1 = document.getElementById('slider-range1'),
  range1Clone = range1.cloneNode(true);
  range1.parentNode.replaceChild(range1Clone, range1);

  let range2 = document.getElementById('slider-range2'),
  range2Clone = range2.cloneNode(true);
  range2.parentNode.replaceChild(range2Clone, range2);
}

function initControls() {
  resetControls();
  let canvas = document.getElementById('canvas');
  let pathCanvas = document.getElementById('pathCanvas');
  let staticwrapper = document.getElementById('staticwrapper');
  let uiCanvas = document.getElementById('uicanvas');
  let uiLine = document.getElementById('uiline');
  let uipopup = document.getElementById('uipopup');

  document.body.addEventListener('keyup', function(event) {
    // +
    if (event.keyCode === 187) {
      zoomInPressed = false;
    }
    // -
    if (event.keyCode === 189) {
      zoomOutPressed = false;
    }
  });
  document.body.addEventListener('keydown', function(event) {
    if (event.keyCode === 187 && !zoomInPressed) {
      zoomInPressed = true;
      let totalChange = -parseInt((pastEvents - pastEventsOffset) * ZOOMFACTOR - (pastEvents - pastEventsOffset));
      if (pastEventsOffset - totalChange/2 > 0) {
        pastEventsOffset -= parseInt(totalChange/2);
        totalChange -= parseInt(totalChange/2);
      } else {
        pastEventsOffset = 0;
      }
      if (pastEvents + totalChange < cutTextLines.length) {
        pastEvents += totalChange;
      } else {
        pastEvents = cutTextLines.length - 2;
      }
      init();
    }
    if (event.keyCode === 189 && !zoomOutPressed) {
      zoomOutPressed = true;
      let totalChange = parseInt((pastEvents - pastEventsOffset) * ZOOMFACTOR - (pastEvents - pastEventsOffset));
      if (pastEventsOffset - totalChange/2 > 0) {
        pastEventsOffset -= parseInt(totalChange/2);
        totalChange -= parseInt(totalChange/2);
      } else {
      }
      if (pastEvents + totalChange < cutTextLines.length) {
        pastEvents += totalChange;
      } else {
        pastEvents = cutTextLines.length - 2;
      }
      init();
    }
  });

  //drag move
  staticwrapper.onmousedown = function(event) {
    dragging = true;
    dragstartX = event.clientX;
    dragstartY = event.clientY;
    ts1 = Date.now();
  };
  staticwrapper.onmouseup   = function(event) {
    if (Date.now() - ts1 > 100) { dragging = false; }
    else {
      dragging = false;
      if (linepoint.length === 0) {
        linepoint.push(event.clientX);
        linepoint.push(event.clientY + window.scrollY);
      } else {
        if (!uiLine.index) {
          uiLine.index = 0;
        }

        uiLine.index = parseInt(uiLine.index) + 1;
        ctx = uiLine.getContext('2d');
        drawLine( ctx,
                  parseInt(linepoint[0]                   - $("#uiline").offset().left),
                  parseInt(linepoint[1]                   - $("#uiline").offset().top ),
                  parseInt(event.clientX                  - $("#uiline").offset().left),
                  parseInt(event.clientY + window.scrollY - $("#uiline").offset().top ),
                  'red',
                  3);
        linepoint = [];

        //Adding Popups
        let circle = document.createElement('div');
        circle.hovered = '0';
        circle.className = 'circle'
        circle.id = "circle" + (uiLine.index + 0);
        circle.style.top  = parseInt(event.clientY - $("#uiline").offset().top  - 8 + window.scrollY) + 'px';
        circle.style.left = parseInt(event.clientX - $("#uiline").offset().left - 8                 ) + 'px';

        circle.onmouseover = function() {
          let pop = document.getElementById('popupCircle' + uiLine.index);
          pop.style.top = (event.clientY + window.scrollY - 100) + 'px';
          pop.style.left = (event.clientX + 5) + 'px';



          pop.style.opacity = '100%';
          pop.style.zIndex = '210';
          this.hovered = '1';
        };

        circle.onmouseout = function() {
          let pop = document.getElementById('popupCircle' + uiLine.index);
          pop.style.opacity = '0%';
          pop.style.zIndex = '-1';
          this.hovered = '0';
        };

        let popup = document.createElement('div');
        popup.innerHTML = '<p class="popupText">Index: ' + uiLine.index + '</p>'
                        + '<p class="popupText">Date: '  + pxToDate(circle.style.left) + '</p>'
                        + '<p class="popupText">Total: ' + (pxToValue(circle.style.top)) + ',00€</p>';
        popup.id = 'popupCircle' + uiLine.index;
        popup.className = 'popup';
        popup.style.position = 'absolute';

        document.getElementById('uipopup').appendChild(popup);
        document.getElementById('canvas').appendChild(circle);
      }
     }
  };
  staticwrapper.onmousemove = function(event) {
    if (dragging && dragstartX !== event.clientX && dragstartY !== event.clientY && Date.now() - ts1 > 50) {
      let clientX = event.clientX;
      let clientY = event.clientY;

      let diffX = dragstartX - clientX;
      let diffY = dragstartY - clientY;
      moveOffsetX -= diffX;
      moveOffsetY -= diffY;
      dragstartX = clientX;
      dragstartY = clientY;

      //move canvases
      canvas.style.marginLeft = '' + (canvas.style.marginLeft.slice(0, -2) -diffX) + 'px';
      canvas.style.marginTop  = '' + (canvas.style.marginTop.slice(0, -2) -diffY) + 'px';
      pathCanvas.style.marginLeft = '' + (pathCanvas.style.marginLeft.slice(0, -2) -diffX) + 'px';
      pathCanvas.style.marginTop  = '' + (pathCanvas.style.marginTop.slice(0, -2) -diffY) + 'px';
      uiLine.style.marginLeft = '' + (uiLine.style.marginLeft.slice(0, -2) -diffX) + 'px';
      uiLine.style.marginTop  = '' + (uiLine.style.marginTop.slice(0, -2) -diffY) + 'px';

      //move lines individually
      for (let i = 0; i < uiCanvas.children.length; i++) {
        let element = uiCanvas.children[i];
        if (element.classList.contains(('horizontal'))) {
          element.style.marginLeft = '' + (element.style.marginLeft.slice(0, -2) -diffX) + 'px';
        }
        if (element.classList.contains(('vertical'))) {
          element.style.marginTop  = '' + (element.style.marginTop.slice(0, -2) -diffY) + 'px';
        }
      }
    }
  };

  //Range Slider
  $(function() {
    $("#slider-range0").slider({
      range: 'min',
      orientation: "vertical",
      min: 0,
      max: 200,
      value: 100,
      change: function( event ) {
        let value = $("#slider-range0").slider("value");
        verticalZoomFactor = (value) / 100;
        init();
      }
    });
  });

  let totalLength = allTextLines.length - 2;
  $(function() {
    $("#slider-range1").slider({
      range: true,
      min: 0,
      max: totalLength,
      values: [totalLength - pastEventsDataset, totalLength-pastEventsOffsetDataset],
      change: function( event ) {
        setTimeout(function() {
          let value1 = $( "#slider-range1" ).slider( "values", 0 );
          let value2 = $( "#slider-range1" ).slider( "values", 1 );
          if(event.eventPhase > 0 && (pastEventsDataset !== parseInt(value2) - parseInt(value1))) {
            pastEventsDataset = parseInt(value2) - parseInt(value1);
            pastEventsOffsetDataset = totalLength - parseInt(value2);
            if (pastEventsDataset < pastEvents) { pastEvents = pastEventsDataset - 2; }
            initTextLines();
            init();
            updateRangeSlider2();
            init();
          }
        }, 100);
      }
    });
  });

  updateRangeSlider2();
}

function updateRangeSlider2() {
  let totalLength = cutTextLines.length - 2;
  if (totalLength < pastEvents) {
    pastEvents = totalLength;
  }

  $( function() {
    $( "#slider-range2" ).slider({
      range: true,
      min: 0,
      max: totalLength,
      values: [0, totalLength - pastEventsOffset],
      change: function(event) {
        totalLength = cutTextLines.length - 2;
        if (totalLength < pastEvents) { pastEvents = totalLength; }

        let value1 = $( "#slider-range2" ).slider( "values", 0 );
        let value2 = $( "#slider-range2" ).slider( "values", 1 );
        if((event.eventPhase > 0 || !event.eventPhase) && (pastEvents !== parseInt(value2) - parseInt(value1) || pastEventsOffset !== totalLength - parseInt(value2))) {
          pastEvents = parseInt(value2) - parseInt(value1) - 2;
          pastEventsOffset = totalLength - parseInt(value2);
          init();
        }
      }
    });
  });
}