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
     creditedBadges:fields.reduce((a,card)=>a+card.querySelectorAll('.field-source-chip.credited').length,0),
     pendingBadges:fields.reduce((a,card)=>a+card.querySelectorAll('.field-source-chip.pending').length,0),
     companyShareTracks:fields.filter(card=>card.querySelector('.field-share-track')).length,
     shownShareLabels:fields.reduce((n,card)=>n+card.querySelectorAll('.field-share-percent').length,0),
     companyShareCorrect:fields.every(card=>{
      const track=card.querySelector('.field-share-track');
      const credited=card.querySelectorAll('.field-source-chip.credited').length;
      if(!track)return credited===0;
      const widths=[...track.querySelectorAll('.field-share-segment')].map(el=>parseFloat(el.style.width));
      const labelShares=[...card.querySelectorAll('.field-share-percent')].map(el=>parseFloat(el.textContent));
      return widths.length===credited&&credited===labelShares.length&&
       Math.abs(widths.reduce((a,b)=>a+b,0)-100)<0.01&&
       Math.abs(labelShares.reduce((a,b)=>a+b,0)-100)<0.01;
     }),
     companySharesOverflow:fields.flatMap(card=>{
      const track=card.querySelector('.field-share-track');
      if(!track)return [];
      const a=track.getBoundingClientRect(),b=card.getBoundingClientRect();
      return a.right>b.right+1||a.left<b.left-1?[card.querySelector('.name')?.textContent]:[];
     }),
     uncreditedRows:fields.filter(card=>[...card.querySelectorAll('.field-source-label')].some(el=>el.textContent==='미반영')).length,
     pendingTitlesValid:fields.every(card=>[...card.querySelectorAll('.field-source-chip.pending')].every(el=>el.title.startsWith('미반영 · 해당 분야에 포함되지만 개월 미반영 · '))),
     unrelatedRows:fields.filter(card=>[...card.querySelectorAll('.field-source-label')].some(el=>el.textContent==='해당 X')).length,
     fullMasterMatrix:fields.every(card=>{
      const badges=[...card.querySelectorAll('.field-source-chip')];
      const keys=badges.map(el=>el.dataset.masterCompany);
      const groups=['credited','pending','unrelated'];
      const sum=groups.reduce((n,c)=>n+card.querySelectorAll('.field-source-chip.'+c).length,0);
      const masterKeys=keys.filter(key=>key!=='발주처미확인');
      return masterKeys.length===18&&new Set(masterKeys).size===18&&keys.every(Boolean)&&sum===badges.length&&
        keys.filter(key=>key==='발주처미확인').length<=1;
     }),
     masterKeysConsistent:fields.map(card=>[...card.querySelectorAll('.field-source-chip')].map(el=>el.dataset.masterCompany).filter(key=>key!=='발주처미확인').sort().join('|'))
      .every((keys,_,all)=>keys===all[0]),
     ontheliveWebState:(()=>{
      const web=fields.find(el=>el.querySelector('.name')?.textContent==='웹 개발');
      const tag=web?.querySelector('.field-source-chip[data-master-company="온더라이브"]');
      return {pending:!!tag?.classList.contains('pending'),notApplicable:!!tag?.classList.contains('unrelated'),months:web?.querySelector('.numbers small')?.textContent};
     })(),
     clips:fields.flatMap(card=>[...card.querySelectorAll('.field-source-chip')].filter(el=>{
      const a=el.getBoundingClientRect(),b=card.getBoundingClientRect();
      return a.right>b.right+1 || a.left<b.left-1;
     }).map(el=>el.innerText)),
     gridCols:getComputedStyle(document.querySelector('#fields')).gridTemplateColumns.split(' ').length,
     wrapping:[...document.querySelectorAll('.field-source-tags')].every(el=>getComputedStyle(el).flexWrap==='wrap'),
     pcBadges:[...fields.find(el=>el.querySelector('.name')?.textContent==='PC 응용SW').querySelectorAll('.field-chip-name')].map(el=>el.textContent),
     timeline:(()=>{
      const section=document.querySelector('#careerTimeline');
      const yearRows=[...section.querySelectorAll('.timeline-year')];
      return {
       totalMonths:section.querySelectorAll('[data-timeline-month]').length,
       years:yearRows.length,
       gapGroups:section.querySelectorAll('[data-gap-start]').length,
       summary:section.querySelector('#timelineKpis')?.innerText,
       topOrder:section.getBoundingClientRect().top<document.querySelector('#fields').getBoundingClientRect().top,
       hasNoHorizontalClip:yearRows.every(el=>{const a=el.getBoundingClientRect(),b=section.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1})
      };
     })(),
     recovery:{
      cards:document.querySelectorAll('#recoveryItems [data-recovery-id]').length,
      actionButtons:document.querySelectorAll('#recoveryItems [data-recovery-project], #recoveryItems [data-recovery-new]').length,
      source2022:document.querySelector('#recoveryItems [data-recovery-id="MF"]')?.textContent.includes('2022-11'),
      source2023:document.querySelector('#recoveryItems [data-recovery-id="ZM"]')?.textContent.includes('2023-08'),
      overlapNoCredit:document.querySelector('#recoveryItems [data-recovery-id="MC"]')?.textContent.includes('수행기간 미확정'),
      noHorizontalClip:[...document.querySelectorAll('#recoveryItems .recovery-item')].every(e=>{const a=e.getBoundingClientRect(),b=document.querySelector('.recovery').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1})
     },
     totalOverflow:document.documentElement.scrollWidth>window.innerWidth+1
    };
   });
   assert.equal(errors.length,0,JSON.stringify(errors));
   assert.equal(stats.cards,9);
   assert.ok(stats.allHaveBar);
   assert.ok(stats.creditedBadges>=15,'credit source labels across nine fields');
   assert.ok(stats.pendingBadges>=3,'unconfirmed work has its own labels');
   assert.equal(stats.companyShareTracks,7,'each credited field shows one proportion bar');
   assert.ok(stats.shownShareLabels>=35,'all current credited company tags display their share');
   assert.equal(stats.companyShareCorrect,true,'company share lengths and shown percentages total 100%');
   assert.deepEqual(stats.companySharesOverflow,[],'share bar stays within every card');
   assert.equal(stats.uncreditedRows,9,'all fields visibly show uncredited row');
   assert.equal(stats.unrelatedRows,9,'all fields show third not-applicable group');
   assert.equal(stats.fullMasterMatrix,true,'each field contains all 18 base source identities exactly once');
   assert.equal(stats.masterKeysConsistent,true,'all nine fields enumerate the identical master roster');
   assert.equal(stats.ontheliveWebState.pending,true,'OnTheLive web history must appear under uncredited');
   assert.equal(stats.ontheliveWebState.notApplicable,false,'OnTheLive must not appear under not applicable for web');
   assert.equal(stats.ontheliveWebState.months,'98 / 120개월','no extra months from unverified OnTheLive time');
   assert.ok(stats.pendingTitlesValid,'uncredited company badges expose unconfirmed period');
   assert.deepEqual(stats.clips,[],'no company chips outside their cards');
   assert.ok(stats.pcBadges.includes('넥슨')&&stats.pcBadges.includes('유비'));
   assert.ok(stats.wrapping);
   assert.equal(stats.timeline.totalMonths,214,'monthly timeline covers Feb 2009-Nov 2026');
   assert.equal(stats.timeline.years,18,'2009 to 2026 year grid');
   assert.equal(stats.timeline.gapGroups,7,'7 unlinked intervals');
   assert.ok(stats.timeline.summary.includes('202')&&stats.timeline.summary.includes('12'),'202 months linked, 12 need verification');
   assert.equal(stats.timeline.topOrder,false,'retain existing field cards above the career timeline');
   assert.equal(stats.timeline.hasNoHorizontalClip,true,'each year row fits inside timeline card');
      assert.ok((await page.locator('#projects').innerText()).includes('참고자료 · 게이지 0개월'),'dated generic freelance preserved without credit');
   const resourceFilter=page.locator('#filter');
   await resourceFilter.selectOption('resource');
   const resourceCount=await page.locator('#projects tr').count();
   assert.ok(resourceCount>=1,'resource-only filter exposes generic freelance');
   assert.match(await page.locator('#projects').innerText(),/프리랜서 웹게임·시스템 개발/);
   await resourceFilter.selectOption('all');
   assert.equal(stats.recovery.cards,7,'seven separate reconstruction groups displayed');
   assert.ok(stats.recovery.actionButtons>=7,'every reconstruction group has direct date-entry control');
   assert.equal(stats.recovery.source2022,true,'MetaFastest Nov 2022 evidence shown');
   assert.equal(stats.recovery.source2023,true,'ZeroMax Aug 2023 evidence shown');
   assert.match(await page.locator('[data-recovery-id="ZM"] .recovery-status').innerText(),/일부 기간 등록/,'ZeroMax recovered one month without claiming full project');
   await page.locator('[data-timeline-month="2023-08"]').click();
   assert.match(await page.locator('#timelineFocus').innerText(),/추가 개발경력/,'August credited as dated project');
   assert.match(await page.locator('#timelineFocus').innerText(),/Upodium 말 커스터마이징 웹/);
   await page.locator('[data-timeline-month="2023-10"]').click();
   assert.match(await page.locator('#timelineFocus').innerText(),/추가 개발경력/,'October now credited by Telegram work evidence');
   assert.equal(stats.recovery.overlapNoCredit,true,'MetaCross activity milestone does not imply credited dates');
   assert.equal(stats.recovery.noHorizontalClip,true,'reconstruction groups fit inside card');
   await page.locator('[data-recovery-id="OL"] [data-recovery-project="p16"]').click();
   assert.equal(await page.locator('#company').inputValue(),'프리랜서 / 온더라이브','on-the-live edit pre-fills company');
   assert.equal(await page.locator('#start').inputValue(),'','no invented start date from payment');
   assert.equal(await page.locator('#end').inputValue(),'','no invented end date from payment');
   await page.locator('#cancel').click();
   assert.equal(stats.totalOverflow,false,'no horizontal page overflow');
   await page.locator('[data-timeline-month="2025-08"]').click();
   assert.match(await page.locator('#timelineFocus').innerText(),/기간 미연결/);
   assert.match(await page.locator('#timelineFocus').innerText(),/활동 시점·자료 단서/);
   await page.locator('[data-gap-start="2018-12"]').click();
   assert.equal(await page.locator('#start').inputValue(),'2018-12','gap shortcut pre-fills start month');
   assert.equal(await page.locator('#end').inputValue(),'2019-01','gap shortcut pre-fills end month');
   await page.locator('#cancel').click();
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
