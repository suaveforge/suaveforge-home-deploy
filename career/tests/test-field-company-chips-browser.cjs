'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'career/index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'career/data.json'),'utf8'));
(async()=>{
 const executablePath=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 assert.ok(executablePath,'Chromium or Chrome preinstalled on the test runner');
 const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
 try{
  for(const device of [
   {name:'desktop',width:1440,height:900},
   {name:'mobile',width:390,height:844}
  ]){
   const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.route('https://career.test/**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
    if(url.pathname==='/data.json')return route.fulfill({status:200,contentType:'application/json; charset=utf-8',body:JSON.stringify(data)});
    return route.abort();
   });
   await page.goto('https://career.test/',{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelectorAll('#fields .field').length===9);
   const stats=await page.evaluate(()=>{
    const fields=[...document.querySelectorAll('#fields .field')];
    return {
     cards:fields.length,
     allHaveBar:fields.every(card=>card.querySelector('.track .fill')),
     creditedBadges:fields.reduce((a,card)=>a+card.querySelectorAll('.field-source-chip:not(.pending)').length,0),
     pendingBadges:fields.reduce((a,card)=>a+card.querySelectorAll('.field-source-chip.pending').length,0),
     uncreditedRows:fields.filter(card=>[...card.querySelectorAll('.field-source-label')].some(el=>el.textContent==='미반영')).length,
     pendingTitlesValid:fields.every(card=>[...card.querySelectorAll('.field-source-chip.pending')].every(el=>el.title.startsWith('미반영 · 기간 미확정 · '))),
     clips:fields.flatMap(card=>[...card.querySelectorAll('.field-source-chip')].filter(el=>{
      const a=el.getBoundingClientRect(),b=card.getBoundingClientRect();
      return a.right>b.right+1 || a.left<b.left-1;
     }).map(el=>el.innerText)),
     gridCols:getComputedStyle(document.querySelector('#fields')).gridTemplateColumns.split(' ').length,
     wrapping:[...document.querySelectorAll('.field-source-tags')].every(el=>getComputedStyle(el).flexWrap==='wrap'),
     pcBadges:[...fields.find(el=>el.querySelector('.name')?.textContent==='PC 응용SW').querySelectorAll('.field-source-chip')].map(el=>el.textContent),
     totalOverflow:document.documentElement.scrollWidth>window.innerWidth+1
    };
   });
   assert.equal(errors.length,0,JSON.stringify(errors));
   assert.equal(stats.cards,9);
   assert.ok(stats.allHaveBar);
   assert.ok(stats.creditedBadges>=15,'credit source labels across nine fields');
   assert.ok(stats.pendingBadges>=3,'unconfirmed work has its own labels');
   assert.equal(stats.uncreditedRows,9,'all fields visibly show uncredited row');
   assert.ok(stats.pendingTitlesValid,'uncredited company badges expose unconfirmed period');
   assert.deepEqual(stats.clips,[],'no company chips outside their cards');
   assert.ok(stats.pcBadges.includes('넥슨')&&stats.pcBadges.includes('유비'));
   assert.ok(stats.wrapping);
   assert.equal(stats.totalOverflow,false,'no horizontal page overflow');
   if(device.name==='mobile')assert.equal(stats.gridCols,1,'mobile uses one-column cards');
   fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
   const screenshot=path.join(root,'artifacts','career-field-sources-'+device.name+'.png');
   await page.screenshot({path:screenshot,fullPage:true});
   console.log('CAREER_FIELD_CHIPS_REAL_BROWSER',device.name,JSON.stringify(stats),'SCREENSHOT',screenshot);
   await page.close();
  }
  console.log('CAREER_FIELD_CHIPS_DESKTOP_MOBILE_VISUAL_QA_PASS');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
