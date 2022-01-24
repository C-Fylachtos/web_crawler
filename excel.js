const Excel = require('exceljs');
const fs = require('fs');

let config;
let sheetName = '';
try {
  const jsonString = fs.readFileSync('./config.json');
  config = JSON.parse(jsonString);
} catch (err) {
  console.log(err);
  return;
}
if (config && config.sheetName) {
  sheetName = config.sheetName;
}
const myConsole = new console.Console(
  fs.createWriteStream('./output-log-excel.txt')
);
myConsole.log(`${new Date().toString()}`);
myConsole.log('Hello World Excel!');
// const config = JSON.stringify(JSON.parse(fs.readFileSync('./config.json')));

console.log('conf', config);
// let isExcelFnRunning = true;
// let shouldExit = false;

// process.on('SIGKILL', function () {
//   console.log('CAUGHT KILL SIGNAL');
// });
// process.on('SIGTERM', function () {
//   console.log('CAUGHT KILL SIGNAL');
// });
// process.on('SIGINT', function () {
//   console.log('Caught interrupt signal');
//   if (isExcelFnRunning === false) {
//     console.log('ExcelFN is not running.. shuting down!');
//     process.exit();
//   } else {
//     console.log('ExcelFN is running will shutdown soon..');
//     shouldExit = true;
//   }
// });

async function writeRowOld(rowNumber, rowData, excelFileName) {
  // isExcelFnRunning = true;
  // console.log('row data to write', rowData);

  const newWorkbook = new Excel.Workbook();
  await newWorkbook.xlsx.readFile(config.excelFilePath);

  const newworksheet = newWorkbook.getWorksheet(sheetName);

  const curRow = newworksheet.getRow(rowNumber);
  rowData.forEach((cell) => {
    console.log('row', rowNumber, 'cell', cell, 'val', cell.value);
    curRow.getCell(cell.number).value = cell.value;
    return;
  });

  curRow.commit();

  await newWorkbook.xlsx.writeFile(config.excelFilePath);

  console.log(`Row ${rowNumber} was written`);

  // if (shouldExit === false) {
  //   return;
  // } else {
  //   console.log('Killing process! Goodbye!');
  //   process.exit(100);
  // }
}

async function writeRow(rowData, sheetName, firstRow = false) {
  // console.log(rowData, sheetName);
  rowData[0].data.map((el) => console.log(el));
  // console.log(
  //   "row data to write",
  //   rowData,
  //   rowData[0].data,
  //   typeof rowData,
  //   "name ",
  //   sheetName,
  //   "BOOL ",
  //   firstRow
  // );

  const newWorkbook = new Excel.Workbook();
  await newWorkbook.xlsx.readFile(config.excelFilePath);
  let newworksheet = newWorkbook.getWorksheet(sheetName);

  try {
    // if (!firstRow) {
    //   await newWorkbook.xlsx.readFile(config.excelFilePath);
    //   newworksheet = newWorkbook.getWorksheet(sheetName);
    //   if (newworksheet === undefined) {
    //     newworksheet = newWorkbook.addWorksheet(sheetName);
    //   }
    // } else {
    //   newworksheet = newWorkbook.addWorksheet(sheetName);
    // }
    await Promise.all(
      rowData.map(async (currentRow) => {
        const curRow = newworksheet.getRow(+currentRow.row);
        currentRow.data.forEach((cell) => {
          curRow.getCell(cell.number).value = cell.value;
          return;
        });

        curRow.commit();

        console.log(`Row ${currentRow.row} was written`);
        myConsole.log(`Row ${currentRow.row} was written`);
      })
    );
    await newWorkbook.xlsx.writeFile(config.excelFilePath);
  } catch (err) {
    console.log('Error while trying to write row: ', err);
    myConsole.log('Error while trying to write row: ', err);
    myConsole.log('Row Data Before Error: ', JSON.stringify(rowData));
    process.exit(101);
  }
}

async function getCellValue(cell) {
  isExcelFnRunning = true;
  const newWorkbook = new Excel.Workbook();
  await newWorkbook.xlsx.readFile(config.excelFilePath);

  const newworksheet = newWorkbook.getWorksheet(sheetName);
  return newworksheet.getCell(cell).value;
}

async function getUrlsArray(startPos, endVal) {
  const urlsArray = [];
  const newWorkbook = new Excel.Workbook();
  await newWorkbook.xlsx.readFile(config.excelFilePath);

  const newworksheet = newWorkbook.getWorksheet(sheetName);
  // newworksheet.getCell(cell).value;
  let isSearchable;
  for (let i = +startPos; i < +endVal + 1; i++) {
    try {
      let tempCellVal = newworksheet.getCell(`N${i}`).value;
      isSearchable = tempCellVal === 'q';
    } catch (e) {
      console.log('error while reading excel ', e);
      myConsole.log('error while reading excel ', e);
    }
    console.log('is Q', isSearchable);

    if (isSearchable) {
      let newUrl;
      try {
        newUrl = newworksheet.getCell(`O${i}`).value;
      } catch (error) {
        console.log(error);
      }

      // = await excel
      //   .getCellValue(`O${index}`)
      //   .then((val) => val)
      //   .catch((e) => console.log('error while reading excel ', e));
      console.log('New URL', newUrl);
      if (newUrl !== null) {
        urlsArray.push({ indexNo: i, url: newUrl });
      } else {
        console.log(`Url  value at O${i} is Null`);
      }
    }
  }
  return urlsArray;
}

module.exports = {
  writeRowOld,
  writeRow,
  getCellValue,
  getUrlsArray,
};

// excel();
