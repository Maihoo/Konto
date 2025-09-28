$(document).ready(function () {
  // Set the worker source for pdf.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  // Read the first file (umsatz.csv)
  $.ajax({
    type: 'GET',
    url: 'umsatz.csv',
    dataType: 'text',
    error: function (xhr, status, error) {
      console.error('AJAX Error:', error);
    },
    success: function (data) {
      dataset = data;
      getFromSessionStorage();
      handleDateChange();
      initTextLines();
      initControls();
      initDrawing();
    }
  });
});

// Constants
const startbudgetString = "10.384,16";
const STARTBUDGET = parseFloat(startbudgetString.replace('.', '').replace(',', '.'));
const ZOOMFACTOR = 0.8;
const EXTRAAREA = 0.00;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const categories = ['monthly', 'income', 'cash', 'amazon', 'paypal', 'food', 'takeout', 'gas', 'others'];

let activeCategories = {
  'monthly': true,
  'income': true,
  'cash': true,
  'amazon': true,
  'paypal': true,
  'food': true,
  'takeout': true,
  'gas': true,
  'others': true
};

const constantPositions = [
  '"DE45150505001101110771";"";"";"_Schulden";"mir gegenüber";"";"";"";"";"";"";"Name";"";"";"1000";"EUR";""',
  '"DE45150505001101110771";"";"";"Cash";"Bargeld";"";"";"";"";"";"";"Ich";"";"";"0";"EUR";""',
  '"DE45150505001101110771";"01.09.25";"01.09.25";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"1000";"EUR";""',
  '"DE45150505001101110771";"07.07.25";"07.07.25";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"1000";"EUR";""',
  '"DE45150505001101110771";"04.06.25";"04.06.25";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"1000";"EUR";""',
  '"DE45150505001101110771";"04.03.25";"04.03.25";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"1000";"EUR";""',
  '"DE45150505001101110771";"20.11.24";"20.11.24";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"4000";"EUR";""',
  '"DE45150505001101110771";"21.10.24";"21.10.24";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"2000";"EUR";""',
  '"DE45150505001101110771";"09.09.24";"09.09.24";"Cash";"Investments";"";"";"";"";"";"";"Ich";"";"";"1000";"EUR";""'
];

const selectors= {
  'date': 1,
  'content': 3,
  'purpose': 4,
  'beneficiary': 11,
  'amount': 14,
  'category': 17,
  'total': 18
};

const foodSelectors= {
  'date': 0,
  'store': 1,
  'productName': 2,
  'price': 3,
  'quantity': 4,
  'category': 5
};

const replacements = [
  // selectors.purpose + ';Miete + Strom + Internet;' + selectors.amount + ';-1400'
]

