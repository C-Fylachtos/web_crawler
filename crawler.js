const puppeteer = require('puppeteer');
const fs = require('fs');
const { performance } = require('perf_hooks');

const excel = require('./excel');
const config = JSON.parse(fs.readFileSync('./config.json'));
// Ignore Control+C from this file
// process.on('SIGINT', function () {});

let index = 1;
let endVal = 9999;
let $anchor;
let text;
let timesRan = 0;
let avgRoundTime = 13;
let competitionNames = [];
let competitionPrices = [];

let saveAfter = 25;

let competitionOrder = [];
let sheetName = '';

let urlsArray = [];
let rowsArray = [];
let ExcelRowsArray = [];

// AR Pharmacy , PlayOclock
let brandName = 'AR Pharmacy';
if (config && config.myShopName) {
  brandName = config.myShopName;
}

if (config && config.saveAfter) {
  saveAfter = +config.saveAfter;
}

const myConsole = new console.Console(fs.createWriteStream('./output-log.txt'));
myConsole.log(`${new Date().toString()}`);
myConsole.log('Hello World!');
process.on('uncaughtException', function (err) {
  myConsole.log(err);
  console.log('Caught exception: ', err);
});
process.on('unhandledRejection', function (err) {
  myConsole.log(err);
  console.log('Caught exception: ', err);
});

const URLS = 'https://www.skroutz.gr';
const t0 = performance.now();

let execTimes = [];
let timeStamps = [];

if (config && config.avgRoundTime) {
  avgRoundTime = +config.avgRoundTime;
}

console.log('Average round time: ', typeof avgRoundTime, avgRoundTime);

const searchUrls =
  process.argv.indexOf('-findurl') !== -1 || config.findUrl !== 0;
console.log('searchUrls', searchUrls);
const hasStartPos = process.argv.indexOf('-spos');
console.log(process.argv);
console.log(hasStartPos);
if (hasStartPos !== -1) {
  index = process.argv[hasStartPos + 1];
} else if (config.startingPosition) {
  index = config.startingPosition;
}
const hasEndPos = process.argv.indexOf('-epos');
console.log(process.argv);
console.log(hasEndPos);
if (hasEndPos !== -1) {
  endVal = process.argv[hasEndPos + 1];
} else if (config.endingPosition) {
  endVal = config.endingPosition;
}

const backUpFile = () => {
  if (!fs.existsSync(config.backUpPath, { recursive: true })) {
    fs.mkdirSync(config.backUpPath);
  }
  console.log('config  ', config.excelFilePath, config.backupFilePath);
  try {
    fs.copyFileSync(config.excelFilePath, config.backupFilePath);
    console.log(
      `${config.excelFilePath} was copied to ${config.backupFilePath}`
    );
  } catch (err) {
    console.log('Error while trying to backup file', err);
  }
};

const crawl = async () => {
  console.log('starting row is: ', index);
  console.log('Ending row is: ', endVal);

  if (config && config.competitionNames) {
    competitionNames = config.competitionNames;
  }
  if (config && config.sheetName) {
    sheetName = config.sheetName;
  }
  competitionNames.sort((item1, item2) =>
    item1 > item2 ? 1 : item1 < item2 ? -1 : 0
  );
  competitionNames.map((el, i) => {
    competitionOrder.push({ name: el, order: i + 1 });
  });
  if (competitionNames.length > 0) {
    await excel.writeRowOld(
      1,
      competitionNames.map((el, i) => {
        return { number: 17 + i, value: el };
      })
    );
  }

  competitionPrices = [];

  const rndWaitTime = +Math.floor(Math.random() * (+avgRoundTime / 3.5));

  // try {
  //   excel.writeRow(15, [
  //     { number: 3, value: 'testData3' },
  //     { number: 4, value: 'testData4' },
  //   ]);
  // } catch (e) {
  //   console.log('error while writing row', '\n', e);
  // }
  // excel.writeRow('234');
  if (searchUrls) {
    setTimeout(() => {
      // console.log(+index > +endVal);
      if (+index > +endVal) {
        return console.log('Finished successfully');
      } else {
        getUrlFromSku();
      }
    }, +rndWaitTime);
  } else {
    if (+index > +endVal) {
      return console.log('Finished successfully');
    } else {
      urlsArray = await getUrlsArray();
      for (let i = 0; i < urlsArray.length; i++) {
        try {
          await getDataFromUrl(
            urlsArray[i].url,
            urlsArray[i].indexNo,
            i === urlsArray.length - 1
          );
        } catch (error) {
          myConsole.log(error);
          console.log(error);
        }
      }
    }
  }
};

