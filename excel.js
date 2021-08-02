const Excel = require('exceljs');
const fs = require('fs');

let config;
try {
  const jsonString = fs.readFileSync('./config.json');
  config = JSON.parse(jsonString);
} catch (err) {
  console.log(err);
  return;
}

// const config = JSON.stringify(JSON.parse(fs.readFileSync('./config.json')));

console.log('conf', config);
let isExcelFnRunning = false;
let shouldExit = false;

process.on('SIGINT', function () {
  console.log('Caught interrupt signal');
  if (isExcelFnRunning === false) {
    console.log('ExcelFN is not running.. shuting down!');
    process.exit();
  } else {
    console.log('ExcelFN is running will shutdown soon..');
    shouldExit = true;
  }
});

async function writeRow(rowNumber, rowData, excelFileName) {
  isExcelFnRunning = true;
  console.log('row data to write', rowData);

  const newWorkbook = new Excel.Workbook();
  await newWorkbook.xlsx.readFile(config.excelFilePath);

  const newworksheet = newWorkbook.getWorksheet('Φύλλο1');

  const curRow = newworksheet.getRow(rowNumber);
  rowData.forEach((cell) => {
    console.log('row', rowNumber, 'cell', cell, 'val', cell.value);
    return (curRow.getCell(cell.number).value = cell.value);
  });

  curRow.commit();

  await newWorkbook.xlsx.writeFile(config.excelFilePath);

  console.log(`Row ${rowNumber} was written`);
  isExcelFnRunning = false;
  if (shouldExit === false) {
    return;
  } else {
    console.log('Killing process! Goodbye!');
    process.exit(100);
  }
}

async function getCellValue(cell) {
  isExcelFnRunning = true;
  const newWorkbook = new Excel.Workbook();
  await newWorkbook.xlsx.readFile(config.excelFilePath);

  const newworksheet = newWorkbook.getWorksheet('Φύλλο1');
  return newworksheet.getCell(cell).value;
}

module.exports = {
  writeRow,
  getCellValue,
};

// excel();