const permanentReplacements = [
  // Autokauf Teil 1
  ['"DE45150505001101110771";"13.09.24";"13.09.24";"ONLINE-UEBERWEISUNG";"KFZ-Kauf DATUM 12.09.2024, 22.32 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-1000,00";"EUR";"Umsatz gebucht"'
  ,'"DE45150505001101110771";"13.09.24";"13.09.24";"ONLINE-UEBERWEISUNG";"KFZ-Kauf DATUM 12.09.2024, 22.32 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-6000,00";"EUR";"Umsatz gebucht"'
  ], // ?
  ['"DE45150505001101110771";"23.09.24";"23.09.24";"BARGELDAUSZAHLUNG";"2024-09-23T11:46 Debitk.4 2028-12 ";"";"";"00002008424076230924114638";"";"";"";"OSPA ROST.//OstseeSparkasse Rostock/DE";"DE30130500009000481403";"NOLADE21ROS";"-1000,00";"EUR";"Umsatz gebucht"'
  ], // Leihung an Till #1
  ['"DE45150505001101110771";"25.09.24";"25.09.24";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 1.190,00 EU R vom 24.09 17:07 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000134240924170735000000";"";"";"";"OstseeSparkasse Rostock";"DE08130500009000481411";"NOLADE21ROS";"1190,00";"EUR";"Umsatz gebucht"'
  ,'"DE45150505001101110771";"25.09.24";"25.09.24";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 1.190,00 EU R vom 24.09 17:07 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000134240924170735000000";"";"";"";"OstseeSparkasse Rostock";"DE08130500009000481411";"NOLADE21ROS";"190,00";"EUR";"Umsatz gebucht"'
  ], // Leihung an Till #1 (Fahrrad) Teil 1
  ['"DE45150505001101110771";"27.09.24";"27.09.24";"FOLGELASTSCHRIFT";"P02-4824442-5224501 amzn.com/pmts 1EG1WI6EGXLES6VR ";"DE94ZZZ00000561653";".2(U+XKYH+Kr8:MAIgvW5rDWlF0Z:1";"1EG1WI6EGXLES6VR";"";"";"";"AMAZON PAYMENTS EUROPE S.C.A.";"DE87300308801908262006";"TUBDDEDD";"-1189,98";"EUR";"Umsatz gebucht"'],
  ['"DE45150505001101110771";"27.09.24";"27.09.24";"FOLGELASTSCHRIFT";"P02-4824442-5224501 amzn.com/pmts 1EG1WI6EGXLES6VR ";"DE94ZZZ00000561653";".2(U+XKYH+Kr8:MAIgvW5rDWlF0Z:1";"1EG1WI6EGXLES6VR";"";"";"";"AMAZON PAYMENTS EUROPE S.C.A.";"DE87300308801908262006";"TUBDDEDD";"-289,98";"EUR";"Umsatz gebucht"'
  ], // Autokauf Teil 2
  ['"DE45150505001101110771";"01.10.24";"01.10.24";"ONLINE-UEBERWEISUNG";"Darlehnsrückzahlung DATUM 01.10.2024, 15.31 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-1000,00";"EUR";"Umsatz gebucht"'],
  ['"DE45150505001101110771";"02.10.24";"02.10.24";"ONLINE-UEBERWEISUNG";"Darlehnsrückzahlung (2/5) DATUM 02.10.2024, 11.45 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-1000,00";"EUR";"Umsatz gebucht"'],
  ['"DE45150505001101110771";"04.10.24";"04.10.24";"ONLINE-UEBERWEISUNG";"Darlehnsrückzahlung (3/5) DATUM 04.10.2024, 13.54 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-1000,00";"EUR";"Umsatz gebucht"'],
  ['"DE45150505001101110771";"07.10.24";"07.10.24";"ONLINE-UEBERWEISUNG";"Darlehnsrückzahlung (4/5) DATUM 05.10.2024, 18.48 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-1000,00";"EUR";"Umsatz gebucht"'],
  ['"DE45150505001101110771";"08.10.24";"08.10.24";"ONLINE-UEBERWEISUNG";"Darlehnsrückzahlung (5/5) DATUM 08.10.2024, 08.39 UHR ";"";"";"";"";"";"";"Jens Stadtaus";"DE50200300000096928606";"HYVEDEMM300";"-1000,00";"EUR";"Umsatz gebucht"'
  ], // Leihung an Till #1 (Fahrrad) Teil 2
  ['"DE45150505001101110771";"06.11.24";"06.11.24";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 900,00 EU R vom 05.11 15:48 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000160051124154817000000";"";"";"";"OstseeSparkasse Rostock";"DE08130500009000481411";"NOLADE21ROS";"900,00";"EUR";"Umsatz gebucht"'
  ], // Leihung an Till #2 Teil 1
  ['"DE45150505001101110771";"21.11.24";"21.11.24";"ONLINE-UEBERWEISUNG";"XA5TDUCRU5F8IBBHY3MD2AQSXB, CHOSAY UG haftungsbeschrae nkt, rfptC1iGNDTSJBT2yo6MTd ee8 DATUM 20.11.2024, 23.00 UHR ";"";"";"";"";"";"";"Klarna Bank AB (publ)";"DE61100103009269215519";"KLRNDEBEXXX";"-630,00";"EUR";"Umsatz gebucht"'
  ], // Leihung an Till #2 Teil 2
  ['"DE45150505001101110771";"25.11.24";"25.11.24";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 640,00 EU R vom 22.11 17:27 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000322221124172741000000";"";"";"";"OstseeSparkasse Rostock";"DE30130500009000481403";"NOLADE21ROS";"640,00";"EUR";"Umsatz gebucht"'
  ,'"DE45150505001101110771";"25.11.24";"25.11.24";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 640,00 EU R vom 22.11 17:27 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000322221124172741000000";"";"";"";"OstseeSparkasse Rostock";"DE30130500009000481403";"NOLADE21ROS";"10,00";"EUR";"Umsatz gebucht"'
  ], // Leihung an TIll #3 Teil 1
  ['"DE45150505001101110771";"04.12.24";"04.12.24";"FOLGELASTSCHRIFT";"1038640074592/PP.4616.PP/. QASHCONCEPTS, Ihr Einkauf bei QASHCONCEPTS ";"LU96ZZZ0000000000000000058";"42YJ224RQFXDN";"1038640074592";"";"";"";"PayPal Europe S.a.r.l. et Cie S.C.A                                   22-24 Boulevard Royal, 2449 Luxembourg";"LU89751000135104200E";"PPLXLUL2";"-651,93";"EUR";"Umsatz gebucht"'
  ,'"DE45150505001101110771";"04.12.24";"04.12.24";"FOLGELASTSCHRIFT";"1038640074592/PP.4616.PP/. QASHCONCEPTS, Ihr Einkauf bei QASHCONCEPTS ";"LU96ZZZ0000000000000000058";"42YJ224RQFXDN";"1038640074592";"";"";"";"PayPal Europe S.a.r.l. et Cie S.C.A                                   22-24 Boulevard Royal, 2449 Luxembourg";"LU89751000135104200E";"PPLXLUL2";"-1,93";"EUR";"Umsatz gebucht"'
  ], // Leihung an TIll #3 Teil 2
  ['"DE45150505001101110771";"02.12.24";"02.12.24";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 650,00 EU R vom 01.12 21:41 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000213011224214138000000";"";"";"";"OstseeSparkasse Rostock";"DE30130500009000481403";"NOLADE21ROS";"650,00";"EUR";"Umsatz gebucht"'
  ], // Auto Reparatur Teil 1
  ['"DE45150505001101110771";"20.02.25";"20.02.25";"KARTENZAHLUNG";"2025-02-19T10:43 Debitk.4 2028-12 ";"";"";"60375330001812190225104355";"";"";"";"SHELL-AUTOSERVICE//Rostock/DE";"DE49130500000205030602";"NOLADE21ROS";"-1593,73";"EUR";"Umsatz gebucht"'
  ,'"DE45150505001101110771";"20.02.25";"20.02.25";"KARTENZAHLUNG";"2025-02-19T10:43 Debitk.4 2028-12 ";"";"";"60375330001812190225104355";"";"";"";"SHELL-AUTOSERVICE//Rostock/DE";"DE49130500000205030602";"NOLADE21ROS";"-1004,93";"EUR";"Umsatz gebucht"'
  ], // Auto Reparatur Teil 2
  ['"DE45150505001101110771";"25.02.25";"24.02.25";"ECHTZEIT-GUTSCHRIFT";"INSTANT TRANSFER ";"";"";"25022422504892454";"";"";"";"PAYPAL";"LU947510261215211218";"PPLXLUL2XXX";"588,80";"EUR";"Umsatz gebucht"'
  ], // Leihung Till #4 (Macbook & Synth) Teil 1
  ['"DE45150505001101110771";"03.03.25";"03.03.25";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 2.730,00 EU R vom 28.02 19:10 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000761280225191059000000";"";"";"";"OstseeSparkasse Rostock";"DE30130500009000481403";"NOLADE21ROS";"2730,00";"EUR";"Umsatz gebucht"'
  ,'"DE45150505001101110771";"03.03.25";"03.03.25";"BARGELDEINZAHLUNG SB";"SB-Einzahlung 2.730,00 EU R vom 28.02 19:10 / OSPA RO ST. GA 13050000 2320 Karte 1101110771 / 2812 / 0 / 4 ABWA+ OstseeSparkasse Rostock / /Rostock 180 57 ";"";"";"EIN00002320000761280225191059000000";"";"";"";"OstseeSparkasse Rostock";"DE30130500009000481403";"NOLADE21ROS";"193,51";"EUR";"Umsatz gebucht"'
  ], // Leihung Till #4 (Synth) Teil 2
  ['"DE45150505001101110771";"04.03.25";"04.03.25";"FOLGELASTSCHRIFT";"1040579923866/. Thomann GmbH, Ihr Einkauf bei Thomann GmbH ";"LU96ZZZ0000000000000000058";"42YJ224RQFXDN";"1040579923866";"";"";"";"PayPal Europe S.a.r.l. et Cie S.C.A                                   22-24 Boulevard Royal, 2449 Luxembourg";"LU89751000135104200E";"PPLXLUL2";"-399,00";"EUR";"Umsatz gebucht"'
  ], // Leihung Till #4 (Macbook) Teil 3
  ['"DE45150505001101110771";"04.03.25";"04.03.25";"FOLGELASTSCHRIFT";"1040579707249 . Jung SAS, Ihr Einkauf bei Jung SAS ";"LU96ZZZ0000000000000000058";"42YJ224RQFXDN";"1040579707249  PAYPAL";"";"";"";"PayPal (Europe) S.a r.l. et Cie, S.C.A.";"DE88500700100175526303";"DEUTDEFFXXX";"-2137,49";"EUR";"Umsatz gebucht"'
  ]
]

