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
    await page.emulate(devices['iPhone X'])
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });

    await page.setJavaScriptEnabled(true);
    await page.waitFor(1200);

    let arr = await page.evaluate(() => {

      let trs = document.querySelectorAll('tbody tr')

      console.log(trs)

      let json = {}

      let arr = []

      trs.forEach(item => {
        if(item.clientHeight == 19){
         
          let text = item.innerText;
          /^(\s+)\w+/.test(text)
          text.replace(RegExp.$1, '')
          let textArr = text.split('	')
          json[textArr[1]] = textArr[2]
          arr.push([textArr[1], textArr[2]])
        }
      })


      return arr;
    });

    console.log(arr)

    let chinaMap = {}
    let china = []
    let top = /^\s{0}/
    let sec = /^\s{1}/
    let thr = /^\s{3}/

    let topStack = []
    let secStack = []
    let thrStack = []

    let isZxs = false


    arr.map((item, index)=>{
      let code = item[0] || ''
      let name = item[1] || ''

      chinaMap[code] = name.replace(/\s/g, '')

      let next = arr[index + 1]

      if(next){
        //处理直辖市
        if((top.test(name) && !sec.test(name)) && thr.test(next[1])){
          isZxs = true
        }
      }

      if(top.test(name) && !sec.test(name)){
        topStack.push({code, name: name.replace(/\s/g, '')})
        // return false
      }

      if(sec.test(name) && !thr.test(name)){
        secStack.push({code, name: name.replace(/\s/g, '')})
      }

      if(thr.test(name) && !isZxs){
        thrStack.push({code, name: name.replace(/\s/g, '')})
      }

      if(thr.test(name) && isZxs){
        secStack.push({code, name: name.replace(/\s/g, '')})
      } 

      if(next){
        //处理直辖市
        let len = name.match(/\s/g) ? name.match(/\s/g).length : 0
        let lenNext = next[1].match(/\s/g) ? next[1].match(/\s/g).length : 0

        //类型变化
        if(len > lenNext) {

          //市变化
          if(lenNext == 1 || lenNext == 0){
            let last = secStack.pop()
            last && (last['children'] = thrStack)
            secStack.push(last)
            thrStack = []
          }

          //省变化
          if(lenNext == 0){
            let last = topStack.pop()
            // console.log('lll',last)
            last && (last['children'] = secStack)
            topStack.push(last)

            // if(isZxs){
              secStack = []
            // }

          }

        }

        if(!sec.test(next[1]) && top.test(next[1])){
          isZxs = false
        } 

      //结束
      } else {
        china = topStack
      }



    })

    // console.log((china))

    fs.writeFile('china.json', JSON.stringify(china),  function(err) {
      if (err) {
          return console.error(err);
      }
      console.log("数据写入成功！");
   });

   fs.writeFile('chinaMap.json', JSON.stringify(chinaMap),  function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("数据写入成功！");

 });

    page.once('load', () => console.log('Page loaded!'));

    await page.close()
    url.match(/&p=(\w*)$/)
    if (RegExp.$1 == maxPage){
      await setTimeout(()=>{
         browser.close();
      },5000)
    }

  };
  (async () => {

    let getAllPage = (i, maxPage) => {
      console.log('抓取进度:', i + '/' + maxPage)
      getOnePage(
        "http://www.mca.gov.cn/article/sj/xzqh/2019/2019/201911250933.html",
        maxPage
      );

    }
    getAllPage(1, 1)
    console.log('hehe')

  })()
})()