const puppeteer = require('puppeteer'),
  fs = require('fs'),
  $ = require('jquery'),
  path = require('path');
const XLSX = require("xlsx");
const WorkBook = require("./../workbook");



let json = fs.readFileSync('./carinfo.json', 'utf8');

// console.log('file:', json)

let bigSheet = [];
let sheet = []
let data = [JSON.parse(json)]


function digui(data, i, pre=[]) {
  let arr = []

  data.map((item, ii)=>{
    let one = [...pre, item.name]
    
    if(item.children && item.children.length) {
      one.concat(digui(item.children, i, one))
    }

    arr.push(one)
  })
  // console.log('arr, arr', arr)
  sheet.push(...arr)
  console.log('sheet', sheet)
  return arr
}

console.log('end', digui(data, 0,[]))


        workbook = new WorkBook({
          Sheet1: bigSheet.concat(sheet)
        })
        workbook.writeFile('车型数据.xlsx')


// (async () => {
//   const browser = await puppeteer.launch({
//     executablePath: 'D:/Users/steven.zhu/AppData/Local/Chromium/Application/chrome.exe',
//     headless: false,
//   });

//   let getOnePage = async (url, maxPage) => {

//     const page = await browser.newPage();
//     await page.goto(url, {
//       waitUntil: 'networkidle2'
//     });

//     await page.setJavaScriptEnabled(true);
//     // await page.screenshot({
//     //   path: 'hn.png',
//     //   format: 'A4'
//     // });
//     await page.waitFor(1200);


//     let oneSheet = await page.evaluate(() => {
//       let sheet = [];
//       let uls = $(".future_table ul.cont");
//       uls.each((i, obj) => {
//         console.log(i, obj)
//         let one = [];
//         one.push($(".future_table ul.cont").eq(i).find('.li1').html());
//         one.push($(".future_table ul.cont").eq(i).find('.li2').html());
//         one.push($(".future_table ul.cont").eq(i).find('.li3').html());
//         one.push($(".future_table ul.cont").eq(i).find('.li4').html());
//         one.push($(".future_table ul.cont").eq(i).find('.li5').html());
//         sheet.push(one);
//       });

//       return sheet;;
//     });

//     bigSheet = [].concat(bigSheet, oneSheet)

//     page.once('load', () => console.log('Page loaded!'));

//     await page.close()
//     url.match(/&p=(\w*)$/)
//     if (RegExp.$1 == maxPage){
//       await setTimeout(()=>{
//          browser.close();
//       },5000)
//     }

//   };
//   (async () => {

//     let getAllPage = (i, maxPage) => {
//       console.log('抓取进度:', i + '/' + maxPage)
//       getOnePage(
//         "http://www.hbets.cn/index.php/index-show-tid-11.html?&p=" + i,
//         maxPage
//       );
//       if (i <= maxPage) {
//         setTimeout(() => {
//           getAllPage(++i, maxPage)
//         }, 1000)
//       } else {
//         console.log('>>>>', bigSheet)
//         workbook = new WorkBook({
//           Sheet1: bigSheet
//         })
//         workbook.writeFile('xxx.xlsx')
//       }
//     }
//     getAllPage(1, 1000)
//     console.log('hehe')

//   })()
// })()