// path drawing
const pathThickness = 2;
const shadowLength = 100; // how large the shadow should be
const shadowDistance = 4; // spacing between each blurred line

// Variables
let totalBudget = STARTBUDGET;
let globallyLastDay = 0;

let zoomInPressed = false;
let zoomOutPressed = false;
let squaresVisible = false;
let pathVisible = false;
let gridMode = false;
let showShadow = true;
let settingsExtended = false;
let settingsVertical = false;
let groupByCategory = false;
let showInvestments = true;
let showFoodExpenses = false;
let oneRadioUnchecked = false;

let dataset;
let foodDataset;

let verticalScaleFactor = 1.0;
let zoomLevel = 1.0;

let spreadMonthlyIncomeTo = 0;
let legendMultiplier = 100;
let maxHeight = 500;
let startHeight = 0.0;
let endbudget = 0.0;
let budget = 0.0;
let lowest = 0.0;
let highest = 0.0;
let moveOffsetX = 0.0;
let moveOffsetY = 0.0;
let dragstartX = 0.0;
let dragstartXstorage = 0.0;
let dragstartY = 0.0;
let dragstartYstorage = 0.0;
let ts1 = 0;
let ts2 = 0;

let startDate = '01.03.25';
let endDate = '';
let sortType = 'date';
let firstLine = '';

let backgroundColor = '25, 25, 25';
let lineColor = '255, 0, 0';
let uiColor = '255, 255, 255';

let pdfImportedLines = [];
let allTextLines = [];
let foodTextLines = [];
let dateLines = [];
let path = [];
let linepoints = [];

let monthlyEntries = [];
let incomeEntries = [];
let cashEntries = [];
let amazonEntries = [];
let paypalEntries = [];
let foodEntries = [];
let takeoutEntries = [];
let gasEntries = [];
let debtEntries = [];
let restEntries = [];

let groceriesEntries = [];

// zooming
let originalWidth;
let originalHeight;
let originalMarginTop;
let originalMarginLeft;
let originalTop;
let originalLeft;

let canvas = document.getElementById('canvas');
let pathCanvas = document.getElementById('pathCanvas');
let pathBlurCanvas = document.getElementById('pathBlurCanvas');
let uiLine = document.getElementById('uiLine');
let uiCanvas = document.getElementById('uiCanvas');
let uiCanvasHorizontal = document.getElementById('uiCanvasHorizontal');
let uiCanvasVertical = document.getElementById('uiCanvasVertical');
let overflowWrapper = document.getElementById('overflowWrapper');
let zoomingWrapper = document.getElementById('zoomingWrapper');
let movingWrapper = document.getElementById('movingWrapper');
let settingsElement = document.getElementById('settings');
let circleCanvas = document.getElementById('circleCanvas');
let foodCanvas = document.getElementById('foodCanvas');

function resetSettings() {
  zoomInPressed = false;
  zoomOutPressed = false;
  squaresVisible = false;
  pathVisible = false;
  gridMode = false;
  showShadow = true;
  settingsExtended = false;
  settingsVertical = false;
  groupByCategory = false;
  showInvestments = true;
  showFoodExpenses = true;
  oneRadioUnchecked = false;

  totalBudget = STARTBUDGET;
  spreadMonthlyIncomeTo = 0;
  globallyLastDay = 0;
  verticalScaleFactor = 1.0;
  zoomLevel = 1.0;
  legendMultiplier = 100;
  maxHeight = 500;
  startHeight = 0.0;
  endbudget = 0.0;
  budget = 0.0;
  lowest = 0.0;
  highest = 0.0;
  moveOffsetX = 0.0;
  moveOffsetY = 0.0;
  dragstartX = 0.0;
  dragstartXstorage = 0.0;
  dragstartY = 0.0;
  dragstartYstorage = 0.0;
  ts1 = 0;
  ts2 = 0;

  startDate = '01.03.25';
  endDate = '';
  backgroundColor = '25, 25, 25';
  lineColor = '255, 0, 0';
  uiColor = '255, 255, 255';

  zoomingWrapper.style.backgroundColor = backgroundColor;
  settingsElement.style.backgroundColor = backgroundColor;
  document.body.style.backgroundColor = backgroundColor;

  clearSessionStorage();
  clearLines();
  location.reload(true);
  initTextLines();
  setColorDefault();
  initControls();
  initDrawing();
}