async function getUrlsArray() {
  let res = await excel.getUrlsArray(index, endVal);

  return res;
}

async function getDataFromUrl(newUrl, index, isLastRow) {
  const excelRowData = [];
  // const rndCommandWaitTime = Math.floor(Math.random() * 100);
  // try {
  //   const isSearchable = await excel
  //     .getCellValue(`N${index}`)
  //     .then((val) => val === 'q')
  //     .catch((e) => console.log('error while reading excel ', e));
  //   console.log('is Q', isSearchable);
  //   if (!isSearchable) {
  //     index++;
  //     return crawl();
  //   }
  // } catch (e) {
  //   console.log('Error while trying to read N', index);
  // }

  const browser = await puppeteer.launch({
    ignoreDefaultArgs: ['--disable-extensions'],
    executablePath:
      './node_modules/puppeteer/.local-chromium/win64-869685/chrome-win/chrome.exe',
    args: [
      '--start-minimized', // you can also use '--start-fullscreen'
    ],
    headless: true,
    // slowMo: rndCommandWaitTime,
    defaultViewport: null,
  });
  try {
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();

    if (newUrl !== null) {
      await page.goto(newUrl);
    } else {
      console.log(`Url  value at O${index} is Null`);
      await browser.close();
      // timeLog();
      index++;
      return crawl();
    }

    await autoScroll(page);

    const Navs = await page
      .$eval('#nav', (element) => element.innerText)
      .catch((e) => {
        console.log('error while getting Navs');
        return 'Not found';
      });
    const objNavs = Navs.split('\n');
    console.log(Navs, 'obj');

    // const manufacturer = await page.evaluate(() => {
    //   let $anchor = document.querySelectorAll('span');
    //   console.log('ancor', $anchor);
    //   text = $anchor.innerText;
    //   return $anchor;
    // });

    // const spanVal = await page.$eval(
    //   '.manufacturer .js-manufacturer-link',
    //   (el) => el.innerText
    // );
    const productTitle = await page
      .$eval('.page-title', (element) => element.innerText)
      .catch((e) => {
        console.log('error while getting Product title');
        return 'Not found';
      });
    excelRowData.push({ number: 2, value: productTitle });

    const manufacturer = await page
      .$eval(
        '.manufacturer .js-manufacturer-link',
        (element) => element.innerText
      )
      .catch((e) => {
        console.log('error while getting manufacturer');
        return 'Not found';
      });

    excelRowData.push({ number: 3, value: manufacturer });

    console.log(productTitle);

    objNavs.forEach((nav, i) => {
      console.log('i', i);
      if (i !== 0 && i < 4) {
        excelRowData.push({ number: 3 + i, value: nav });
      }
    });
    console.log('navs#2', Navs, excelRowData);

    const productRating = await page
      .$eval('[itemprop="ratingValue"]', (element) => element.innerText)
      .catch((e) => {
        console.log('error while getting product Rating');
        return 'Not found';
      });

    console.log('prod rating', productRating);
    excelRowData.push({ number: 10, value: productRating });

    const nbOfRatings = await page
      .$eval('.actual-rating ', (element) => element.innerText)
      .catch((e) => {
        console.log('error while getting nb of Ratings');
        return 'Not found';
      });

    console.log('nb rat', nbOfRatings);
    excelRowData.push({ number: 11, value: nbOfRatings });

    const mainImageUrl = await page
      .$eval('#sku-details  img', (element) => element.getAttribute('src'))
      .catch((e) => {
        console.log('error while getting main Image url');
        return 'Not found';
      });

    const skuDescription = await page
      .$eval('.sku-description', (element) => element.innerText)
      .catch((e) => {
        console.log('error while getting SKU description');
        return 'Not found';
      });

    excelRowData.push({ number: 16, value: skuDescription });

    excelRowData.push({ number: 12, value: mainImageUrl });

    const secondaryImageUrl = await page
      .$eval('.thumbnails a', (element) => element.getAttribute('href'))
      .catch((e) => {
        console.log('error while getting manufacturer');
        return 'Not found';
      });

    excelRowData.push({ number: 13, value: secondaryImageUrl });
    console.log('main url', mainImageUrl, 'second', secondaryImageUrl);

    const timeStamp = new Date().toString();
    excelRowData.push({ number: 14, value: timeStamp });

    const getLowestPrices = async () => {
      let foundLowestPrice = false;
      let foundSkroutzLowestPrice = false;
      let foundArPrice = false;

      let skroutzPrice = 0;
      let arPrice = 0;
      let price = 0;
      let shopName = '';
      let tempCompNames = [...competitionNames];
      competitionPrices = [];

      const shopCards2 = await page.$$('.js-product-card');

      for (let i = 0; i < shopCards2.length; i++) {
        // console.log(`loop #${i} of ${shopCards2.length}`);
        shopName = await shopCards2[i]
          .$eval('.shop-name', (el) => el.innerText)
          .catch((e) => console.log('error while getting shop name', e));

        if (shopName !== brandName) {
          if (tempCompNames.indexOf(shopName) > -1) {
            let tempPrice = await shopCards2[i]
              .$eval('.dominant-price', (el) => el.innerText)
              .catch((e) => {
                return;
              });
            if (tempPrice !== null && tempPrice !== undefined) {
              competitionPrices.push({ name: shopName, price: tempPrice });
              let tempIndex = tempCompNames.indexOf(shopName);
              tempCompNames.splice(tempIndex, 1);
              console.log(`sucess getting ${shopName} price `, tempPrice);
            }
          }
          if (!foundSkroutzLowestPrice) {
            const hasMerchant = await shopCards2[i]
              .$eval('.has-two-button-sections', (el) => el.innerText)
              .catch((e) => {
                return;
              });
            if (hasMerchant) {
              skroutzPrice = await shopCards2[i]
                .$eval('.dominant-price', (el) => el.innerText)
                .catch((e) => {
                  return;
                });
              if (skroutzPrice !== 0 && skroutzPrice !== undefined) {
                console.log('sucess getting skroutz price ', skroutzPrice);
                foundSkroutzLowestPrice = true;
                if (!foundLowestPrice) {
                  price = skroutzPrice;
                  foundLowestPrice = true;
                }
              }
            } else {
              const isOnlySkroutz = await shopCards2[i]
                .$eval('.price-content-ecommerce', (el) => el.innerText)
                .catch((e) => {
                  return;
                });
              if (isOnlySkroutz !== undefined) {
                skroutzPrice = await shopCards2[i]
                  .$eval('.dominant-price', (el) => el.innerText)
                  .catch((e) =>
                    console.log('error trying to get skroutz price')
                  );
                if (skroutzPrice !== 0 && skroutzPrice !== undefined) {
                  console.log('sucess getting skroutz price ', skroutzPrice);
                  foundSkroutzLowestPrice = true;
                  if (!foundLowestPrice) {
                    price = skroutzPrice;
                    foundLowestPrice = true;
                  }
                }
              }
            }
          }
          if (!foundLowestPrice) {
            price = await shopCards2[i]
              .$eval('.dominant-price', (el) => el.innerText)
              .catch((e) => {
                return;
              });
            if (price !== 0 && price !== undefined) {
              console.log('sucess getting price ', price);
              foundLowestPrice = true;
            }
          }
          // const has2sections = .has-two-button-sections
        } else if (shopName === brandName) {
          arPrice = await shopCards2[i]
            .$eval('.dominant-price', (el) => el.innerText)
            .catch((e) => {
              return;
            });
          if (arPrice !== 0 && arPrice !== undefined) {
            console.log(`sucess getting "${brandName}" price`, arPrice);
            foundArPrice = true;
          }
        }

        if (
          (foundLowestPrice &&
            foundArPrice &&
            foundSkroutzLowestPrice &&
            tempCompNames.length === 0) ||
          i === shopCards2.length - 1
        ) {
          console.log(`Found all prices or searched all shops *stoping loop*`);
          i = shopCards2.length;
          excelRowData.push({
            number: 7,
            value: price !== 0 ? price : 'Not found',
          });
          excelRowData.push({
            number: 8,
            value: skroutzPrice !== 0 ? skroutzPrice : 'Not found',
          });
          excelRowData.push({
            number: 9,
            value: arPrice !== 0 ? arPrice : 'Not found',
          });

          competitionPrices.sort((item1, item2) =>
            item1.name > item2.name ? 1 : -1
          );
          if (competitionPrices.length > 0) {
            competitionPrices.map((el) => {
              let tempIndex = -1;
              competitionOrder.map((el2, i) => {
                if (el2.name === el.name) {
                  tempIndex = el2.order;
                }
              });

              excelRowData.push({ number: 16 + tempIndex, value: el.price });
            });
          }

          try {
            // await excel.writeRow(index, excelRowData);
            rowsArray = [];
            excelRowData.map((row) => {
              rowsArray.push({
                row: index,
                number: row.number,
                value: row.value,
              });
            });
            ExcelRowsArray.push({
              row: index,
              data: rowsArray,
            });

            if (ExcelRowsArray.length === +saveAfter || isLastRow) {
              await excel.writeRow(ExcelRowsArray, sheetName);
              ExcelRowsArray = [];
            }
          } catch (e) {
            myConsole.log('error while writing row', '\n', e);
            console.log('error while writing row', '\n', e);
          }
        }
      }
    };

    await getLowestPrices();
    await browser.close();
    await timeLog();
    timesRan += 1;
    if (timesRan % config.backupAfter === 0) {
      backUpFile();
    }
  } catch (error) {
    await browser.close();
    console.error(error);
    myConsole.log(error);
    await timeLog();
  }
}

