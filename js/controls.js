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
  let staticwrapper = document.getElementById('staticwrapper');

  //disable scrolling while in legend window
  document.getElementById('legend').addEventListener('scroll', (event) => {
    event.stopPropagation();
  });

  document.body.addEventListener('keyup', handleKeyUp);
  document.body.addEventListener('keydown', handleKeyDown);

  initColorPickers();

  // drag move
  staticwrapper.onclick = handleDragClick;
  staticwrapper.onmousedown = handleDragMouseDown;

  // Range Slider
  initRangeSlider0();
  initRangeSlider1();
  initRangeSlider2();
  initRangeSlider3();
}

function handleKeyUp(event) {
  // +
  if (event.keyCode === 187) {
    zoomInPressed = false;
  }
  // -
  if (event.keyCode === 189) {
    zoomOutPressed = false;
  }
}

function handleKeyDown(event) {
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
      pastEventsDataset += totalChange;
      pastEvents += totalChange;
      initTextLines();
    }

    init();
  }

  if (event.keyCode === 189 && !zoomOutPressed) {
    zoomOutPressed = true;
    let totalChange = parseInt((pastEvents - pastEventsOffset) * ZOOMFACTOR - (pastEvents - pastEventsOffset));
    if (pastEventsOffset - totalChange/2 > 0) {
      pastEventsOffset -= parseInt(totalChange/2);
      totalChange -= parseInt(totalChange/2);
    }

    if (pastEvents + totalChange < cutTextLines.length) {
      pastEvents += totalChange;
    } else {
      pastEvents = cutTextLines.length - 2;
    }

    init();
  }
}

function initColorPickers() {
  const backgroundColorPicker = document.getElementById('background-color-picker');
  backgroundColorPicker.addEventListener('change', function(event) {
    backgroundColor = '' + hexToRgb(event.target.value);
    sessionStorage.setItem('backgroundColor', backgroundColor);
    document.getElementById('staticwrapper').style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;
    document.getElementById('settings').style.backgroundColor = backgroundColor;
    init();
  });

  const lineColorPicker = document.getElementById('line-color-picker');
  lineColorPicker.addEventListener('change', function(event) {
    lineColor = hexToRgb(event.target.value);
    sessionStorage.setItem('lineColor', lineColor);
    init();
  });

  const gridColorPicker = document.getElementById('grid-color-picker');
  gridColorPicker.addEventListener('change', function(event) {
    gridColor = hexToRgb(event.target.value);
    sessionStorage.setItem('gridColor', gridColor);
    init();
  });
}

function handleDragClick(event) {
  if (event.button !== 0 || ((dragstartXstorage !== event.clientX || dragstartYstorage !== event.clientY) && ts1 - Date.now() < 50) ) {
    return;
  }

  let uiLine = document.getElementById('uiline');
  let uilinetemp = document.getElementById('uilinetemp');

  if (linepoint.length === 0) {
    staticwrapper.style.cursor = 'crosshair';
    linepoint.push(event.clientX);
    linepoint.push(event.clientY + window.scrollY);
    document.onmousemove = (event) => handlePrediction(event);
  } else {
    // finish prediction line
    let uiltCtx = uilinetemp.getContext('2d');
    uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
    drawLine( uiltCtx,
              parseInt(linepoint[0] - $("#uiline").offset().left),
              parseInt(linepoint[1] - $("#uiline").offset().top ),
              parseInt(event.clientX - $("#uiline").offset().left),
              parseInt(event.clientY + window.scrollY - $("#uiline").offset().top ),
              'rgba(255, 0, 0, 0.5)',
              1);

    staticwrapper.style.cursor = '';
    uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
    if (!uiLine.index) {
      uiLine.index = 0;
    }

    uiLine.index = parseInt(uiLine.index) + 1;
    ctx = uiLine.getContext('2d');
    drawLine( ctx,
              parseInt(linepoint[0] - $("#uiline").offset().left),
              parseInt(linepoint[1] - $("#uiline").offset().top ),
              parseInt(event.clientX - $("#uiline").offset().left),
              parseInt(event.clientY + window.scrollY - $("#uiline").offset().top ),
              'rgba(255, 0, 0, 0.5)',
              2);
    linepoint = [];

    document.onmousemove = () => {};

    // Adding Popups
    let circle = document.createElement('div');
    circle.hovered = '0';
    circle.className = 'circle'
    circle.id = "circle" + (uiLine.index + 0);
    circle.style.top  = (parseInt(event.clientY - $("#uiline").offset().top  - 6 + window.scrollY) - 600) + 'px';
    circle.style.left =  parseInt(event.clientX - $("#uiline").offset().left - 6) + 'px';

    circle.onmouseover = function(e) {
      let pop = document.getElementById('popupCircle' + uiLine.index);
      pop.style.top  = (e.clientY + window.scrollY - 100) + 'px';
      pop.style.left = (e.clientX + 5) + 'px';
      pop.style.position = 'absolute';
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

function handleDragMouseDown(event) {
  if (event.button !== 0) {
    return;
  }

  let canvas = document.getElementById('canvas');
  let pathCanvas = document.getElementById('pathCanvas');
  let pathBlurCanvas = document.getElementById('pathBlurCanvas');
  let uiLine = document.getElementById('uiline');
  let uilinetemp = document.getElementById('uilinetemp');
  let uiCanvas = document.getElementById('uicanvas');

  dragstartX = event.clientX;
  dragstartY = event.clientY;
  dragstartXstorage = event.clientX
  dragstartYstorage = event.clientY
  ts1 = Date.now();
  staticwrapper.onmouseup = function(event) {
    staticwrapper.onmousemove = undefined;
  }

  staticwrapper.onmousemove = function(event) {
    if (Date.now() - ts2 > 20 && dragstartX !== event.clientX && dragstartY !== event.clientY) {
      ts2 = Date.now();
      let clientX = event.clientX;
      let clientY = event.clientY;
      let diffX = dragstartX - clientX;
      let diffY = dragstartY - clientY;
      moveOffsetX -= diffX;
      moveOffsetY -= diffY;
      dragstartX = clientX;
      dragstartY = clientY;

      // move canvases
      canvas.style.marginLeft = '' + (canvas.style.marginLeft.slice(0, -2) -diffX) + 'px';
      canvas.style.marginTop = '' + (canvas.style.marginTop.slice(0, -2) -diffY) + 'px';
      pathCanvas.style.marginLeft = '' + (pathCanvas.style.marginLeft.slice(0, -2) -diffX) + 'px';
      pathCanvas.style.marginTop = '' + (pathCanvas.style.marginTop.slice(0, -2) -diffY) + 'px';
      pathBlurCanvas.style.marginLeft = '' + (pathBlurCanvas.style.marginLeft.slice(0, -2) -diffX) + 'px';
      pathBlurCanvas.style.marginTop = '' + (pathBlurCanvas.style.marginTop.slice(0, -2) -diffY) + 'px';
      uiLine.style.marginLeft = '' + (uiLine.style.marginLeft.slice(0, -2) -diffX) + 'px';
      uiLine.style.marginTop = '' + (uiLine.style.marginTop.slice(0, -2) -diffY) + 'px';
      uilinetemp.style.marginLeft = '' + (uilinetemp.style.marginLeft.slice(0, -2) -diffX) + 'px';
      uilinetemp.style.marginTop = '' + (uilinetemp.style.marginTop.slice(0, -2) -diffY) + 'px';

      // move lines individually
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
  }
}

function initRangeSlider0() {
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
        sessionStorage.setItem('verticalZoomFactor', verticalZoomFactor);
        init();
      }
    });
  });
}

