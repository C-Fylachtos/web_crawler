const axios = require('axios');

const args = process.argv.slice(2).map(function (val, index, array) {
  console.log(index + ': ' + val);
  return index + ': ' + val;
});
const tempTable = ['a', 'b', 'c', 'd', 'e', 'f'];
let i = 0;
console.log(args);
function app() {
  const interv = setInterval(() => {
    console.log('Now processing item No. ' + i + ' with value ' + tempTable[i]);
    let date = new Date();
    console.log(date.toString());
    i++;
    if (i >= tempTable.length) {
      clearInterval(interv);
    }
  }, 2000);
  console.log(args);
}

app();
