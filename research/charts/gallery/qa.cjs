const { chromium } = require('playwright');
const fs=require('node:fs'),path=require('node:path');
const OUT=path.resolve(__dirname,'qa-artifacts');
fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:8181/research/charts/gallery/';
const expected=[
{key:'trend',button:'추세 · 선 그래프',rows:6},
{key:'bar',button:'단계 · 막대 그래프',rows:6},
{key:'donut',button:'구성비 · 도넛 차트',rows:4},
{key:'scatter',button:'관계 · 산점도',rows:8}
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[],reports=[];
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',err=>errors.push(err.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text());if(msg.type()==='warning')console.log('BROWSER_WARNING',msg.text())});
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('[data-category-controls] button');
 for(const cat of expected){
  await page.getByRole('button',{name:cat.button}).click();
  try{await page.waitForFunction(()=>document.querySelectorAll('.live-state.good').length===5,null,{timeout:27000})}catch{}
  const data=await page.evaluate(()=>({ok:document.querySelectorAll('.live-state.good').length,failed:document.querySelectorAll('.live-state.bad').length,status:document.querySelector('[data-render-status]')?.textContent,rows:document.querySelectorAll('[data-sample-table] tbody tr').length,elements:{
  echarts:document.querySelectorAll('[data-engine-root=echarts] canvas').length,
  chartjs:document.querySelectorAll('[data-engine-root=chartjs] canvas').length,
  plotly:document.querySelectorAll('[data-engine-root=plotly] svg').length,
  vega:document.querySelectorAll('[data-engine-root=vega] svg').length,
  d3:document.querySelectorAll('[data-engine-root=d3] svg').length
  }}));
  await page.waitForTimeout(1150);
  await page.screenshot({path:path.join(OUT,'desktop-'+cat.key+'.png'),fullPage:true,animations:'disabled'});
  const pass=data.ok===5&&data.failed===0&&data.rows===cat.rows&&Object.values(data.elements).every(x=>x>0);
  reports.push({category:cat.key,pass,...data}); console.log('CATEGORY_QA',cat.key,JSON.stringify(data));
 }
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 mobile.on('pageerror',err=>errors.push('mobile: '+err.message));
 await mobile.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
 try{await mobile.waitForFunction(()=>document.querySelectorAll('.live-state.good').length===5,null,{timeout:27000})}catch{}
 const mobileCount=await mobile.locator('.live-state.good').count();
 const horizontalOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
 await mobile.waitForTimeout(1150);
 await mobile.screenshot({path:path.join(OUT,'mobile-trend.png'),fullPage:true,animations:'disabled'});
 const result={pass:reports.every(x=>x.pass)&&mobileCount===5&&!horizontalOverflow&&errors.length===0,categories:reports,mobile:{rendered:mobileCount,horizontalOverflow},errors};
 fs.writeFileSync(path.join(OUT,'qa-results.json'),JSON.stringify(result,null,2)+'\n');
 console.log('LIVE_CHART_GALLERY_QA',JSON.stringify(result));
 if(!result.pass)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error('CHART_GALLERY_QA_FAILURE',e.stack||e);process.exitCode=1});
