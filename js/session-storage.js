function clearSessionStorage() {
  sessionStorage.setItem('pastEvents', '');
  sessionStorage.setItem('pastEventsOffset', '');
  sessionStorage.setItem('backgroundColor', 'rgb(35, 35, 35)');
  sessionStorage.setItem('lineColor', 'rgb(255, 0, 0)');
  sessionStorage.setItem('uiColor', 'rgb(255, 255, 255)');
  sessionStorage.setItem('settingsExtended', '');
  sessionStorage.setItem('settingsVertical', '');
  sessionStorage.setItem('sortType', '');
  sessionStorage.setItem('verticalZoomFactor', '');
  sessionStorage.setItem('legendMultiplyer', '');

  for (let i = 0; i < categories.length; i++) {
    sessionStorage.setItem('toggle-' + categories[i], true);
  }
}

function getFromSessionStorage() {
  let sessionValue = sessionStorage.getItem('pastEvents');
  if (sessionValue && parseInt(sessionValue) >= 0) {
    pastEvents = parseInt(sessionValue);
  }

  sessionValue = sessionStorage.getItem('pastEventsOffset');
  if (sessionValue && parseInt(sessionValue) >= 0) {
    pastEventsOffset = parseInt(sessionValue);
  }

  sessionValue = sessionStorage.getItem('backgroundColor');
  if (sessionValue && sessionValue.length > 0) {
    backgroundColor = sessionValue;
    less.modifyVars({'@custom-background-color': backgroundColor});
    document.getElementById('staticwrapper').style.backgroundColor = sessionValue;
    document.getElementById('color-picker-background').value = rgbToHex(sessionValue);

    document.getElementById('staticwrapper').style.backgroundColor = backgroundColor;
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
  }

  sessionValue = sessionStorage.getItem('verticalZoomFactor');
  if (sessionValue && sessionValue.length > 0) {
    verticalZoomFactor = sessionValue;
  }

  sessionValue = sessionStorage.getItem('legendMultiplyer');
  if (sessionValue && sessionValue.length > 0) {
    legendMultiplier = sessionValue;
  }

  let allValues = [];
  for (let i = 0; i < categories.length; i++) {
    allValues.push(sessionStorage.getItem('toggle-' + categories[i]) === 'true');
    if (allValues[allValues.length - 1]) {
      document.getElementById('toggle-box-' + categories[i]).setAttribute('checked', 'checked');
      document.getElementById('toggle-' + categories[i]).setAttribute('checked', 'checked');
    } else {
      document.getElementById('toggle-box-' + categories[i]).removeAttribute('checked');
      document.getElementById('toggle-' + categories[i]).removeAttribute('checked');
    }
  }

  activeCategories = {
    'monthly':  allValues[0],
    'amazon':   allValues[1],
    'paypal':   allValues[2],
    'food':     allValues[3],
    'ospa':     allValues[4],
    'gas':      allValues[5],
    'others':   allValues[6]
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
}