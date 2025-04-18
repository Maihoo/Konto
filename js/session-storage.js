function clearSessionStorage() {
  sessionStorage.setItem('startDate', '01.08.24');
  sessionStorage.setItem('endDate', '');
  sessionStorage.setItem('backgroundColor', 'rgb(25, 25, 25)');
  sessionStorage.setItem('lineColor', 'rgb(255, 0, 0)');
  sessionStorage.setItem('uiColor', 'rgb(255, 255, 255)');
  sessionStorage.setItem('settingsExtended', '');
  sessionStorage.setItem('settingsVertical', '');
  sessionStorage.setItem('sortType', '');
  sessionStorage.setItem('groupByCategory', '');
  sessionStorage.setItem('showInvestments', '');
  sessionStorage.setItem('spreadMonthlyIncomeTo', '');
  sessionStorage.setItem('verticalScaleFactor', '');
  sessionStorage.setItem('zoomLevel', '');
  sessionStorage.setItem('legendMultiplyer', '');

  for (let i = 0; i < categories.length; i++) {
    sessionStorage.setItem('toggle-' + categories[i], 'true');
  }
}

function getFromSessionStorage() {
  let sessionValue = sessionStorage.getItem('startDate');
  if (sessionValue && parseInt(sessionValue) >= 0) {
    startDate = parseInt(sessionValue);
  }

  sessionValue = sessionStorage.getItem('endDate');
  if (sessionValue && parseInt(sessionValue) >= 0) {
    endDate = parseInt(sessionValue);
  }

  sessionValue = sessionStorage.getItem('backgroundColor');
  if (sessionValue && sessionValue.length > 0) {
    backgroundColor = sessionValue;
    less.modifyVars({'@custom-background-color': backgroundColor});
    document.getElementById('overflowWrapper').style.backgroundColor = sessionValue;
    document.getElementById('color-picker-background').value = rgbToHex(sessionValue);

    document.getElementById('overflowWrapper').style.backgroundColor = backgroundColor;
    document.getElementById('settings').style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;
  }

  sessionValue = sessionStorage.getItem('lineColor');
  if (sessionValue && sessionValue.length > 0) {
    lineColor = sessionValue;
    less.modifyVars({'@custom-line-color': lineColor});
    document.getElementById('color-picker-line').value = rgbToHex(sessionValue);
  }

  sessionValue = sessionStorage.getItem('uiColor');
  if (sessionValue && sessionValue.length > 0) {
    uiColor = sessionValue;
    less.modifyVars({'@custom-ui-color': uiColor});
    document.getElementById('color-picker-ui').value = rgbToHex(sessionValue);
  }

  sessionValue = sessionStorage.getItem('sortType');
  if (sessionValue && sessionValue.length > 0) {
    sortType = sessionValue;
    if (sortType === 'amount') {
      document.getElementById('sort-value-input').setAttribute('checked', 'checked');
    } else {
      document.getElementById('sort-value-input').removeAttribute('checked');
    }
  }

  sessionValue = sessionStorage.getItem('verticalScaleFactor');
  if (sessionValue && sessionValue.length > 0) {
    verticalScaleFactor = sessionValue;
  }

  sessionValue = sessionStorage.getItem('zoomLevel');
  if (sessionValue && sessionValue.length > 0) {
    zoomLevel = sessionValue;
  }

  sessionValue = sessionStorage.getItem('legendMultiplyer');
  if (sessionValue && sessionValue.length > 0) {
    legendMultiplier = sessionValue;
  }

  let allValues = [];
  for (let i = 0; i < categories.length; i++) {
    allValues.push(sessionStorage.getItem('toggle-' + categories[i]) === 'false');
    if (allValues[allValues.length - 1]) {
      document.getElementById('toggle-' + categories[i]).removeAttribute('checked');
    } else {
      document.getElementById('toggle-' + categories[i]).setAttribute('checked', 'checked');
    }
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

  sessionValue = sessionStorage.getItem('settingsExtended');
  if (sessionValue && sessionValue.length > 0) {
    if (sessionValue === 'true') {
      settingsExtended = true;
      document.getElementById('settings').classList.add('settings-hidden');
    } else {
      settingsExtended = false;
      document.getElementById('settings').classList.remove('settings-hidden');
    }
  }

  sessionValue = sessionStorage.getItem('settingsVertical');
  if (sessionValue && sessionValue.length > 0) {
    if (sessionValue === 'true') {
      settingsVertical = true;
      document.getElementById('graph-area-wrapper').classList.add('graph-area-wrapper-vertical');
    } else {
      settingsVertical = false;
      document.getElementById('graph-area-wrapper').classList.remove('graph-area-wrapper-vertical');
    }
  }

  sessionValue = sessionStorage.getItem('groupByCategory');
  if (sessionValue && sessionValue.length > 0) {
    if (sessionValue === 'true') {
      groupByCategory = true;
      document.getElementById('group-category-input').setAttribute('checked', 'checked');
    } else {
      groupByCategory = false;
      document.getElementById('group-category-input').removeAttribute('checked');
    }
  }

  sessionValue = sessionStorage.getItem('showInvestments');
  if (sessionValue && sessionValue.length > 0) {
    if (sessionValue === 'true') {
      showInvestments = true;
      document.getElementById('show-investments-input').setAttribute('checked', 'checked');
    } else {
      showInvestments = false;
      document.getElementById('show-investments-input').removeAttribute('checked');
    }
  }

  sessionValue = sessionStorage.getItem('spreadMonthlyIncomeTo');
  if (sessionValue && sessionValue.length > 0 && !isNaN(parseInt(sessionValue))) {
    spreadMonthlyIncomeTo = parseInt(sessionValue);
    const inputElement = document.getElementById('spread-income-to');
    inputElement.value = spreadMonthlyIncomeTo;
    if (spreadMonthlyIncomeTo > 0) {
      inputElement.classList.add('active');
    } else {
      inputElement.classList.remove('active');
      inputElement.value = '';
    }
  }
}