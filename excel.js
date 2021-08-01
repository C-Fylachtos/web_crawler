const Excel = require('exceljs');
const config = require('./config.json');
// log_in(config.username, config.password);
console.log('configgg', config);

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
  //   const workbook = new Excel.Workbook();
  //   const worksheet = workbook.addWorksheet('My Sheet');

  //   worksheet.columns = [
  //     { header: 'Id', key: 'id', width: 10 },
  //     { header: 'Name', key: 'name', width: 32 },
  //     { header: 'D.O.B.', key: 'dob', width: 15 },
  //   ];

  //   worksheet.addRow({ id: 1, name: 'John Doe', dob: new Date(1970, 1, 1) });
  //   worksheet.addRow({ id: 2, name: 'Jane Doe', dob: new Date(1965, 1, 7) });

  // save under export.xlsx
  //   await workbook.xlsx.writeFile('export.xlsx');

  //load a copy of export.xlsx
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

  //   console.log(testRow);
  //   newworksheet.columns = [
  //     { header: 'Id', key: 'id', width: 10 },
  //     { header: 'Name', key: 'name', width: 32 },
  //     { header: 'D.O.B.', key: 'dob', width: 15 },
  //   ];

  //   await newworksheet.addRow({
  //     id: 3,
  //     name: 'New Guy',
  //     dob: new Date(2000, 1, 1),
  //   });

  //   await newWorkbook.xlsx.writeFile('export2.xlsx');
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