function initRangeSlider1() {
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
          if (event.eventPhase > 0 && (pastEventsDataset !== parseInt(value2) - parseInt(value1))) {
            pastEventsDataset = parseInt(value2) - parseInt(value1);
            pastEventsOffsetDataset = totalLength - parseInt(value2);
            sessionStorage.setItem('pastEventsDataset', pastEventsDataset);
            sessionStorage.setItem('pastEventsOffsetDataset', pastEventsOffsetDataset);
            if (pastEventsDataset < pastEvents) { pastEvents = pastEventsDataset - 2; }
            initTextLines();
            initRangeSlider2();
            init();
          }
        }, 100);
      }
    });
  });
}

function initRangeSlider2() {
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
        if (totalLength < pastEvents) {
          pastEvents = totalLength;
        }
        let value1 = $( "#slider-range2" ).slider( "values", 0 );
        let value2 = $( "#slider-range2" ).slider( "values", 1 );
        if ((event.eventPhase > 0 || !event.eventPhase) && (pastEvents !== parseInt(value2) - parseInt(value1) || pastEventsOffset !== totalLength - parseInt(value2))) {
          pastEvents = parseInt(value2) - parseInt(value1) - 2;
          pastEventsOffset = totalLength - parseInt(value2);
          sessionStorage.setItem('pastEvents', pastEvents);
          sessionStorage.setItem('pastEventsOffset', pastEventsOffset);
          if (event.originalEvent) {
            init();
          }
        }
      }
    });
  });
}

function initRangeSlider3() {
  $(function() {
    $("#slider-range3").slider({
      range: 'min',
      orientation: "vertical",
      min: 0,
      max: 400,
      value: 300,
      change: function( event ) {
        let value = $("#slider-range3").slider("value");
        value = 400 - value;
        legendMultiplier = value;
        sessionStorage.setItem('legendMultiplyer', value);
        init();
      }
    });
  });
}

function handlePrediction(event) {
  let uilinetemp = document.getElementById('uilinetemp');
  let uiltCtx = uilinetemp.getContext('2d');
  uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
  drawLine( uiltCtx,
            parseInt(linepoint[0] - $("#uiline").offset().left),
            parseInt(linepoint[1] - $("#uiline").offset().top ),
            parseInt(event.clientX - $("#uiline").offset().left),
            parseInt(event.clientY + window.scrollY - $("#uiline").offset().top ),
            'rgba(255, 0, 0, 0.5)',
            1);
}

