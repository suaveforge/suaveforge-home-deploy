'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'career/index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'career/data.json'),'utf8'));
(async()=>{
 const executablePath=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
 assert.ok(executablePath,'Chrome/Chromium is installed');
 const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
 try{
  for(const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
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
    const cards=[...document.querySelectorAll('#fields .field')],insured=['위메이드','넥슨GT','유비펀','유비펀스튜디오','엔투스튜디오','안드로메다게임즈','네오위즈','넥스터','버드레터'];
    const field=name=>cards.find(x=>x.querySelector('.name')?.textContent===name);
    const count=name=>field(name)?.querySelector('.numbers small')?.textContent;
    const expected={'웹 개발':'82 / 120개월','서버 개발':'82 / 156개월','DB 개발':'50 / 156개월',
      '백엔드':'82 / 120개월','모바일 앱':'95 / 192개월','PC 응용SW':'69 / 180개월'};
    const sharesValid=cards.every(card=>{
     const chips=[...card.querySelectorAll('.field-source-chip.credited')],segments=[...card.querySelectorAll('.field-share-segment')];
     if(!chips.length)return segments.length===0;
     const p=chips.map(x=>Number(x.querySelector('.field-share-percent').textContent.replace('%','')));
     return segments.length===chips.length&&Math.abs(p.reduce((a,b)=>a+b,0)-100)<.02&&
      Math.abs(segments.reduce((a,x)=>a+parseFloat(x.style.width),0)-100)<.02;
    });
    const rosters=cards.map(card=>[...card.querySelectorAll('.field-source-chip')].map(x=>x.dataset.masterCompany).sort().join('|'));
    const rosterValid=cards.every(card=>{
     const nodes=[...card.querySelectorAll('.field-source-chip')];
     return nodes.length===9&&new Set(nodes.map(x=>x.dataset.masterCompany)).size===9&&
      nodes.every(x=>insured.some(name=>name.normalize('NFKC').replace(/\\s+/g,'').toLowerCase()===x.dataset.masterCompany));
    })&&rosters.every(s=>s===rosters[0]);
    const sourceHelp=field('웹 개발')?.textContent?.includes('개발활동 114개월 중 증빙대기 32개월');
    const clip=cards.flatMap(card=>[...card.querySelectorAll('.field-source-chip')].filter(x=>{
      const a=x.getBoundingClientRect(),b=card.getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1;
    }).map(x=>x.textContent));
    const mobileGaps=[...document.querySelectorAll('.field-source-tags')].every(x=>getComputedStyle(x).flexWrap==='wrap');
    const allMatches=Object.entries(expected).every(([name,value])=>count(name)===value);
    return {cards:cards.length,allMatches,rosterValid,sharesValid,sourceHelp,clip,mobileGaps,
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      gridColumns:getComputedStyle(document.querySelector('#fields')).gridTemplateColumns.split(' ').length,
      tabActivityRow:[...document.querySelectorAll('#projects tr')].some(r=>r.textContent.includes('멀티에셋 트레이더')&&r.textContent.includes('경력 미반영')),
      tabCreditedRow:[...document.querySelectorAll('#projects tr')].some(r=>r.textContent.includes('신규 모바일 MORPG')&&r.textContent.includes('경력 반영')),
      directGitKeepsTimeline:document.querySelectorAll('[data-timeline-month]').length===214
    };
   });
   assert.equal(errors.length,0,JSON.stringify(errors));
   assert.equal(stats.cards,9);assert.ok(stats.allMatches,'monthly insured totals appear');
   assert.ok(stats.rosterValid,'only nine insured company identifiers appear');
   assert.ok(stats.sharesValid,'share badges and stacked bar agree');
   assert.ok(stats.sourceHelp,'unverified 32 months are retained with clear label');
   assert.deepEqual(stats.clip,[],'no company label falls outside cards');
   assert.ok(stats.mobileGaps,'company tags wrap');assert.equal(stats.overflow,false,'no horizontal scroll');
   assert.equal(stats.tabActivityRow,true,'Git project stays in archive as unverified career');
   assert.equal(stats.tabCreditedRow,true,'insured MORPG remains credited');
   assert.equal(stats.directGitKeepsTimeline,true,'full activity timeline is preserved');
   if(device.name==='mobile')assert.equal(stats.gridColumns,1);
   fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
   const screenshot=path.join(root,'artifacts','career-field-sources-'+device.name+'.png');
   await page.screenshot({path:screenshot,fullPage:true});
   console.log('CAREER_INSURANCE_PAID_BROWSER',device.name,JSON.stringify(stats),'SCREENSHOT',screenshot);
   await page.close();
  }
  console.log('CAREER_INSURANCE_PAID_DESKTOP_MOBILE_QA_PASS');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
