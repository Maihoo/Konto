function resetControls() {
  replace('range-slider-1'),

  //toggles
  replace('toggle-monthly'),
  replace('toggle-amazon'),
  replace('toggle-paypal'),
  replace('toggle-takeout'),
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
  document.getElementById('toggle-takeout').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-food').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-cash').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-gas').addEventListener('mousedown', handleToggleClick);
  document.getElementById('toggle-others').addEventListener('mousedown', handleToggleClick);

  // drag move
  overflowrapper.onclick = handleDragClick;
  overflowrapper.onmousedown = handleDragMouseDown;

  // zooming
  overflowrapper.onwheel = (event) => { handleZoomScroll(event.deltaY < 0); event.preventDefault(); }

  // Range Slider
  initRangeSlider0();
  initRangeSlider1();
  initRangeSlider2();
  document.getElementById('date-range-start').value = startDate;

  // go to top
  window.addEventListener('scroll', handleScroll);
}

function handleDateChange() {
  const inputStart = document.getElementById('date-range-start');
  if (inputStart.value.length >= 8) {
    startDate = inputStart.value.replace('.200', '.0').replace('.201', '.1').replace('.202', '.2').replace('.203', '.3').replace('.204', '.4').replace('.205', '.5');
    selected = true;
    inputStart.classList.add('active');
  } else {
    const firstDay = allTextLines[allTextLines.length - 1].split(';');
    startDate = firstDay[selectors.date].slice(1, -1);
    inputStart.classList.remove('active');
  }

  const inputEnd = document.getElementById('date-range-end');
  if (inputEnd.value.length >= 8) {
    endDate = inputEnd.value.replace('.200', '.0').replace('.201', '.1').replace('.202', '.2').replace('.203', '.3').replace('.204', '.4').replace('.205', '.5');
    selected = true;
    inputEnd.classList.add('active');
  } else {
    if (allTextLines.length > 0) {
      const lastDay = allTextLines[1].split(';');
      endDate = lastDay[selectors.date].slice(1, -1);
      inputEnd.classList.remove('active');
    }
  }

  sessionStorage.setItem('startDate', startDate);
  sessionStorage.setItem('endDate', endDate);
}

function handleDateInput(event) {
  if (event.key === 'Enter') {
    handleDateChange();
    handleRefreshButton();
  }
}

function handleRefreshButton() {
  initTextLines();
  initDrawing();
  initRangeSlider1();
}

function checkRadios() {
  oneRadioUnchecked = false;
  if (document.getElementById('toggle-monthly').getAttribute('checked') !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-amazon').getAttribute('checked')  !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-paypal').getAttribute('checked')  !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-takeout').getAttribute('checked') !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-food').getAttribute('checked')    !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-cash').getAttribute('checked')    !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-gas').getAttribute('checked')     !== 'checked') { oneRadioUnchecked = true };
  if (document.getElementById('toggle-others').getAttribute('checked')  !== 'checked') { oneRadioUnchecked = true };
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

    initDrawing();
  }

  if (event.keyCode === 189 && !zoomOutPressed) {
    zoomOutPressed = true;
    let totalChange = parseInt((pastEvents - pastEventsOffset) * ZOOMFACTOR - (pastEvents - pastEventsOffset));
    if (pastEventsOffset - totalChange/2 > 0) {
      pastEventsOffset -= parseInt(totalChange/2);
      totalChange -= parseInt(totalChange/2);
    }

    initDrawing();
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
    'takeout':  allValues[3],
    'food':     allValues[4],
    'cash':     allValues[5],
    'gas':      allValues[6],
    'others':   allValues[7]
  };
}