function resetHTML() {
  dateLines = [];
  path = [];
  linepoints = [];
  monthlyEntries = [];
  incomeEntries = [];
  cashEntries = [];
  amazonEntries = [];
  paypalEntries = [];
  foodEntries = [];
  takeoutEntries = [];
  gasEntries = [];
  debtEntries = [];
  restEntries = [];
  zoomLevel = 1.0;

  canvas = document.getElementById('canvas');
  pathCanvas = document.getElementById('pathCanvas');
  pathBlurCanvas = document.getElementById('pathBlurCanvas');
  uiLine = document.getElementById('uiLine');
  uiCanvas = document.getElementById('uiCanvas');
  uiCanvasHorizontal = document.getElementById('uiCanvasHorizontal');
  uiCanvasVertical = document.getElementById('uiCanvasVertical');
  overflowWrapper = document.getElementById('overflowWrapper');
  zoomingWrapper = document.getElementById('zoomingWrapper');
  movingWrapper = document.getElementById('movingWrapper');
  settingsElement = document.getElementById('settings');
  circleCanvas = document.getElementById('circleCanvas');
  foodCanvas = document.getElementById('foodCanvas');

  overflowWrapper.style.width = CANVAS_WIDTH + 'px';
  overflowWrapper.style.height = CANVAS_HEIGHT + 'px';
  zoomingWrapper.style.width = CANVAS_WIDTH + 'px';
  zoomingWrapper.style.height = CANVAS_HEIGHT + 'px';
  movingWrapper.style.width = CANVAS_WIDTH + 'px';
  movingWrapper.style.height = CANVAS_HEIGHT + 'px';

  canvas.style.opacity = '100%';
  pathCanvas.style.opacity = '0%';
  pathBlurCanvas.style.opacity = '0%';

  canvas.innerHTML = '';
  uiLine.innerHTML = '';
  uiCanvas.innerHTML = '';
  pathCanvas.innerHTML = '';
  pathBlurCanvas.innerHTML = '';
  uiCanvasVertical.innerHTML = '';
  uiCanvasHorizontal.innerHTML = '';

  canvas.style.marginTop = '';
  canvas.style.marginLeft = '';
  uiCanvas.style.marginTop = '';
  uiCanvas.style.marginLeft = '';
  pathCanvas.style.marginTop = '';
  pathCanvas.style.marginLeft = '';
  pathBlurCanvas.style.marginTop = '';
  pathBlurCanvas.style.marginLeft = '';
  uiCanvasVertical.style.marginLeft = '';
  uiCanvasHorizontal.style.marginTop = '';
  uiCanvasHorizontal.style.marginLeft = '';

  uiCanvasVertical.style.marginTop = CANVAS_WIDTH + 'px';
  pathCanvas.setAttribute('height', (CANVAS_HEIGHT) + 'px');
  pathCanvas.setAttribute('width', (CANVAS_WIDTH - 100) + 'px');
  pathBlurCanvas.setAttribute('height', (CANVAS_HEIGHT) + 'px');
  pathBlurCanvas.setAttribute('width', (CANVAS_WIDTH - 100) + 'px');
  uiLine.style.marginLeft = '';
  uiLine.style.width = (2 * CANVAS_WIDTH) + 'px';
  uiLine.style.height = (2 * CANVAS_HEIGHT) + 'px';
  uiLine.style.marginTop = - CANVAS_HEIGHT + 'px';
  uiLine.setAttribute('width', (2 * CANVAS_WIDTH) + 'px');
  uiLine.setAttribute('height', (2 * CANVAS_HEIGHT) + 'px');
  uiLineTemp.style.marginLeft = '';
  uiLineTemp.style.marginTop = '-700px';
  uiLineTemp.style.width = (2 * CANVAS_WIDTH) + 'px';
  uiLineTemp.style.height = (2 * CANVAS_HEIGHT) + 'px';
  uiLineTemp.style.marginTop = - CANVAS_HEIGHT + 'px';
  uiLineTemp.setAttribute('width', (2 * CANVAS_WIDTH) + 'px');
  uiLineTemp.setAttribute('height', (2 * CANVAS_HEIGHT) + 'px');

  for (let i = 0; i < categories.length; i++) {
    document.getElementById('legend-' + categories[i] + '-negative').innerHTML = '';
    document.getElementById('legend-' + categories[i] + '-positive').innerHTML = '';
  }
}

function initDrawing() {
  document.getElementById('spinner-element').style.display = 'block';

  setTimeout(() => {
    resetHTML();

    originalWidth = zoomingWrapper.offsetWidth;
    originalHeight = zoomingWrapper.offsetHeight;
    originalMarginTop = parseInt(zoomingWrapper.style.marginTop.slice('0, -2'));
    originalMarginLeft = parseInt(zoomingWrapper.style.marginLeft.slice('0, -2'));
    originalTop = zoomingWrapper.offsetTop;
    originalLeft = zoomingWrapper.offsetLeft;

    maxHeight = getMaxPriceDiff();
    updateMaxHeightAround();

    clearCanvases();

    drawCanvas();

    requestIdleCallback(() => {
      drawPath();         // draws 2px solid line
      drawBlurPath();     // draws opaque background below path
      hidePathBlurTop();  // caps blurred paths above path

      setAmounts();
      setDates();
    });

    requestIdleCallback(() => {
      drawLegends();
    });

    requestIdleCallback(() => {
      drawTable();
    });

    document.getElementById('spinner-element').style.display = 'none';
  }, 2);
}

function clearCanvases() {

}

function drawPath() {
  ctx = pathCanvas.getContext('2d');
  ctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);

  const lineColorParts = lineColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  for (let i = 0; i < path.length - 1; i++) {
    drawLine(ctx,
      parseInt(path[i][1]),
      parseInt(path[i][0]),
      parseInt(path[i+1][1]),
      parseInt(path[i+1][0]),
      `rgb(${lineColorParts[0]}, ${lineColorParts[1]}, ${lineColorParts[2]})`,
      2);
  }
}

function drawBlurPath() {
  ctx = pathBlurCanvas.getContext('2d');
  ctx.clearRect(0, 0, pathBlurCanvas.width, pathBlurCanvas.height);
  const lineColorParts = lineColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  for (let i = shadowLength/shadowDistance; i >= 0; i--) {
    for (let j = 0; j < path.length - 1; j++) {
      const heightFactor = 1000 / path[j][0];
      drawLine(ctx,
        parseInt(path[j][1]),
        parseInt(path[j][0] - 20 + i * shadowDistance * verticalScaleFactor),
        parseInt(path[j+1][1]),
        parseInt(path[j+1][0] - 20 + i * shadowDistance * verticalScaleFactor),
        `rgba(${lineColorParts[0]}, ${lineColorParts[1]}, ${lineColorParts[2]}, ${(shadowLength/shadowDistance - i) / 200 * heightFactor})`,
        1);
    }
  }

  pathBlurCanvas.style.filter = 'blur(5px)';
}

