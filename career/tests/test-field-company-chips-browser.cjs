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
    return {gantt:(()=>{
      const sec=document.querySelector('#careerGantt'),fieldSec=document.querySelector('#careerFields'),timeline=document.querySelector('#careerTimeline');
      const rows=[...sec.querySelectorAll('[data-gantt-company]')],boxes=rows.map(x=>x.querySelector('.cg-bar').getBoundingClientRect());
      const rails=rows.map(x=>x.querySelector('.cg-rail').getBoundingClientRect());
      const s=document.querySelector('#ganttScroll');
      return {position:fieldSec.getBoundingClientRect().bottom<sec.getBoundingClientRect().top+2&&
        sec.getBoundingClientRect().bottom<timeline.getBoundingClientRect().top+2,
       rows:rows.length,first:rows[0]?.dataset.ganttCompany,last:rows[rows.length-1]?.dataset.ganttCompany,
       metrics:document.querySelector('#ganttKpis')?.textContent,
       overlap:document.querySelector('#ganttCaption')?.textContent?.includes('실제 날짜 겹침 0구간'),
       sameMonth:document.querySelector('#ganttCaption')?.textContent?.includes('같은 달에 회사가 바뀐 사례 3개월'),
       gaps:sec.querySelectorAll('.cg-gap').length,twoDays:document.querySelector('#ganttGaps')?.textContent?.includes('2016.08.20 ~ 2016.08.21'),
       activityCount:sec.querySelectorAll('[data-gantt-activity]').length,
       activityKeys:[...sec.querySelectorAll('[data-gantt-activity]')].map(x=>x.dataset.ganttActivity),
       visibleNames:[...sec.querySelectorAll('[data-gantt-company]')].every(x=>x.querySelector('.cg-name strong')?.textContent===x.dataset.ganttCompany)&&
        [...sec.querySelectorAll('[data-gantt-activity]')].every(x=>x.querySelector('.cg-name strong')?.textContent?.trim().length>0),
       activityColors:[...sec.querySelectorAll('.cg-bar.activity')].every(x=>getComputedStyle(x).backgroundColor==='rgb(132, 120, 178)'),
       barLabelsRemoved:sec.querySelectorAll('.cg-bar-label').length===0,
       zeroMaxBars:sec.querySelector('[data-gantt-activity="zeromax"]')?.querySelectorAll('.cg-bar.activity').length,
       zeroMaxTooltip:sec.querySelector('[data-gantt-activity="zeromax"] .cg-bar.activity')?.title||'',
       insuredTooltipsValid:[...sec.querySelectorAll('[data-gantt-company]')].every(x=>{
        const title=x.querySelector('.cg-bar')?.title||'';
        return title.startsWith(x.dataset.ganttCompany+' · ')&&title.includes('~')&&title.length<70&&!title.includes('개월');
       }),
       activityTooltipsBrief:[...sec.querySelectorAll('[data-gantt-activity] .cg-bar.activity')].every(x=>x.title.length<=66&&x.title.includes('~')&&!/경력|근거 확인|일자 미확정|연결/.test(x.title)),
       overviewTooltipsBrief:[...sec.querySelectorAll('.cg-summary-bar')].every(x=>x.title.length<50&&x.title.includes('~')&&!x.title.includes('증빙')),
       leftNamesVisible:[...sec.querySelectorAll('[data-gantt-company], [data-gantt-activity]')].every(x=>{
        const label=x.querySelector('.cg-name strong'),rect=label?.getBoundingClientRect();
        return !!label&&!!rect&&rect.width>0&&rect.height>0;
       }),
       multiIntervals:sec.querySelector('[data-gantt-activity="multiasset"]')?.querySelectorAll('.cg-bar.activity').length,
       unknownIsActivity:!!sec.querySelector('[data-gantt-activity="unknown"] .cg-bar.activity'),
       railContained:boxes.every((x,i)=>x.left>=rails[i].left-2&&x.right<=rails[i].right+2),
       scrollable:s.scrollWidth>=s.clientWidth};
     })(),cards:cards.length,allMatches,rosterValid,sharesValid,sourceHelp,clip,mobileGaps,
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      gridColumns:getComputedStyle(document.querySelector('#fields')).gridTemplateColumns.split(' ').length,
      tabActivityRow:[...document.querySelectorAll('#projects tr')].some(r=>r.textContent.includes('멀티에셋 트레이더')&&r.textContent.includes('경력 미반영')),
      tabCreditedRow:[...document.querySelectorAll('#projects tr')].some(r=>r.textContent.includes('신규 모바일 MORPG')&&r.textContent.includes('경력 반영')),
      directGitKeepsTimeline:document.querySelectorAll('[data-timeline-month]').length===214
    };
   });
   assert.equal(errors.length,0,JSON.stringify(errors));
      assert.ok(stats.gantt.position,'Gantt is between category cards and overall timeline');
   assert.equal(stats.gantt.rows,9,'nine companies on dated Gantt');
   assert.equal(stats.gantt.first,'위메이드');assert.equal(stats.gantt.last,'버드레터');
   assert.ok(stats.gantt.metrics.includes('162개월'),'162 unique insured months');
   assert.ok(stats.gantt.overlap,'no false overlapping dates');
   assert.ok(stats.gantt.sameMonth,'three same-month employer transfers');
   assert.equal(stats.gantt.gaps,7,'date-level gaps include before and after insured dates');
   assert.ok(stats.gantt.twoDays,'two-day gap appears in gap list');
   assert.ok(stats.gantt.railContained,'Gantt bars remain inside timeline rails');
   assert.ok(stats.gantt.scrollable,'horizontal scroll available when needed');
   assert.equal(stats.gantt.activityCount,7,'seven groups of evidenced non-paid/non-insured development activity');
   assert.equal(stats.gantt.activityKeys.join('|'),'zeromax|upodium|arttest|multiasset|investment|suaveforge|unknown');
   assert.ok(stats.gantt.visibleNames,'each insured employer name stays attached to its bar');
   assert.ok(stats.gantt.activityColors,'unverified activity has distinct purple color');
   assert.ok(stats.gantt.barLabelsRemoved,'no names inside progress bars');
   assert.ok(stats.gantt.leftNamesVisible,'all company and project labels appear in left column');
   assert.equal(stats.gantt.zeroMaxBars,1,'ZeroMax one continuous visible period');
   assert.equal(stats.gantt.zeroMaxTooltip,'ZeroMax · 2023.02~2023.08 (4월 미확인)','compact ZeroMax tooltip');
   assert.ok(stats.gantt.insuredTooltipsValid,'insured Gantt tooltips contain only name and date range');
   assert.ok(stats.gantt.activityTooltipsBrief,'other activity Gantt tooltips are short');
   assert.ok(stats.gantt.overviewTooltipsBrief,'overview tooltips are short');
   assert.equal(stats.gantt.multiIntervals,5,'do not fill unproven gaps in multiaset development');
   assert.ok(stats.gantt.unknownIsActivity,'unknown-client code is not an employer record');

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