function initColorPickers() {
  less.modifyVars({'@custom-ui-color': 'white'});

  const backgroundColorPicker = document.getElementById('color-picker-background');
  backgroundColorPicker.addEventListener('change', function(event) {
    backgroundColor = '' + hexToRgb(event.target.value);
    updateBackgroundColor(backgroundColor);
    initDrawing();
  });

  const lineColorPicker = document.getElementById('color-picker-line');
  lineColorPicker.addEventListener('change', function(event) {
    lineColor = hexToRgb(event.target.value);
    updateLineColor(lineColor);
    initDrawing();
  });

  const uiColorPicker = document.getElementById('color-picker-ui');
  uiColorPicker.addEventListener('change', function(event) {
    uiColor = hexToRgb(event.target.value);
    updateUiColor(uiColor);
    initDrawing();
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

function toggleGroupByCategory() {
  groupByCategory = !groupByCategory;
  sessionStorage.setItem('groupByCategory', groupByCategory);
  document.getElementById('path-toggle-span').toggleAttribute('disabled');
  if (document.getElementById('path-toggle-input').checked) {
    pathVisible = false;
    document.getElementById('path-toggle-span').click();
  }

  initTextLines();
  initRangeSlider2();
  initDrawing();
}

function toggleSpreadMonthlyIncome(event) {
  if (event instanceof KeyboardEvent && event.key === 'Enter') {
    const value = parseInt(document.getElementById('spread-income-to').value);
    if (!isNaN(value) && value > 0 && value < 100) {
      spreadMonthlyIncomeTo = value;
      document.getElementById('spread-income-to').classList.add('active');
    } else {
      spreadMonthlyIncomeTo = 0;
      document.getElementById('spread-income-to').classList.remove('active');
    }

    sessionStorage.setItem('spreadMonthlyIncomeTo', spreadMonthlyIncomeTo);
    document.getElementById('toggle-monthly').setAttribute('checked', 'checked');
    document.getElementById('toggle-amazon').setAttribute('checked', 'checked');
    document.getElementById('toggle-paypal').setAttribute('checked', 'checked');
    document.getElementById('toggle-takeout').setAttribute('checked', 'checked');
    document.getElementById('toggle-food').setAttribute('checked', 'checked');
    document.getElementById('toggle-cash').setAttribute('checked', 'checked');
    document.getElementById('toggle-gas').setAttribute('checked', 'checked');
    document.getElementById('toggle-others').setAttribute('checked', 'checked');
    initTextLines();
    initRangeSlider2();
    initDrawing();
  }
}

function toggleSquares() {
  squaresVisible = !squaresVisible;
  if (squaresVisible) {
    canvas.style.opacity = 0;
  } else {
    canvas.style.opacity = '100%';
  }
}

function togglePath() {
  if (!groupByCategory) {
    pathVisible = !pathVisible;
    if (pathVisible) {
      pathCanvas.style.opacity = '100%';
      pathBlurCanvas.style.opacity = '100%';
    } else {
      pathCanvas.style.opacity = 0;
      pathBlurCanvas.style.opacity = 0;
    }
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
    document.onmousemove = () => {};
    linepoint = [];
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

    uiPopup.appendChild(popup);
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
  initDrawing();
}

function handleDragMouseDown(event) {
  if (event.button !== 0) {
    overflowrapper.onmousemove = undefined;
    return;
  }

  dragstartX = event.clientX;
  dragstartY = event.clientY;
  dragstartXstorage = event.clientX;
  dragstartYstorage = event.clientY;
  ts1 = Date.now();
  document.onmouseup = function() {
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

      // move canvases
      const movingWrapper = document.getElementById('movingWrapper');
      movingWrapper.style.marginLeft = '' + (movingWrapper.style.marginLeft.slice(0, -2) -diffX) + 'px';
      movingWrapper.style.marginTop = '' + (movingWrapper.style.marginTop.slice(0, -2) -diffY) + 'px';
      uiCanvasHorizontal.style.marginLeft = '' + (uiCanvasHorizontal.style.marginLeft.slice(0, -2) -diffX) + 'px';
    }
  }
}


function handleScroll() {
  const scrollToTopButton = document.getElementById('scroll-to-top-button');
  if (window.scrollY > 200 && !scrollToTopButton.classList.contains('visible')) {
    scrollToTopButton.classList.add('visible');
  }
  
  if (window.scrollY <= 200 && scrollToTopButton.classList.contains('visible')) {
    scrollToTopButton.classList.remove('visible');
  }

  scrollToTopButton.offsetHeight;
}

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
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
          initDrawing();
        }
      }
    });
  });
}

function initRangeSlider1() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 7);
  const currentDateString = addZeroToSingleDigit(currentDate.getDate()) + '.' + addZeroToSingleDigit(currentDate.getMonth() + 1) + '.' + ('' + currentDate.getFullYear()).slice(2);

  console.log('hä', globallyLastDay, differenceInDays(globallyLastDay, currentDateString))
  const totalNumberOfDays = differenceInDays(globallyLastDay, currentDateString)
  let startNumberOfDays = differenceInDays(startDate, currentDateString);
  if (startDate.length < 8) {
    startNumberOfDays = 0;
  }

  let endNumberOfDays = differenceInDays(endDate, currentDateString);
  if (endDate.length < 8) {
    endNumberOfDays = 0;
  }

  console.log('START', startNumberOfDays);

  $(function() {
    $('#range-slider-1').slider({
      range: true,
      min: 0,
      max: totalNumberOfDays,
      values: [totalNumberOfDays - startNumberOfDays, totalNumberOfDays - endNumberOfDays],
      change: function(event) {
        if (event.button === 0) {
          setTimeout(function() {
            let value1 = $( '#range-slider-1' ).slider( 'values', 0 );
            let value2 = $( '#range-slider-1' ).slider( 'values', 1 );
            let tempDate = new Date();
            tempDate.setDate(currentDate.getDate() + 100);
            // find first day within bounds
            let tempDateString = addZeroToSingleDigit(tempDate.getDate()) + '.' + addZeroToSingleDigit(tempDate.getMonth() + 1) + '.' + ('' + tempDate.getFullYear()).slice(2);
            while (differenceInDays(tempDateString, currentDateString) < totalNumberOfDays - value1) {
              tempDate.setDate(tempDate.getDate() - 1);
              tempDateString = addZeroToSingleDigit(tempDate.getDate()) + '.' + addZeroToSingleDigit(tempDate.getMonth() + 1) + '.' + ('' + tempDate.getFullYear()).slice(2);
            }

            startDate = tempDateString;
            document.getElementById('date-range-start').value = tempDateString;
            // find last day within bounds
            if (totalNumberOfDays - value2 !== 0) {
              while (differenceInDays(tempDateString, currentDateString) >= totalNumberOfDays - value2) {
                tempDate.setDate(tempDate.getDate() + 1);
                tempDateString = addZeroToSingleDigit(tempDate.getDate()) + '.' + addZeroToSingleDigit(tempDate.getMonth() + 1) + '.' + ('' + tempDate.getFullYear()).slice(2);
              }

              endDate = tempDateString;
              document.getElementById('date-range-end').value = tempDateString;
            }

            let event = new KeyboardEvent('keydown', {
              bubbles: true,
              key: 'Enter'
            });

            document.getElementById('date-range-start').dispatchEvent(event);
          }, 100);
        }
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