function hidePathBlurTop() {
  const backgroundColorParts = backgroundColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  ctx = pathBlurCanvas.getContext('2d');

  // Fill the area below the graph with a fade effect
  ctx.beginPath();
  if (path[0] && path[0][0] && path[0][1]) {
    ctx.moveTo(parseInt(path[0][1]), parseInt(path[0][0]));
  }

  ctx.fillStyle = `rgb(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]})`;

  // Draw the shape
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(parseInt(path[i][1]), parseInt(path[i][0]));
  }

  ctx.lineTo(1200, -100);
  ctx.lineTo(-500, -100);
  ctx.closePath();
  ctx.fill();
}

function setAmounts() {
  const backgroundColorParts = backgroundColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
  uiCanvasVertical.style.marginTop = -(EXTRAAREA + CANVAS_HEIGHT) + 'px';
  let valueTop = document.createElement('p');
  valueTop.id = 'ui-element-value-top';
  valueTop.innerHTML = '<p class="uiElementTop">max:</p> <p class="uiElementBot">' + formatNumber(highest) + '€</p>';
  valueTop.className = 'uiElement';
  valueTop.classList.add('amount-text-max');
  valueTop.style.backgroundColor = `rgba(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]}, 0.75)`;
  valueTop.style.marginTop = '' + parseInt(530 - valueToPx(highest) + valueToPx(lowest) + EXTRAAREA) + 'px';
  valueTop.style.marginLeft = '' + (5 + EXTRAAREA) + 'px';
  uiCanvasVertical.appendChild(valueTop);

  let valueBottom = document.createElement('p');
  valueBottom.innerHTML = '<p class="uiElementTop">min:</p> <p class="uiElementBot">' + formatNumber(lowest) + '€</p>';
  valueBottom.className = 'uiElement';
  valueBottom.classList.add('amount-text-min');
  valueBottom.style.backgroundColor = `rgba(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]}, 0.75)`;
  valueBottom.style.marginTop = '' + (525 + EXTRAAREA) + 'px'
  valueBottom.style.marginLeft = '' + (5 + EXTRAAREA) + 'px';
  uiCanvasVertical.appendChild(valueBottom);

  // draw Lines
  for (let i = 0; i <= 200; i++) {
    let valueLine = document.createElement('div');
    valueLine.classList.add('value-line');
    const uiColorParts = uiColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
    const uiColorClear = `${uiColorParts[0]}, ${uiColorParts[1]}, ${uiColorParts[0]}`;

    valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.02)';
    if (i % 2 === 0)  { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.1)'; }
    if (i % 10 === 0) { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.4)'; }
    if (i % 20 === 0) { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.7)'; }
    if (i === 0)      { valueLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 1.0)'; valueLine.style.height = '3px'; }

    valueLine.style.opacity = '100%';
    valueLine.style.marginTop = '' + parseInt(550 - valueToPx(i * 500) + valueToPx(lowest) + EXTRAAREA) + 'px';
    uiCanvasVertical.appendChild(valueLine);
  }

  // draw Amounts
  let amountHolder = document.createElement('div');
  amountHolder.classList.add('amount-holder');
  amountHolder.style.backgroundColor = `rgb(${backgroundColorParts[0]}, ${backgroundColorParts[1]}, ${backgroundColorParts[2]})`;
  for (let i = 100; i >= -10; i--) {
    if (pxToValue('0px') < 30000 || (pxToValue('0px') < 150000 && i % 5 === 0) || i % 10 === 0) {
      let valueText = document.createElement('div');
      valueText.classList.add('value-text');
      valueText.innerHTML = i + 'k';

      const uiColorParts = uiColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
      const uiColorClear = `${uiColorParts[0]}, ${uiColorParts[1]}, ${uiColorParts[0]}`;
      valueText.style.color = 'rgba(' + uiColorClear + ', 0.4)';
      if (i % 5 === 0)  { valueText.style.color = 'rgba(' + uiColorClear + ', 0.7)'; }
      if (i % 10 === 0) { valueText.style.color = 'rgba(' + uiColorClear + ', 1.0)'; }
      if (i === 0)      { valueText.style.color = 'rgba(' + uiColorClear + ', 1.0)'; }

      valueText.style.opacity = '100%';
      valueText.style.marginTop = '' + parseInt(550 - valueToPx(i * 1000) + valueToPx(lowest) + EXTRAAREA) + 'px';
      amountHolder.appendChild(valueText);
    }
  }

  uiCanvasVertical.appendChild(amountHolder);
}

function setDates() {
  uiCanvasHorizontal.style.marginLeft = -EXTRAAREA + 'px';

  let dateLeft = document.createElement('p');
  let tempLeft1 = allTextLines[allTextLines.length - 1].split(';');
  let tempLeft2 = tempLeft1[1].slice(1, -1).split('.');
  dateLeft.innerHTML = tempLeft2[0] + '.' + tempLeft2[1] + '.' + '20' + tempLeft2[2];
  dateLeft.className = 'uiElement';
  dateLeft.style.position = 'absolute';
  dateLeft.style.marginTop = '' + (570 + EXTRAAREA) + 'px';
  dateLeft.style.marginLeft = '' + (70 + EXTRAAREA) + 'px';
  dateLeft.style.visibility = 'visible';
  uiCanvas.appendChild(dateLeft);

  let dateRight = document.createElement('p');
  let tempRight1 = allTextLines[1].split(';');
  let tempRight2 = tempRight1[1].slice(1, -1).split('.');
  dateRight.innerHTML = tempRight2[0] + '.' + tempRight2[1] + '.' + '20' + tempRight2[2];
  dateRight.className = 'uiElement';
  dateRight.style.position = 'absolute';
  dateRight.style.marginTop =  '' + (570 + EXTRAAREA) + 'px';
  dateRight.style.marginLeft = '' + (960 + EXTRAAREA) + 'px';
  uiCanvas.appendChild(dateRight);

  for (let i = 0; i < dateLines.length; i++) {
    let dateLine = document.createElement('div');
    dateLine.style.position = 'absolute';
    dateLine.style.zIndex = '80';
    dateLine.style.height = 2000 + parseInt(550 + valueToPx(lowest) + EXTRAAREA) + 'px';
    dateLine.style.width = '1px';
    dateLine.style.opacity = '100%';
    dateLine.style.marginTop = '-2000px';
    dateLine.style.marginLeft = (parseInt(dateLines[i].slice(0, -2)) + EXTRAAREA) + 'px';

    const uiColorParts = uiColor.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
    const uiColorClear = `${uiColorParts[0]}, ${uiColorParts[1]}, ${uiColorParts[0]}`;

    dateLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.2)';;
    if (dateLines[i].charAt(0) === 'y') {
      dateLine.style.marginLeft = (parseInt(dateLines[i].slice(1, -2)) + EXTRAAREA) + 'px';
      dateLine.style.backgroundColor = 'rgb(' + uiColorClear + ')';
    }

    if (dateLines[i].charAt(0) === 'w') {
      dateLine.style.marginLeft = (parseInt(dateLines[i].slice(1, -2)) + EXTRAAREA) + 'px';
      dateLine.style.backgroundColor = 'rgba(' + uiColorClear + ', 0.05)';;
    }

    uiCanvas.appendChild(dateLine);
  }
}

