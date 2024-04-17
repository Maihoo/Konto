function resetControls() {
  replace('range-slider-1'),

  //toggles
  replace('toggle-monthly'),
  replace('toggle-amazon'),
  replace('toggle-paypal'),
  replace('toggle-food'),
  replace('toggle-cash'),
  replace('toggle-gas'),
  replace('toggle-others'),

  handleZoomScroll(true);
  handleZoomScroll(false);
}

function replace(id) {
  let originalElement = document.getElementById(id);
  if (originalElement instanceof HTMLElement) {
    clonedElement = originalElement.cloneNode(true);
    originalElement.parentNode.replaceChild(clonedElement, originalElement);
  } else {
    console.log('couldnt find element with id', id);
  }
}

function initControls() {
  resetControls();
  let overflowrapper = document.getElementById('overflowrapper');

  // disable scrolling while in legend window
  document.getElementById('legend').addEventListener('scroll', (event) => {
    event.stopPropagation();
  });

  document.body.addEventListener('keyup', handleKeyUp);
  document.body.addEventListener('keydown', handleKeyDown);

  initColorPickers();
  initCategoryToggles();

  // toggles
  document.getElementById('toggle-monthly').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-amazon').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-paypal').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-food').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-cash').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-gas').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-others').addEventListener('mousedown', handleToggleClick);

  document.getElementById('toggle-monthly').setAttribute('checked', 'checked');
  document.getElementById('toggle-amazon').setAttribute('checked', 'checked');
  document.getElementById('toggle-paypal').setAttribute('checked', 'checked');
  document.getElementById('toggle-food').setAttribute('checked', 'checked');
  document.getElementById('toggle-cash').setAttribute('checked', 'checked');
  document.getElementById('toggle-gas').setAttribute('checked', 'checked');
  document.getElementById('toggle-others').setAttribute('checked', 'checked');

  // drag move
  overflowrapper.onclick = handleDragClick;
  overflowrapper.onmousedown = handleDragMouseDown;

  // zooming
  overflowrapper.onwheel = (event) => { handleZoomScroll(event.deltaY < 0); event.preventDefault(); }

  // Range Slider
  initRangeSlider0();
  initRangeSlider1();
  initRangeSlider2();
}

