function processAllPDFs() {
  document.getElementById('spinner-element').style.display = 'block';
  // dataset = '';

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

  // Start the processing chain
  processSinglePDF(pdfNames.length - 1)
    .catch(error => {
      console.error('Error processing PDFs:', error);
    }
  );
}

function processSinglePDF(index) {
  if (index >= 0) {
    return processPDFContent(pdfNames[index])
      .then(() => processSinglePDF(index - 1)); // Process the next PDF in the chain
  } else {
    // All PDFs processed, perform any final actions
    initTextLines();
    initTextLines();
    initControls();
    initDrawing();
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
                totalAmount += processPage(content);
              })
              .then(() => processSinglePage(pageIndex - 1)); // Process the next page in the chain
          } else {
            resolve(); // All pages processed for this PDF
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

function isValidDate(date) {
  if (date.length === 10 && date.charAt(2) === '.' && date.charAt(5) === '.') {
    return true;
  }

  return false;
}

function isValidValue(value) {
  if (!value) {
    return false;
  }

  value = value.replace(/"/g, '').replace(',', '.');
  if (['+', '-'].includes(value.charAt(value.length - 1)) && !isNaN(parseFloat(value.slice(0, -1)))) {
    return true;
  }

  return false;
}

function processPage(content) {
  let totalAmount = 0;
  return new Promise(resolve => {
      // Extract text from the PDF page
      let allLines = [];
      for (let j = content.items.length - 1; j >= 0; j--) {
        let itemString = content.items[j].str;
        itemString = itemString.replace(/\n/g, ''); // replace breaks
        itemString = itemString.replace(/\t/g, ''); // replace tabs
        itemString = itemString.replace(/ /g, '');  // replace spaces
        allLines.push(itemString);
      }
      // clear empty lines
      allLines = allLines.filter(function(item) {
        return item !== ' ' && item !== '.' && item !== '';
      });

      for (let j = 0; j < allLines.length; j++) {
        if (allLines[j].charAt(2) === '.' && allLines[j].charAt(5) === '.' && allLines[j].length > (15)) {
          const temp = allLines[j];
          allLines[j] = temp.slice(10, 20);
          allLines.splice(j, 0, temp.slice(0, 10));
        }

        if (allLines[j].includes('Kontostandam')) {
          const temp = allLines[j];
          allLines[j] = temp.slice(12, 20);
          allLines.splice(j, 0, temp.slice(0, 12));
        }

        // new line starts at "Kontostandam" or when two following fields are dates, thus having 10 characters
        if (isValidDate(allLines[j]) && allLines[j - 1] && isValidDate(allLines[j - 1])) {
          for (let k = 0; k < 12; k++) {
            let nextAmount = allLines[j - k];
            if (isValidValue(nextAmount)) {
              let dateParts = allLines[j].split('.');
              if (dateParts.length >= 3) {
                const date = dateParts[0] + '.' + dateParts[1] + '.' + dateParts[2].slice(2);

                let text = allLines[j - 3];

                if (k === 5) {
                  text = allLines[j - 2]
                }

                if (isValidDate(text)) {
                  text = allLines[j - 3]
                }

                if (isValidValue(text)) {
                  text = allLines[j - 1]
                }

                let purpose = allLines[j - 2];
                if (j - 2 !== j - k + 1) {
                  purpose += ' ' + allLines[j - k + 1];
                }

                let amount = allLines[j - k];
                if (amount.charAt(amount.length - 1) === '-') {
                  amount = '-' + amount.slice(0, -1); // move "-"
                } else {
                  amount = amount.slice(0, -1); // remove "+"
                }

                let amountFloat = parseFloat(amount.replaceAll('.', '').replaceAll(',', '.'));
                if (amountFloat === NaN) {
                  amount = 0;
                }

                totalAmount += amountFloat;
                //                                        date              text           purpose                             beneficiary                     amount
                dataset += '"DE45150505001101110771";"' + date + '";"";"' + text + '";"' + purpose + '";"";"";"";"";"";"";"' + allLines[j - 3] + '";"";"";"' + amount + '";"EUR";""\n';
              }
              // break loop
              k = 20;
            }
          }
        }
      }

      resolve();
  });
}