function drawCanvas() {
  path = [];
  dateLines = [];
  const paddingLeft = 980 + moveOffsetX;
  let lastDayDiff = 0;
  let fgOffset = 0;

  monthlyEntries = [];
  incomeEntries = [];
  cashEntries = [];
  amazonEntries = [];
  paypalEntries = [];
  foodEntries = [];
  takeoutEntries = [];
  gasEntries = [];
  debtEntries = [];
  restEntries = [];

  // Remove last line if total is invalid
  if (!parseInt(allTextLines[allTextLines.length - 1][selectors.total].slice(1, -1))) {
    allTextLines.shift();
  }

  // Pre-compute date values
  const dates = allTextLines.map(line => {
    const entry = line.split(';');
    return {
      date: entry[selectors.date].slice(1, -1),
      total: entry[selectors.total].slice(1, -1),
      amount: entry[selectors.amount].slice(1, -1)
    };
  });

  const lastDay = dates[0].date;
  const firstDay = dates[dates.length - 1].date;
  const totalDays = (sortType === 'amount') ? dates.length : Math.abs(differenceInDays(firstDay, lastDay) + 2);
  const dayWidth = 875 / totalDays;
  const foregroundOffset = dayWidth / 4;

  // Precompute shared dates using a hashmap
  const sharedDateCount = {};
  for (const entry of dates) {
    sharedDateCount[entry.date] = (sharedDateCount[entry.date] || 0) + 1;
  }

  // Pushing date lines
  for (let year = 0; year < 30; year++) {
    for (let month = 1; month <= 12; month++) {
      dateLines.push('' + parseInt(paddingLeft + (differenceInDays(lastDay, '1.' + month + '.' + (19 + year)) * dayWidth)) + 'px');
      if (month === 1) {
        dateLines[dateLines.length - 1] = 'y' + dateLines[dateLines.length - 1];
      }

      for (let day = 1; day <= 31; day++) {
        if (getDayOfWeek(day, month, year) === 'Wednesday') {
          dateLines.push('' + parseInt(paddingLeft + (differenceInDays(lastDay, day + '.' + month + '.' + (19 + year)) * dayWidth)) + 'px');
          dateLines[dateLines.length - 1] = 'w' + dateLines[dateLines.length - 1];
        }
      }
    }
  }

  const fragment = document.createDocumentFragment();

  const performanceMode = dates.length > 1000;
  for (let i = dates.length - 1; i >= 0; i--) {
    let entries = allTextLines[i].split(';');
    const entry = dates[i];
    const lastTotalValue = valueToMarginTop(dates[(i === 0 ? 0 : i - 1)].total);
    const totalValue = valueToMarginTop(entry.total);
    let nextTotalValue = valueToMarginTop(dates[i + 1]?.total);
    if (!nextTotalValue || isNaN(nextTotalValue)) {
      nextTotalValue = totalValue;
    }

    const value = entries[selectors.amount].slice(1, -1);
    let height = valueToPx(value);
    let diffDays = lastDayDiff - differenceInDays(entries[selectors.date].slice(1, -1), lastDay);
    if (diffDays < 0) {
      diffDays = 2;
    }

    const square = document.createElement('div');
    square.className = 'square';
    const category = getEntrieCategorie(entries);
    if (diffDays > 0) {
      square.id = `linePoint${i * 2}`;
    }

    if (performanceMode) {
      square.classList.add('square-relative')
      const amountSign = value.charAt(0) === '-' ? -1 : 1;
      const xPosition = paddingLeft - (lastDayDiff * dayWidth) + fgOffset;
      Object.assign(square.style, {
        height: `${Math.abs(height).toFixed(2)}px`,
        width: `${(dayWidth - fgOffset).toFixed(2)}px`,
        marginLeft: `${(xPosition - dayWidth).toFixed(2)}px`,
        marginTop: `${parseFloat((-height * (amountSign + 1)).toFixed(2)) + 0.02}px`,
        transform: `translateY(${(amountSign > 0 ? Math.abs(height) : 0).toFixed(2)}px)`
      });
      // set correct height to the "first" square
      if (i === dates.length - 1) {
        square.style.marginTop = `${valueToMarginTop(dates[dates.length - 1].total)}px`;
      }
    } else {
      Object.assign(square.style, {
        height: `${Math.abs(height)}px`,
        marginTop: `${(value.charAt(0) !== '-') ? totalValue : nextTotalValue}px`
      });
    }
    // Fill empty days
    if (diffDays > 1 && sortType !== 'amount' && i < dates.length - 1) {
      const placeholder = document.createElement('div');
      placeholder.className = 'square placeholder';
      placeholder.classList.add(`${category}-background`);
      Object.assign(placeholder.style, {
        height: '1px',
        width: `${(diffDays - 1) * dayWidth}px`,
        marginTop: `${performanceMode ? 0 : nextTotalValue}px`,
        marginLeft: `${paddingLeft - ((lastDayDiff - 1) * dayWidth)}px`
      });
      fragment.appendChild(placeholder);
    }

    lastDayDiff = differenceInDays(entry.date, lastDay);
    if (sortType === 'amount') {
      lastDayDiff = i;
    }

    // Differentiate negative Events
    if (value.charAt(1) === '-') {
      square.classList.add('negative-background');
      square.category = 'Sonstige Abbuchung';
    }

    // Make foreground squares smaller
    if (diffDays > 0) {
      fgOffset = 0;
    }

    const lastWasNegative = allTextLines[i + 1]?.split(';')[selectors.amount]?.charAt(1) === '-';
    if (diffDays === 0 && ((value.charAt(0) === '-' && !lastWasNegative) || (value.charAt(0) !== '-' && lastWasNegative))) {
      fgOffset += foregroundOffset;
    }

    // Adjust width and marginLeft after fgOffset
    square.style.width = `${dayWidth - 2 - fgOffset}px`;
    square.style.marginLeft = `${paddingLeft - (lastDayDiff * dayWidth) + fgOffset}px`;

    if (entries[selectors.content] && entries[selectors.content].charAt('1') === '_') {
      square.style.opacity = '50%';
    }

    // Push Path Points
    if (i < dates.length - 5) {
      path.push([lastTotalValue, paddingLeft - (lastDayDiff * dayWidth)]);
    }

    // Legend filling - Kategorien
    square.classList.add(`${category}-background`);
    square.category = category;
    categorizeEntries(entries, category !== 'others', i); // Pass index 'i' as argument

    // Adding Popups
    square.index = i;
    setupHover(square, value, entry.date, entries[selectors.purpose].slice(1, -1).replace(/[0-9]/g, '').replace(/-/g, ''));
    fragment.appendChild(square);
  }

  canvas.appendChild(fragment);
}