function processAllPDFs() {
  pdfNames = [
    'statements/Konto_1101110771-Auszug_2019_0004.pdf',
    'statements/Konto_1101110771-Auszug_2019_0005.pdf',
    'statements/Konto_1101110771-Auszug_2019_0006.pdf',
    'statements/Konto_1101110771-Auszug_2019_0007.pdf',
    'statements/Konto_1101110771-Auszug_2020_0001.pdf',
    'statements/Konto_1101110771-Auszug_2020_0002.pdf',
    'statements/Konto_1101110771-Auszug_2020_0003.pdf',
    'statements/Konto_1101110771-Auszug_2020_0004.pdf',
    'statements/Konto_1101110771-Auszug_2020_0005.pdf',
    'statements/Konto_1101110771-Auszug_2020_0006.pdf',
    'statements/Konto_1101110771-Auszug_2020_0007.pdf',
    'statements/Konto_1101110771-Auszug_2020_0008.pdf',
    'statements/Konto_1101110771-Auszug_2020_0009.pdf',
    'statements/Konto_1101110771-Auszug_2020_0010.pdf',
    'statements/Konto_1101110771-Auszug_2020_0011.pdf',
    'statements/Konto_1101110771-Auszug_2020_0012.pdf',
    'statements/Konto_1101110771-Auszug_2021_0001.pdf',
    'statements/Konto_1101110771-Auszug_2021_0002.pdf',
    'statements/Konto_1101110771-Auszug_2021_0003.pdf',
    'statements/Konto_1101110771-Auszug_2021_0004.pdf',
    'statements/Konto_1101110771-Auszug_2021_0005.pdf'
  ];

  for (let i = pdfNames.length - 1; i > 0; i--) {
    setTimeout(() => {
      console.log('processing pdf', pdfNames[i]);

      processPDFContent(pdfNames[i]);
    }, (pdfNames.length - i) * 200);
  }

  setTimeout(() => {
    initTextLines();
    initControls();
    init();
  }, (pdfNames.length + 1) * 200);
}

function processPDFContent(name) {
  let totalTotal = 0;
  fetch(name)
    .then(response => response.arrayBuffer())
    .then(data => {
      // Load PDF file using pdf.js
      return pdfjsLib.getDocument(new Uint8Array(data)).promise;
    })
    .then(pdf => {
      // clear past lines
      pdfImportedLines = [];
      // Read PDF content
      const numPages = pdf.numPages;
      for (let i = numPages; i >= 1; i--) {
        console.log('Page', i);
        pdf.getPage(i).then(page => {
          return page.getTextContent();
        }).then(content => {
          setTimeout(() => {
            // Extract text from the PDF page
            let allLines = [];
            for (let j = content.items.length - 1; j > 0; j--) {
              let itemString = content.items[j].str;
              itemString = itemString.replace(/\n/g, ''); // replace breaks
              itemString = itemString.replace(/\t/g, ''); // replace tabs
              itemString = itemString.replace(/ /g, '');  // replace spaces
              console.log(itemString);

              allLines.push(itemString);
            }
            // clear empty lines
            allLines = allLines.filter(function(item) {
              return item !== '' && item !== '.';
            });

            for (let j = 1; j < allLines.length - 1; j++) {
              if (allLines[j].length === 10 && allLines[j - 1].length === 10) {
                for (let k = 1; k < 12; k++) {
                  let nextAmount = allLines[j + k];
                  if (parseFloat(nextAmount.slice(0, -1)) != NaN && (nextAmount.charAt(nextAmount.length - 1) === '+' || nextAmount.charAt(nextAmount.length - 1) === '-')) {
                    let dateParts = allLines[j].split('.');
                    if (dateParts.length >= 3 && !allLines[j + k + 1].includes('Kontostand')) {
                      const date = dateParts[0] + '.' + dateParts[1] + '.' + dateParts[2].slice(2);
                      let purpose = allLines[j + 2];
                      if (j + 2 !== j + k - 1) {
                        purpose += ' ' + allLines[j + k - 1];
                      }

                      let amount = allLines[j + k];
                      amount.replace('.', '');
                      amount.replace(',', '.');

                      if (amount.charAt(amount.length - 1) === '-') {
                        amount = '-' + amount.slice(0, -1);
                      } else {
                        amount = amount.slice(0, -1);
                      }

                      if (parseFloat(amount) === NaN) {
                        amount = 0;
                      }

                      totalTotal += parseFloat(amount);
                      console.log('totalTotal', totalTotal, amount);
                        if (parseFloat(amount) > 0) {
                      }
                      if (!isNaN(parseFloat(amount))) {
                        //                                        date              text                          purpose                             beneficiary                     amount
                        dataset += '"DE45150505001101110771";"' + date + '";"";"' + allLines[j + k - 3] + '";"' + purpose + '";"";"";"";"";"";"";"' + allLines[j + 3] + '";"";"";"' + parseFloat(amount) + '";"EUR";""\n';
                      }
                    }

                    k = 20;
                  }
                }
              }
            }
          }, (numPages - i) * 20);
        }).then();
      }
    })
    .catch(error => {
      console.error("Error reading PDF file:", error);
    }
  );

  setTimeout(() => {
    console.log('totalTotal', totalTotal);
  }, 10000);

}