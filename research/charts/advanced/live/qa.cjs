/* End-to-end Chromium QA for 35 SuaveForge-owned advanced charts. 
 * Does not assume a reference vendor's proprietary library is running.
 */
const {chromium}=require('../../gallery/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const OUT=path.join(__dirname,'qa-artifacts');fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:8181/research/charts/advanced/live/';
const CATS=[['flow',6],['hierarchy',6],['density',6],['multi',6],['story',5],['ops',6]];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const errors=[],reported=[];let desktopOverflow=false,mobileOverflow=false;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:920},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push('PAGE: '+e.message));
  page.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Advanced live chart'))console.log('LIVE_CHART_WARNING',m.text());});
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelectorAll('.advanced-live-card').length===14,{timeout:12000});
  const initial=await page.locator('.advanced-live-card').count();
  let counts={};
  for(const [category,count] of CATS){
   await page.locator('[data-category="'+category+'"]').click();
   await page.waitForFunction(n=>document.querySelectorAll('.advanced-live-card').length===n,count,{timeout:10000});
   counts[category]=await page.locator('.advanced-live-card').count();
   const cards=await page.locator('.advanced-live-card').all();
   for(const card of cards){
    const id=await card.getAttribute('data-ref');
    await card.locator('[data-chart]').scrollIntoViewIfNeeded();
    let status='timeout';
    try{
     await card.locator('.preview-state.ok,.preview-state.error').waitFor({state:'visible',timeout:24000});
     status=await card.locator('[data-preview-status]').textContent();
    }catch(e){status='timeout';}
    const rendered=await card.locator('[data-chart] canvas,[data-chart] svg,[data-chart] .js-plotly-plot').count();
    const result={id,category,passed:status==='실행됨'&&rendered>0,status,rendered};
    reported.push(result);
    if(!result.passed)console.log('LIVE_CHART_FAILED',JSON.stringify(result));
   }
   if(category==='flow'||category==='multi'||category==='density'){
    await page.locator('.live-intro').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(OUT,'advanced-live-'+category+'-desktop.png'),fullPage:true,animations:'disabled'});
   }
  }
  await page.locator('[data-category="all"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.advanced-live-card').length===35,{timeout:15000});
  const allCount=await page.locator('.advanced-live-card').count();
  await page.locator('[data-live-search]').fill('Sunburst');
  const searchCount=await page.locator('.advanced-live-card').count();
  await page.locator('[data-live-search]').fill('');
  desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  await page.locator('[data-category="flow"]').click();
  await page.locator('[data-ref="R001"] [data-open-preview]').click();
  await page.waitForFunction(()=>document.querySelector('[data-live-modal]')?.open===true);
  await page.locator('.live-modal .preview-state.ok,.live-modal .preview-state.error').waitFor({state:'visible',timeout:24000});
  const modalSuccess=await page.locator('.live-modal .preview-state.ok').count()===1;
  await page.locator('[data-modal-close]').click();
  const modalClosed=await page.locator('[data-live-modal]').evaluate(el=>!el.open);
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push('MOBILE: '+e.message));
  await mobile.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForFunction(()=>document.querySelectorAll('.advanced-live-card').length===14,{timeout:12000});
  const mobileCounts={};
  for(const [category,count] of CATS){
   await mobile.locator('[data-category="'+category+'"]').click();
   await mobile.waitForFunction(n=>document.querySelectorAll('.advanced-live-card').length===n,count,{timeout:10000});
   mobileCounts[category]=await mobile.locator('.advanced-live-card').count();
  }
  await mobile.locator('[data-category="flow"]').click();
  let mobileRendered=0;
  for(const card of await mobile.locator('.advanced-live-card').all()){
   await card.locator('[data-chart]').scrollIntoViewIfNeeded();
   await card.locator('.preview-state.ok,.preview-state.error').waitFor({state:'visible',timeout:25000});
   if(await card.locator('.preview-state.ok').count()===1)mobileRendered++;
  }
  mobileOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  await mobile.evaluate(()=>window.scrollTo(0,0));
  await mobile.screenshot({path:path.join(OUT,'advanced-live-mobile.png'),fullPage:true,animations:'disabled'});
  const passed=initial===14&&reported.length===35&&reported.every(x=>x.passed)&&Object.entries(counts).every(([c,n])=>CATS.some(x=>x[0]===c&&x[1]===n))&&Object.entries(mobileCounts).every(([c,n])=>CATS.some(x=>x[0]===c&&x[1]===n))&&allCount===35&&searchCount>=2&&modalSuccess&&modalClosed&&!desktopOverflow&&!mobileOverflow&&mobileRendered===6&&errors.length===0;
  const result={passed,initial,allCount,searchCount,modalSuccess,modalClosed,desktopOverflow,mobileOverflow,mobileRendered,counts,mobileCounts,rendered:reported.filter(x=>x.passed).length,total:reported.length,failures:reported.filter(x=>!x.passed),errors};
  fs.writeFileSync(path.join(OUT,'advanced-live-results.json'),JSON.stringify({...result,individual:reported},null,2)+'\n');
  console.log('ADVANCED_LIVE_QA',JSON.stringify(result));
  if(!passed)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error('ADVANCED_LIVE_QA_FATAL',e.stack||e);process.exitCode=1});