function categorizeEntries(entries, decided, index) {
  if (getEntrieCategorie(entries) === 'monthly') { monthlyEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'income') { incomeEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'cash') { cashEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'amazon') { amazonEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'paypal') { paypalEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'food') { foodEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'takeout') { takeoutEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'gas') { gasEntries.push(allTextLines[index]); }
  if (getEntrieCategorie(entries) === 'debt') { debtEntries.push(allTextLines[index]); }

  if (!decided) {
    restEntries.push(allTextLines[index]);
  }
}

function setupHover(square, value, date, content) {
  square.onmouseover = function(event) {
    const popup = document.getElementById('singlePopup'); // Get the single popup element
    popup.classList.add('fade');
    popup.style.top = `${cursorPosToMargin(event.clientY, 'top', '#movingWrapper')}px`;
    popup.style.left = `${cursorPosToMargin(event.clientX, 'left', '#movingWrapper') + 50}px`;
    popup.style.marginTop = `${window.scrollY}px`;
    const marginLeft = square.style.marginLeft ? square.style.marginLeft : window.getComputedStyle(square).marginLeft;
    // Update popup content
    const dateParts = allTextLines[square.index].split(';')[selectors.date].slice(1, -1).split('.');
    popup.innerHTML = `
      <div class="grid-wrapper">
        <span class="popup-text">Index                  </span><span class="popup-text">${square.index + 1}</span>
        <span class="popup-text-small">Content          </span><span class="popup-text-small marquee"><span>${content}</span></span>
        <hr></hr><hr></hr>
        <span class="popup-text">Date                   </span><span class="popup-text">${date}</span>
        <span class="popup-text">Value                  </span><span class="popup-text">${numberToCurrency(value)}</span>
        <hr></hr><hr></hr>
        <span class="popup-text">Total                  </span><span class="popup-text">${numberToCurrency(parseFloat(allTextLines[square.index].split(';')[selectors.total].slice(1, -1)))}</span>
        <span class="popup-text">Category               </span><span class="popup-text">${square.category}</span>
        <hr></hr><hr></hr>
        <span class="popup-text-small">Margin-Top       </span><span class="popup-text-small">${square.style.marginTop}</span>
        <span class="popup-text-small">Margin-Left      </span><span class="popup-text-small">${marginLeft}</span>
        <span class="popup-text-small">Calculated Total </span><span class="popup-text-small">${numberToCurrency(parseFloat(pxToValue(square.offsetTop + 'px')) + (parseFloat(value) < 0 ? parseFloat(value) : 0))}</span>
        <span class="popup-text-small">Calculated Date  </span><span class="popup-text-small">${pxToDate(marginLeft)}</span>
        <span class="popup-text-small">Day of Week      </span><span class="popup-text-small">${getDayOfWeek(dateParts[0], dateParts[1], dateParts[2])}</span>
      </div>
    `;
  };

  square.onmousemove = function(event) {
    let popup = document.getElementById('singlePopup');
    popup.style.top = `${cursorPosToMargin(event.clientY, 'top', '#movingWrapper')}px`;
    popup.style.left = `${cursorPosToMargin(event.clientX, 'left', '#movingWrapper') + 50}px`;
  };

  square.onmouseout = function() {
    document.getElementById('singlePopup').classList.remove('fade');
  };
}