function handleRefreshButton() {
  initTextLines();
  init();
  initRangeSlider1();
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

function handleToggleClick() {
  let selector = '.square';
  selector = this.id.split('-')[1] + '-background';

  const targets = document.querySelectorAll('.' + selector);
  if (this.getAttribute('checked') === 'checked') {
    targets.forEach(target => {
      if (target instanceof HTMLElement) {
        target.classList.add('toggle-transparent');
      }
    });
  } else {
    targets.forEach(target => {
      if (target instanceof HTMLElement) {
        target.classList.remove('toggle-transparent');
      }
    });
  }
}

// TODO: fix maybe
function handleKeyDown(event) {
  // reset
  if (event.keyCode === 46) {
    resetSettings();
  }

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
      pastEvents = cutTextLines.length - 1;
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

function initCategoryToggles() {
  for (let i = 0; i < categories.length; i++) {
    addEventListenerToToggles(categories[i]);
  }

  updateActiveCategories();
}

function addEventListenerToToggles(category) {
  document.getElementById('toggle-' + category).addEventListener('mouseup', (event) => {
    if (document.getElementById('toggle-' + category).getAttribute('checked') === 'checked') {
      document.getElementById('toggle-' + category).removeAttribute('checked');
      sessionStorage.setItem('toggle-' + category, false);
    } else {
      document.getElementById('toggle-' + category).setAttribute('checked', 'checked');
      sessionStorage.setItem('toggle-' + category, true);
    }

    updateActiveCategories();
  });
}

function updateActiveCategories() {
  let allValues = [];
  for (let i = 0; i < categories.length; i++) {
    allValues.push(sessionStorage.getItem('toggle-' + categories[i]));
  }

  activeCategories = {
    'monthly':  allValues[0],
    'amazon':   allValues[1],
    'paypal':   allValues[2],
    'food':     allValues[3],
    'cash':     allValues[4],
    'gas':      allValues[5],
    'others':   allValues[6]
  };
}

function initColorPickers() {
  less.modifyVars({'@custom-ui-color': 'white'});

  const backgroundColorPicker = document.getElementById('color-picker-background');
  backgroundColorPicker.addEventListener('change', function(event) {
    backgroundColor = '' + hexToRgb(event.target.value);
    updateBackgroundColor(backgroundColor);
    init();
  });

  const lineColorPicker = document.getElementById('color-picker-line');
  lineColorPicker.addEventListener('change', function(event) {
    lineColor = hexToRgb(event.target.value);
    updateLineColor(lineColor);
    init();
  });

  const uiColorPicker = document.getElementById('color-picker-ui');
  uiColorPicker.addEventListener('change', function(event) {
    uiColor = hexToRgb(event.target.value);
    updateUiColor(uiColor);
    init();
  });

  backgroundColor = '' + hexToRgb(backgroundColorPicker.value);
  updateBackgroundColor(backgroundColor);
  lineColor = hexToRgb(lineColorPicker.value);
  updateLineColor(lineColor);
  uiColor = hexToRgb(uiColorPicker.value);
  updateUiColor(uiColor);
}

function updateBackgroundColor(color) {
  sessionStorage.setItem('backgroundColor', color);
  document.getElementById('overflowrapper').style.backgroundColor = color;
  document.getElementById('settings').style.backgroundColor = color;
  document.body.style.backgroundColor = color;
  less.modifyVars({'@custom-background-color': color});
}

function updateLineColor(color) {
  sessionStorage.setItem('lineColor', color);
  less.modifyVars({'@custom-line-color': color});
}

function updateUiColor(color) {
  sessionStorage.setItem('uiColor', color);
  less.modifyVars({'@custom-ui-color': color});
}

function toggleOptions() {
  settingsExtended = !settingsExtended;
  sessionStorage.setItem('settingsExtended', settingsExtended);

  if (settingsExtended) {
    document.getElementById('settings').classList.add('settings-hidden');
  } else {
    document.getElementById('settings').classList.remove('settings-hidden');
  }
}

function toggleSettingsOrientation() {
  settingsVertical = !settingsVertical;
  sessionStorage.setItem('settingsVertical', settingsVertical);

  if (settingsVertical) {
    document.getElementById('graph-area-wrapper').classList.add('graph-area-wrapper-vertical');
    document.getElementById('settings').classList.remove('settings-hidden');
  } else {
    document.getElementById('graph-area-wrapper').classList.remove('graph-area-wrapper-vertical');
  }
}

function togglePath() {
  pathMode = !pathMode;

  if (pathMode) {
    canvas.style.opacity = 0;
    pathCanvas.style.opacity = '100%';
    pathBlurCanvas.style.opacity = '100%';
  } else {
    canvas.style.opacity = '100%';
    pathCanvas.style.opacity = 0;
    pathBlurCanvas.style.opacity = 0;
  }
}

function toggleGrid() {
  if (gridMode) {
    uiCanvas.style.opacity = '100%';
    uiCanvasVertical.style.opacity = '100%';
    uiCanvasHorizontal.style.opacity = '100%';
  } else {
    uiCanvas.style.opacity = 0;
    uiCanvasVertical.style.opacity = 0;
    uiCanvasHorizontal.style.opacity = 0;
  }

  gridMode = !gridMode;
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    linepoint = [];
    overflowrapper.style.cursor = '';
    let uiLine = document.getElementById('uiline');
    let uilinetemp = document.getElementById('uilinetemp');
    let uiltCtx = uilinetemp.getContext('2d');
    uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
    if (!uiLine.index) {
      uiLine.index = 0;
    }

    document.removeEventListener('keydown', handleEscape);
  }
}

function handleDragClick(event) {
  if (event.button !== 0 || ((dragstartXstorage !== event.clientX || dragstartYstorage !== event.clientY) && ts1 - Date.now() < 50) ) {
    return;
  }

  let uiLine = document.getElementById('uiline');
  let uilinetemp = document.getElementById('uilinetemp');

  if (linepoint.length === 0) {
    overflowrapper.style.cursor = 'crosshair';
    linepoint.push(event.clientX);
    linepoint.push(event.clientY + window.scrollY);
    document.onmousemove = (event) => handlePrediction(event);
    document.addEventListener('keydown', handleEscape);
  } else {
    // finish prediction line
    let uiltCtx = uilinetemp.getContext('2d');
    uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
    drawLine( uiltCtx,
              parseInt(linepoint[0] - $('#uiline').offset().left),
              parseInt(linepoint[1] - $('#uiline').offset().top ),
              parseInt(event.clientX - $('#uiline').offset().left),
              parseInt(event.clientY + window.scrollY - $('#uiline').offset().top ),
              'rgba(255, 0, 0, 0.5)',
              1);

    overflowrapper.style.cursor = '';
    uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
    if (!uiLine.index) {
      uiLine.index = 0;
    }

    uiLine.index = parseInt(uiLine.index) + 1;
    ctx = uiLine.getContext('2d');
    drawLine( ctx,
              parseInt(linepoint[0] - $('#uiline').offset().left),
              parseInt(linepoint[1] - $('#uiline').offset().top ),
              parseInt(event.clientX - $('#uiline').offset().left),
              parseInt(event.clientY + window.scrollY - $('#uiline').offset().top ),
              'rgba(255, 0, 0, 0.5)',
              2);
    linepoint = [];

    document.onmousemove = () => {};

    // Adding Popups
    let circle = document.createElement('div');
    circle.hovered = '0';
    circle.className = 'circle'
    circle.id = 'circle' + (uiLine.index + 0);
    circle.style.top = (parseInt(event.clientY - $('#uiline').offset().top  - 6 + window.scrollY) - 600) + 'px';
    circle.style.left = parseInt(event.clientX - $('#uiline').offset().left - 6) + 'px';

    circle.onmouseover = function(e) {
      let pop = document.getElementById('popupCircle' + uiLine.index);
      pop.style.top = (e.clientY + window.scrollY - 100) + 'px';
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
                    + '<p class="popupText">Date: ' + pxToDate(circle.style.left) + '</p>'
                    + '<p class="popupText">Total: ' + numberToCurrency(pxToValue(circle.style.top)) + '</p>';
    popup.id = 'popupCircle' + uiLine.index;
    popup.className = 'popup';
    popup.style.position = 'absolute';

    uipopup.appendChild(popup);
    canvas.appendChild(circle);
  }
}

function handleZoomScroll(zoomIn) {
  if (zoomIn) {
    zoomLevel *= 1.02;
  } else {
    zoomLevel /= 1.02;
  }

  this.zoomingWrapper.style.transform = 'scale(' + zoomLevel + ')';
  this.zoomingWrapper.style.width = (originalWidth / zoomLevel) + 'px';
  this.zoomingWrapper.style.height = (originalHeight / zoomLevel) + 'px';
  this.zoomingWrapper.style.top = (originalTop - ((this.zoomingWrapper.offsetHeight - originalHeight) / 2) - 40) + 'px';
  this.zoomingWrapper.style.left = (originalLeft - ((this.zoomingWrapper.offsetWidth - originalWidth) / 2) - 45) + 'px';

  const top = document.getElementById('ui-element-value-top');
  if (top instanceof HTMLElement) {
    top.style.right = (originalWidth / zoomLevel) + 'px';
  }

  sessionStorage.setItem('zoomLevel', zoomLevel);
}

function handleDragMouseDown(event) {
  if (event.button !== 0) {
    return;
  }

  dragstartX = event.clientX;
  dragstartY = event.clientY;
  dragstartXstorage = event.clientX;
  dragstartYstorage = event.clientY;
  ts1 = Date.now();
  overflowrapper.onmouseup = function() {
    overflowrapper.onmousemove = undefined;
  }

  overflowrapper.onmousemove = function(event) {
    if (Date.now() - ts2 > 20 && dragstartX !== event.clientX && dragstartY !== event.clientY) {
      ts2 = Date.now();
      let clientX = event.clientX;
      let clientY = event.clientY;
      let diffX = dragstartX - clientX;
      let diffY = dragstartY - clientY;
      diffX /= zoomLevel;
      diffY /= zoomLevel;
      moveOffsetX -= diffX;
      moveOffsetY -= diffY;
      dragstartX = clientX;
      dragstartY = clientY;

      const uiLine = document.getElementById('uiline');

      // move canvases
      const movingWrapper = document.getElementById('movingWrapper');
      movingWrapper.style.marginLeft = '' + (movingWrapper.style.marginLeft.slice(0, -2) -diffX) + 'px';
      movingWrapper.style.marginTop = '' + (movingWrapper.style.marginTop.slice(0, -2) -diffY) + 'px';
      uiCanvasHorizontal.style.marginLeft = '' + (uiCanvasHorizontal.style.marginLeft.slice(0, -2) -diffX) + 'px';
    }
  }
}

function initRangeSlider0() {
  $(function() {
    $('#range-slider-0').slider({
      range: 'min',
      orientation: 'vertical',
      min: 0,
      max: 200,
      value: verticalScaleFactor * 100,
      change: function( event ) {
        let value = $('#range-slider-0').slider('value');
        if (verticalScaleFactor !== (value) / 100) {
          verticalScaleFactor = (value) / 100;
          sessionStorage.setItem('verticalScaleFactor', verticalScaleFactor);
          resetHTML();
          init();
        }
      }
    });
  });
}

function initRangeSlider1() {
  let totalLength = allTextLines.length - 2;

  $(function() {
    $('#range-slider-1').slider({
      range: true,
      min: 0,
      max: totalLength,
      values: [totalLength - pastEvents, totalLength - pastEventsOffset],
      change: function( event ) {
        setTimeout(function() {
          let value1 = $( '#range-slider-1' ).slider( 'values', 0 );
          let value2 = $( '#range-slider-1' ).slider( 'values', 1 );
          if (event.eventPhase > 0 && (pastEvents !== parseInt(value2) - parseInt(value1))) {
            pastEvents = parseInt(value2) - parseInt(value1);
            pastEventsOffset = totalLength - parseInt(value2);
            sessionStorage.setItem('pastEvents', pastEvents);
            sessionStorage.setItem('pastEventsOffset', pastEventsOffset);
            initTextLines();
            init();
          }
        }, 100);
      }
    });
  });
}

function initRangeSlider2() {
  $(function() {
    $('#range-slider-2').slider({
      range: 'min',
      orientation: 'vertical',
      min: 0,
      max: 400,
      value: 400 - legendMultiplier,
      change: function( event ) {
        let value = $('#range-slider-2').slider('value');
        value = 400 - value;
        if (legendMultiplier !== value) {
          legendMultiplier = value;
          sessionStorage.setItem('legendMultiplyer', value);
          drawLegends();
        }
      }
    });
  });
}

function setColorDefault() {
  // remember to set color-picker value (currently "#191919")
  backgroundColor = '25, 25, 25';
  lineColor = '255, 0, 0';
  uiColor = '255, 255, 255';

  document.getElementById('color-picker-background').value = rgbToHex(backgroundColor);
  document.getElementById('color-picker-line').value = rgbToHex(lineColor);
  document.getElementById('color-picker-ui').value = rgbToHex(uiColor);

  document.getElementById('color-picker-background').dispatchEvent(new Event('change'));
  document.getElementById('color-picker-line').dispatchEvent(new Event('change'));
  document.getElementById('color-picker-ui').dispatchEvent(new Event('change'));
}

function setColorLight() {
  backgroundColor = '200, 200, 200';
  lineColor = '50, 50, 255';
  uiColor = '0, 0, 0';

  document.getElementById('color-picker-background').value = rgbToHex(backgroundColor);
  document.getElementById('color-picker-line').value = rgbToHex(lineColor);
  document.getElementById('color-picker-ui').value = rgbToHex(uiColor);

  document.getElementById('color-picker-background').dispatchEvent(new Event('change'));
  document.getElementById('color-picker-line').dispatchEvent(new Event('change'));
  document.getElementById('color-picker-ui').dispatchEvent(new Event('change'));
}

function setColorUnset() {

}

function handlePrediction(event) {
  let uilinetemp = document.getElementById('uilinetemp');
  let uiltCtx = uilinetemp.getContext('2d');
  uiltCtx.clearRect(0, 0, uilinetemp.width, uilinetemp.height);
  drawLine(uiltCtx,
    parseInt(linepoint[0] - $('#uiline').offset().left),
    parseInt(linepoint[1] - $('#uiline').offset().top ),
    parseInt(event.clientX - $('#uiline').offset().left),
    parseInt(event.clientY + window.scrollY - $('#uiline').offset().top ),
    'rgba(255, 0, 0, 0.5)',
    1);
}

function processAllPDFs() {
  document.getElementById('spinner-element').style.display = 'block';

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

  let totalDiff = allTextLines.length - 2 - pastEvents;

  // Start the processing chain
  processSinglePDF(pdfNames.length - 1, totalDiff)
    .catch(error => {
      console.error('Error processing PDFs:', error);
    });
}

function processSinglePDF(index, previousTotalMinusPastEvents) {
  if (index >= 0) {
    return processPDFContent(pdfNames[index])
      .then(() => processSinglePDF(index - 1, previousTotalMinusPastEvents)); // Process the next PDF in the chain
  } else {
    // All PDFs processed, perform any final actions
    initTextLines();
    pastEvents = allTextLines.length - previousTotalMinusPastEvents - 2;
    initTextLines();
    initControls();
    init();
  }
}

function processPDFContent(name) {
  return new Promise((resolve, reject) => {
    let totalAmount = 0;
    fetch(name)
      .then(response => response.arrayBuffer())
      .then(data => pdfjsLib.getDocument(new Uint8Array(data)).promise)
      .then(pdf => {
        const numPages = pdf.numPages;

        // Helper function to process a single page
        function processSinglePage(pageIndex) {
          if (pageIndex >= 1) {
            return pdf.getPage(pageIndex)
              .then(page => page.getTextContent())
              .then(content => {
                totalAmount += processPage(content, (numPages - pageIndex) * 20);
              })
              .then(() => processSinglePage(pageIndex - 1)); // Process the next page in the chain
          } else {
            // All pages processed for this PDF
            resolve();
          }
        }

        // Start processing pages for this PDF
        processSinglePage(numPages)
          .then(() => resolve(totalAmount));
      })
      .catch(error => {
        console.error('Error reading PDF file:', error);
        reject(error);
      });
  });
}

function processPage(content) {
  let totalAmount = 0;
  return new Promise(resolve => {
      // Extract text from the PDF page
      let allLines = [];
      for (let j = content.items.length - 1; j > 0; j--) {
        let itemString = content.items[j].str;
        itemString = itemString.replace(/\n/g, ''); // replace breaks
        itemString = itemString.replace(/\t/g, ''); // replace tabs
        itemString = itemString.replace(/ /g, '');  // replace spaces
        allLines.push(itemString);
      }
      // clear empty lines
      allLines = allLines.filter(function(item) {
        return item !== '' && item !== '.';
      });

      for (let j = 1; j < allLines.length - 1; j++) {
        if (allLines[j].charAt(2) === '.' && allLines[j].charAt(5) === '.' && allLines[j].length > (15)) {
          const temp = allLines[j];
          allLines[j] = temp.slice(10, 20);
          allLines.splice(j, 0, temp.slice(0, 10));
        }

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

                totalAmount += parseFloat(amount);
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

      resolve();
  });
}

function processPage22(content, timeout) {
  let totalAmount = 0;
  setTimeout(() => {
    // Extract text from the PDF page
    let allLines = [];
    for (let j = content.items.length - 1; j > 0; j--) {
      let itemString = content.items[j].str;
      itemString = itemString.replace(/\n/g, ''); // replace breaks
      itemString = itemString.replace(/\t/g, ''); // replace tabs
      itemString = itemString.replace(/ /g, '');  // replace spaces

      allLines.push(itemString);
    }
    // clear empty lines
    allLines = allLines.filter(function(item) {
      return item !== '' && item !== '.';
    });

    for (let j = 1; j < allLines.length - 1; j++) {
      if (allLines[j].charAt(2) === '.' && allLines[j].charAt(5) === '.' && allLines[j].length > (15)) {
        const temp = allLines[j];
        allLines[j] = temp.slice(10, 20);
        allLines.splice(j, 0, temp.slice(0, 10));
      }

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

              totalAmount += parseFloat(amount);
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

    return totalAmount;
  }, timeout);
}