async function getUrlFromSku() {
  const rndCommandWaitTime = Math.floor(Math.random() * 100);
  console.log(
    'in getUrlFromSku',
    'Runtime',
    ((performance.now() - t0) / 1000).toFixed(0),
    's'
  );
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: ['--disable-extensions'],
    executablePath:
      './node_modules/puppeteer/.local-chromium/win64-869685/chrome-win/chrome.exe',
    args: [
      '--start-minimized', // you can also use '--start-fullscreen'
    ],
    headless: true,
    // slowMo: rndCommandWaitTime,
    defaultViewport: null,
  });
  try {
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // await page.setViewport({ width: 1366, height: 768 });
    await page.goto(URLS, { waitUntil: 'networkidle0' });

    const title = await page.title();
    console.log(title);

    let date = new Date();
    console.log(date.toString());

    await page.focus('#search-bar-input');
    // const newSku = '5201279072872';
    const newSku = await excel
      .getCellValue(`A${index}`)
      .then((val) => val)
      .catch((e) => console.log('error while reading excel ', e));
    console.log('NS', newSku);
    if (newSku !== null) {
      await page.keyboard.type(JSON.stringify(newSku));
    } else {
      console.log(`Sku value at A${i} is Null`);
      await browser.close();
      await timeLog();
      i++;
      crawl();
    }
    // .then((val) => {
    //   page.keyboard.type(JSON.stringify(val));
    // })
    // .catch((e) => {
    //   console.log('Error while trying to get cell value ', e);
    //   browser.close();
    //   i++;
    //   crawl();
    // });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.keyboard.press('Enter'),
    ]);

    const productFinalURL = await page.evaluate(() => {
      $anchor = document.querySelector('a.js-sku-link ');
      text = $anchor.href;
      return text;
    });

    if (!productFinalURL) {
      try {
        await excel.writeRowOld(index, [{ number: 15, value: 'Not found' }]);
      } catch (e) {
        console.log('error while writing row', '\n', e);
      }
      console.log('new URL -> Not Found');
    } else {
      try {
        await excel.writeRowOld(index, [
          { number: 15, value: productFinalURL },
        ]);
      } catch (e) {
        console.log('error while writing row', '\n', e);
      }
      console.log('new txt', productFinalURL);
    }

    await browser.close();
    await timeLog();
    timesRan += 1;
    if (timesRan % config.backupAfter === 0) {
      backUpFile();
    }
    index++;
    crawl();
  } catch (error) {
    await browser.close();
    console.error(error);
    await timeLog();
    index++;
    crawl();
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 1000;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function timeLog() {
  const average = (arr) =>
    arr.reduce(function (a, b) {
      return a + b / arr.length;
    }, 0);
  // const average = (arr) => arr.reduce(((a, b) => a + b) / arr.length, 0);

  const now = performance.now();
  const arrLength = timeStamps.length;
  const prevTimeStamp = arrLength >= 1 ? timeStamps[arrLength - 1] : 0;
  const cycleTime = (now / 1000 - +prevTimeStamp).toFixed(0);
  const avg = average(execTimes).toFixed(2);
  execTimes.push(cycleTime);

  timeStamps.push(now / 1000).toFixed(0);

  console.log('Cycle #', timesRan + 1);
  console.log('Average Cycle Time: ', avg, 's');
  console.log('This Cycle Runtime: ', cycleTime, 's');
  console.log(
    'Total Runtime: ',
    ((performance.now() - t0) / 1000).toFixed(0),
    's'
  );
  if (avg < +avgRoundTime && arrLength > 1) {
    console.log(`Avg Less Than ${avgRoundTime} applying corrections`);
    const addedDelay = Math.random() * Math.abs(+avgRoundTime - avg) * 3 + 1;
    console.log('Added Delay: ', addedDelay.toFixed(2), ' s');
    await new Promise((resolve) => setTimeout(resolve, addedDelay * 1000));
  }
}

crawl();