function drawLegends() {
  const legendSquareHolders = document.getElementsByClassName('legend-square-holder');
  Array.from(legendSquareHolders).forEach(holder => {
    holder.innerHTML = '';
  });

  let positiveTotal = 0;
  positiveTotal += getTotal(monthlyEntries, true);
  positiveTotal += getTotal(incomeEntries, true);
  positiveTotal += getTotal(cashEntries, true);
  positiveTotal += getTotal(amazonEntries, true);
  positiveTotal += getTotal(paypalEntries, true);
  positiveTotal += getTotal(foodEntries, true);
  positiveTotal += getTotal(takeoutEntries, true);
  positiveTotal += getTotal(gasEntries, true);
  positiveTotal += getTotal(restEntries, true);

  let negativeTotal = 0;
  negativeTotal += getTotal(monthlyEntries, false);
  negativeTotal += getTotal(incomeEntries, false);
  negativeTotal += getTotal(cashEntries, false);
  negativeTotal += getTotal(amazonEntries, false);
  negativeTotal += getTotal(paypalEntries, false);
  negativeTotal += getTotal(foodEntries, false);
  negativeTotal += getTotal(takeoutEntries, false);
  negativeTotal += getTotal(gasEntries, false);
  negativeTotal += getTotal(restEntries, false);

  let maxTotal = positiveTotal;
  if (negativeTotal > positiveTotal) {
    maxTotal = negativeTotal;
  }

  drawPositiveLegend(maxTotal, monthlyEntries, 'monthly');
  drawPositiveLegend(maxTotal, incomeEntries, 'income');
  drawPositiveLegend(maxTotal, cashEntries, 'cash');
  drawPositiveLegend(maxTotal, amazonEntries, 'amazon');
  drawPositiveLegend(maxTotal, paypalEntries, 'paypal');
  drawPositiveLegend(maxTotal, takeoutEntries, 'takeout');
  drawPositiveLegend(maxTotal, foodEntries, 'food');
  drawPositiveLegend(maxTotal, gasEntries, 'gas');
  drawPositiveLegend(maxTotal, restEntries, 'others');

  drawNegativeLegend(maxTotal, monthlyEntries, 'monthly');
  drawNegativeLegend(maxTotal, incomeEntries, 'income');
  drawNegativeLegend(maxTotal, cashEntries, 'cash');
  drawNegativeLegend(maxTotal, amazonEntries, 'amazon');
  drawNegativeLegend(maxTotal, paypalEntries, 'paypal');
  drawNegativeLegend(maxTotal, foodEntries, 'food');
  drawNegativeLegend(maxTotal, takeoutEntries, 'takeout');
  drawNegativeLegend(maxTotal, gasEntries, 'gas');
  drawNegativeLegend(maxTotal, restEntries, 'others');

  drawTotalLegend(maxTotal, monthlyEntries, 'monthly');
  drawTotalLegend(maxTotal, incomeEntries, 'income');
  drawTotalLegend(maxTotal, cashEntries, 'cash');
  drawTotalLegend(maxTotal, amazonEntries, 'amazon');
  drawTotalLegend(maxTotal, paypalEntries, 'paypal');
  drawTotalLegend(maxTotal, foodEntries, 'food');
  drawTotalLegend(maxTotal, takeoutEntries, 'takeout');
  drawTotalLegend(maxTotal, gasEntries, 'gas');
  drawTotalLegend(maxTotal, restEntries, 'others');
}

function drawTotalLegend(total, input, groupname) {
  const totalAmount = Math.abs(getTotal(input, false) - getTotal(input, true));
  const legendId = totalAmount > 0 ? 'legend-total-positive' : 'legend-total-negative';
  const legend = document.getElementById(legendId);

  const legendSquare = document.createElement('div');
  legendSquare.className = `legendsquare ${groupname}-background`;
  legendSquare.style.height = `${legendMultiplier * totalAmount / total}px`;
  if (groupname === 'negative') {
    legendSquare.classList.replace(`${groupname}-background`, 'positive-background');
  }

  legend.appendChild(legendSquare);
}

function drawLegend(total, input, groupname, isPositive) {
  const legend = document.getElementById(`legend-${groupname}-${isPositive ? 'positive' : 'negative'}`);
  input.forEach(entry => {
    const entries = entry.split(';');
    const amount = parseFloat(entries[selectors.amount].slice(1, -1));
    if ((isPositive && entries[selectors.amount].charAt(1) !== '-') || 
        (!isPositive && entries[selectors.amount].charAt(1) === '-')) {
      const legendSquare = document.createElement('div');
      legendSquare.className = 'legendsquare ' + groupname + '-background';
      legendSquare.style.height = `${legendMultiplier * Math.abs(amount) / total}px`;
      legend.appendChild(legendSquare);
    }
  });
}

function drawNegativeLegend(total, input, groupname) {
  drawLegend(total, input, groupname, false);
}

function drawPositiveLegend(total, input, groupname) {
  drawLegend(total, input, groupname, true);
}

function drawTable() {
  const table = document.getElementById('table');
  table.innerHTML = '';

  const fragment = document.createDocumentFragment();
  const lines = [firstLine, ...allTextLines];

  // Cache CSS classes and properties
  const rowHolder = document.createElement('div');
  rowHolder.className = 'row-holder';

    // Create and append cells in the specified order
  const cellConfigs = [
    { index: 0, width: '2.5vw', align: 'end', isIndex: true },
    { index: selectors.date, width: '7vw', align: 'end' },
    { index: selectors.content, width: '10vw' },
    { index: selectors.purpose, width: '30vw' },
    { index: selectors.beneficiary, width: '24vw' },
    { index: selectors.category, width: '4vw' },
    { index: selectors.amount, width: 'auto', align: 'end' },
    { index: selectors.total, width: '4vw', align: 'end' }
  ];

  // Main table construction
  for (let i = 0; i < lines.length; i++) {
    const entries = lines[i].split(';');
    const row = document.createElement('div');
    const isHeader = i === 0;
    // Row setup
    row.id = `row${i}`;
    row.className = `row${isHeader ? ' header-row' : ''}`;
    // Create cells
    for (const config of cellConfigs) {
      const cell = document.createElement('p');
      cell.className = 'cell';
      // Cell content
      cell.textContent = config.isIndex ? (isHeader ? 'Index' : `${i}`) : (entries[config.index]?.slice(1, -1) || '');
      // Cell styling
      let style = '';
      if (config.width) style += `width:${config.width};`;
      if (config.align) style += `text-align:${config.align};`;
      cell.style.cssText = style;
      // Special amount handling
      if (config.index === selectors.amount && !isHeader) {
        cell.style.flexGrow = '1';
        const amount = entries[config.index] || '';
        cell.classList.add(amount.charAt(1) !== '-' ? 'positive-background' : 'negative-background');
      }

      row.appendChild(cell);
    }
    // Category styling
    const category = entries[selectors.category]?.slice(1, -1);
    if (category) row.classList.add(`${category}-background-transparent`);

    // Add to fragment
    const clone = rowHolder.cloneNode();
    clone.appendChild(row);
    fragment.appendChild(clone);
  }

  table.appendChild(fragment);
}
