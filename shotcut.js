const devices = require('puppeteer/DeviceDescriptors')
const puppeteer = require('puppeteer'),
  fs = require('fs'),
  $ = require('jquery'),
  path = require('path');
const XLSX = require("xlsx");
const WorkBook = require("./workbook");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/google/chrome/chrome',
    headless: false,
  });

  let getOnePage = async (url, maxPage) => {

    const page = await browser.newPage();
    // await page.emulate(devices['iPhone X'])
    await page.setJavaScriptEnabled(true);
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });
    await page.waitFor(30000)
    
    let imgStr = await page.screenshot({ path: 'example22.png', fullPage: true,});

    console.log(imgStr)

    let arr = await page.evaluate(() => {

      // let trs = document.querySelectorAll('#jczgl .stadiv a')

      // console.log(trs)


      // let arr = []

      // trs.forEach(item => {
      //   let name = item.getAttribute('name')
      //   let addr = item.getAttribute('title')
      //   let link = 'http://cgs.gzjd.gov.cn'+item.getAttribute('href')
      //   arr.push({name, addr, link})
      // })


      // return arr;
    });

    browser.close()


  //   console.log(arr)
  //   let bigSheet = [['名称',  '地址', '链接']];
  //   let sheet = []
  //   let data = arr
  //   data.map(item=>{

  //     sheet.push([item.name, item.addr, item.link])


  //     // }
  //   })
  //       workbook = new WorkBook({
  //         Sheet1: bigSheet.concat(sheet)
  //       })
  //       workbook.writeFile('车管所.xlsx')



  //   // console.log((china))

  //   fs.writeFile('cheguanshuo.json', JSON.stringify(arr),  function(err) {
  //     if (err) {
  //         return console.error(err);
  //     }
  //     console.log("数据写入成功！");
  //  });


  //   page.once('load', () => console.log('Page loaded!'));

  //   await page.close()
  //   url.match(/&p=(\w*)$/)
  //   if (RegExp.$1 == maxPage){
  //     await setTimeout(()=>{
  //        browser.close();
  //     },5000)
  //   }

  };
  (async () => {

    // let getAllPage = (i, maxPage) => {
      // console.log('抓取进度:', i + '/' + maxPage)
      await getOnePage(
        "http://baidu.comm",
        1
      );

    // }
    // getAllPage(1, 1)
    console.log('hehe')

  })()
})()
