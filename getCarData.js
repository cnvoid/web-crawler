const devices = require('puppeteer/DeviceDescriptors')
const puppeteer = require('puppeteer'),
  fs = require('fs'),
  $ = require('jquery'),
  path = require('path');

var http = require('http');
var url = require('url');
let request = require('request');

let queue = require('./queue.js')();





const XLSX = require("xlsx");
const WorkBook = require("./workbook");

let tabs = 1

let getJson = (url, cb) => {
  let fn = () => {
    var req = http.get(url, function (res) {

      var data = "";
      // res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
      res.on("data", function (chunk) {
        data += chunk;
      });
      res.on("end", function () {
        console.log('>>>>', data)
        queue.killFront()
        cb && cb(JSON.parse(data))
      });
      res.on("error", function (err) {
        console.log("请求失败");
      });
    });
    req.on('error', function (err) {
      console.log("请求失败2" + err.message);
    });
  }
  queue.enqueue(fn).startLoop()
}

var downloadPic = function (url, dest) {
  let fn = () => {
    var req = http.get(url, function (res) {
      var imgData = "";
      res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
      res.on("data", function (chunk) {
        imgData += chunk;
      });
      res.on("end", function () {
        fs.writeFile(dest, imgData, "binary", function (err) {
          queue.killFront()
          if (err) {
            console.log("保存失败" + JSON.stringify(err));
          } else {
            console.log("保存成功");

          }

        });
      });
      res.on("error", function (err) {
        console.log("请求失败");
      });
    });
    req.on('error', function (err) {
      console.log("请求失败2" + err.message);
    });
  }
  queue.enqueue(fn).startLoop()
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/google/chrome/chrome',
    headless: false,
    timeout: 2 * 60 * 1000,
    defaultViewport: {
      width: 750,
      height: 800,
      isMobile: true,
      hasTouch: true
    },
    'args': ['--disable-extensions',
      '--proxy-server=127.0.0.1:1081',
    ]
  });

  let openNewTab = async (url, evaluate, cb, wait4 = 5000) => {
    const page = await browser.newPage();
    await page.emulate(devices['iPhone X'])
    await page.goto(url, { timeout: 0 });

    await page.setJavaScriptEnabled(true);
    await page.waitFor(wait4);
    // await page.on('domcontentloaded', () => {
    //   console.log('页面加载完成')
    // })

    let t = setInterval(() => {
      page.reload()
    }, 10 * 1000)
    let data = await page.evaluate(evaluate);
    if (data) {
      clearInterval(t)
    }
    cb && cb(data)
    page.close()

  }

  async function getPageContext (spec) {
    return new Promise(function(resolve, reject){
      ; (function () {
        let fn = () => {
          tabs++
          if (tabs < 10) {
            queue.killFront()
          }

          let specUrl = `http://car.m.yiche.com/${spec}/peizhi/`
          console.log('爬取页面内容：', specUrl)
          openNewTab(specUrl, () => {

            let trs = document.querySelectorAll('#fixTable tbody tr')
            let ctrs = document.querySelectorAll('#conTable tbody tr')
            let one = {}

            for (let i = 0; i < trs.length; i++) {
              let item = trs[i]
              if (/车型级别/.test(item.innerText)) {
                let select = ctrs[i].querySelector('td div')
                one.modelLevel = select.innerHTML
              }

              if (/座位数/.test(item.innerText)) {
                let select = ctrs[i].querySelector('td div')
                one.seatNum = select.innerHTML
              }
            }

            return one

          }, (data) => {
            data.specUrl = specUrl
            console.log('数据爬取：', data)

            resolve(data)
            tabs--
            if (tabs < 10) {
              queue.killFront()
            }


          }, '#conTable')
        }
        queue.enqueue(fn).startLoop()

      })(spec)
    })
  }

  let getOnePage = async (url, maxPage) => {

    const page = await browser.newPage();
    // await page.emulate(devices['iPhone X'])
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    console.log('打开页面')

    await page.setJavaScriptEnabled(true);
    await page.waitFor(8000);
    await page.on('domcontentloaded', () => {
      console.log('页面加载完成')
    })

    let arr = await page.evaluate(() => {



      let links = document.querySelectorAll('.box ul>li')
      let brands = []
      for (let i = 0; i < links.length; i++) {
        let enName = links[i].getAttribute('id')
        let a = links[i].querySelector('a')
        let id = a.getAttribute('data-id')
        let logo = a.querySelector('img').getAttribute('data-original') || ''
        logo = !!logo ? logo : a.querySelector('img').getAttribute('src');
        let name = a.querySelector('.brand-name').innerText
        brands.push({ id, logo, name, enName })
      }


      return brands;
    });



    arr.map((item, i) => {
      let path = './carinfo/imgs/logo/logo_' + item.enName + '.png'
      item.logoSrc = path
        ; (function (item) {
          getJson(`http://api.car.bitauto.com/CarInfo/GetCarDataJson.ashx?action=serial&pid=${item.id}&datatype=1`, async (json) => {
            let data = {Child: []}
            json.map(item=>{
              data.Child = data.Child.concat(item.Child)
            })
           
            item.brandId = data.BrandId || ''
            // console.log(json)
            item.series = data.Child

            item.series.map(async item2 => {

              if (item2.Price == '未上市' || item2.CsSaleState == '待销') {
                return false
              }
              // let one = {}
              item2.seriesId = item2.SerialId
              item2.seriesName = item2.SerialName
              item2.specName = item2.Allspell

              // delete item2.SerialId
              // delete item2.SerialName
              // delete  item2.Allspell
              // delete item2.CsSaleState
              // delete item2.ImageUrl
              // delete item2.Price
              // delete item2.CsSaleState
              // delete item2.TagName
              
              item2.specs = await getPageContext( item2.specName)

              // return one
            })
            arr[i] = { ...arr[i], ...item }
          })
        })(item)

      // downloadPic(item.logo, path)
    })
    // console.log(JSON.stringify(arr))

    queue.on('empty', async (isLast) => {
      console.log('emptyyyy')
      // if(isLast) {
      setTimeout(() => {
        // fs.writeFile('./carinfo/carinfo.json', JSON.stringify(arr), function (err) {
        //   if (err) {
        //     return console.error(err);
        //   }
        //   console.log("数据写入成功！");

        // });
      }, 15 * 1000)

      // }

      // await page.close()



      // await browser.close();


    })



    page.once('load', () => console.log('Page loaded!'));



  };
  (async () => {

    // let getAllPage = (i, maxPage) => {
    //   console.log('抓取进度:', i + '/' + maxPage)
    //   getOnePage(
    //     "http://car.m.yiche.com/brandlist.html",
    //     maxPage
    //   );

    // }
    // getAllPage(1, 1)
    // console.log('hehe')

    let json = fs.readFileSync('./carinfo/carinfo.json', 'utf8');


let sheet = []
let data = JSON.parse(json)
data.map(async item=>{
  // if (Array.isArray(item.series)) {
    item.series.map(async item2=>{
      if(!item2.specs && !((item2.Price == '未上市' || item2.CsSaleState == '待销'))) {
        item2.seriesId = item2.SerialId
        item2.seriesName = item2.SerialName
        item2.specName = item2.Allspell

        // delete item2.SerialId
        // delete item2.SerialName
        // delete  item2.Allspell
        // delete item2.CsSaleState
        // delete item2.ImageUrl
        // delete item2.Price
        // delete item2.CsSaleState
        // delete item2.TagName
        
        item2.specs = await getPageContext( item2.specName)

        setTimeout(() => {
          fs.writeFile('./carinfo/carinfo2.json', JSON.stringify(data), function (err) {
            if (err) {
              return console.error(err);
            }
            console.log("数据写入成功！");
  
          });
        }, 5 * 1000)
      }
   
    })
  // }
})

  })()
})()

