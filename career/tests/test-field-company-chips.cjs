'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'career/index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'career/data.json'),'utf8'));
assert.equal(data.version,14);
assert.deepEqual(data.timeAxis.verifiedPaidEngagements,[],'no paid contract is automatically proven');
const block=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(block);
const elements=new Map(),el=id=>{
 if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:id==='filter'?'all':'',hidden:false,
  addEventListener(){},querySelectorAll(){return []},setAttribute(){},scrollIntoView(){},focus(){},reset(){}});
 return elements.get(id);
};
const localState={tasks:[{id:'unverified-local',company:'<img src=x onerror=alert(1)>',project:'test work',work:'test',start:'2026-10',end:'2026-10',categories:['AI 개발']}],overrides:{}};
const ctx={document:{getElementById:el},localStorage:{getItem:k=>k==='suaveforge:career:state:v2'?JSON.stringify(localState):null,setItem(){}},
 fetch:async()=>({ok:true,json:async()=>data}),setTimeout,clearTimeout,console,URL,Blob,Date,Intl,Math,Set,Map,Array,Object,String,Number,
 alert(){},confirm(){return true}};
const source=block[1].replace('main();\n})();',
 'globalThis.__careerQA={getAxis:()=>axis,allRows,careerMasterCompanies,fieldEmployerContributions,careerCreditedMonths,renderFields,companyGanttModel,ganttActivityGroups};\nmain();\n})();');
assert.notEqual(source,block[1],'test harness hook exists');
vm.runInNewContext(source,ctx,{timeout:5000});
setImmediate(()=>{
 const qa=ctx.__careerQA;assert.ok(qa);
 const current=()=>el('fields').innerHTML;
 const field=name=>{
  const html=current(),begin=html.indexOf('<div class="name">'+name+'</div>');
  assert.ok(begin>=0,'field exists: '+name);
  return html.slice(begin,html.indexOf('</article>',begin));
 };
 const masters=qa.careerMasterCompanies(qa.allRows());
 assert.equal(masters.length,9,'nine insurance employers only');
 assert.equal(masters.map(x=>x.company).join('|'),data.timeAxis.insurance.map(x=>x.company).join('|'));
 const expected={'웹 개발':[82,120],'모바일 앱':[95,192],'PC 응용SW':[69,180],
  '서버 개발':[82,156],'DB 개발':[50,156],'백엔드':[82,120],
  'PM / 조직 리딩':[42,120],'AI 개발':[0,60],'블록체인':[0,60]};
 assert.equal((current().match(/<article class="field">/g)||[]).length,9);
 for(const [name,[months,target]] of Object.entries(expected)){
  const markup=field(name);
  assert.ok(markup.includes(months+' / '+target+'개월'),name+' counts only insured/verified work');
  const ids=[...markup.matchAll(/data-master-company="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,9,name+' has exactly nine employer labels');
  assert.equal(new Set(ids).size,9,name+' labels each employer once');
  assert.deepEqual(ids.slice().sort().join('|'),masters.map(x=>x.id).sort().join('|'),name+' stable employer master');
  if(months){
   const chart=qa.fieldEmployerContributions(qa.allRows(),name);
   assert.equal(chart.total,months,name+' company totals match actual credited months');
   assert.ok(Math.abs(chart.entries.reduce((n,x)=>n+x.percent,0)-100)<0.00001);
  }
 }
 const gh=el('ganttBoard').innerHTML;
 assert.equal((gh.match(/data-gantt-company=/g)||[]).length,9,'all nine insured companies in the Gantt');
 assert.ok(gh.includes('2009.02.16 ~ 2013.04.30'),'Wemade exact dates');
 assert.ok(gh.includes('2016.08.19')&&gh.includes('2016.08.22'),'Studio/N2 exact transition');
 assert.ok(el('ganttKpis').innerHTML.includes('162개월'),'monthly overlap deduplicated');
 assert.ok(el('ganttCaption').textContent.includes('실제 날짜 겹침 0구간'),'no fabricated overlapping days');
 assert.ok(el('ganttCaption').textContent.includes('같은 달에 회사가 바뀐 사례 3개월'),'three calendar-month transitions');
 assert.ok(el('ganttCaption').textContent.includes('회사 사이 날짜 공백 5구간'),'five exact company-to-company gaps');
 assert.ok(el('ganttGaps').innerHTML.includes('2016.08.20 ~ 2016.08.21'),'2-day gap not lost in monthly buckets');
 assert.ok(el('ganttGaps').innerHTML.includes('2018.11.17 ~ 2019.02.17'),'93-day break');
 assert.equal((el('ganttGaps').innerHTML.match(/class="cg-gap"/g)||[]).length,7,'initial, interim and final uncovered slices');
 const activityGroups=qa.ganttActivityGroups(qa.companyGanttModel());
 assert.equal(activityGroups.length,7,'seven evidenced project/activity groups, not seven employers');
 assert.deepEqual(activityGroups.map(x=>x.id).join('|'),'zeromax|upodium|arttest|multiasset|investment|suaveforge|unknown');
 assert.equal((gh.match(/data-gantt-activity=/g)||[]).length,7,'display every evidenced group in a separate row');
 assert.ok(gh.includes('data-gantt-activity="zeromax"')&&gh.includes('data-gantt-activity="multiasset"'),'unpaid source types displayed');
 assert.ok(gh.includes('U.Podium 아트테스트')&&gh.includes('투자전략 대시보드'),'one-month activities retained');
 assert.ok(!gh.includes('cg-bar-label'),'no company or project name inside a progress bar');
 for(const group of activityGroups){
  assert.ok(gh.includes('data-gantt-activity="'+group.id+'"'),'all activity identities remain in left-hand name column');
 }
 for(const co of data.timeAxis.insurance){
  assert.ok(gh.includes('<strong>'+co.company+'</strong>'),'insured employer name restored in left-hand name column: '+co.company);
 }
 assert.equal((gh.match(/class="cg-bar activity"/g)||[]).length,activityGroups.reduce((n,g)=>n+g.intervals.length,0),
  'one segment per continuous evidenced range; no invented continuous employment');
 const zm=activityGroups.find(x=>x.id==='zeromax');
 assert.equal([...zm.months].sort((a,b)=>a-b).length,6,'ZeroMax: Feb, Mar, May-Aug, not April planning');
 assert.equal(zm.intervals.map(x=>x.start+'~'+x.end).join('|'),'2023-02~2023-08','ZeroMax short gap merged visually');
 assert.deepEqual(zm.visualGaps.join('|'),'2023-04','April is explicitly recorded as visually bridged, not independently proven');
 assert.ok(gh.includes('2023-04는 기록 공백을 차트에서만 연결'),'chart tooltip discloses displayed continuity without crediting April');
 assert.equal((gh.match(/data-gantt-activity="zeromax"/g)||[]).length,1);
 assert.equal((gh.match(/class="cg-bar activity"/g)||[]).length,activityGroups.reduce((n,g)=>n+g.intervals.length,0));
 const trader=activityGroups.find(x=>x.id==='multiasset');
 assert.equal(trader.intervals.map(x=>x.start+'~'+x.end).join('|'),
  '2024-01~2024-01|2024-04~2024-08|2024-10~2025-07|2025-12~2026-05|2026-07~2026-07',
  'do not fill documented gaps between trading project commits');
 assert.ok(trader.intervals.every(x=>new Date(x.a).toISOString().slice(0,7)===x.start),'starts exactly at first day of recorded month');
 assert.ok(trader.intervals.every(x=>new Date(x.b-86400000).toISOString().slice(0,7)===x.end),'ends exactly at last day of recorded month');
 assert.ok(!gh.includes('data-gantt-activity="메타크로스"'),'undated work not invented');
 const web=field('웹 개발');
 assert.ok(web.includes('개발활동 114개월 중 증빙대기 32개월'),'retains 32 project development months outside career count');
 for(const unknown of ['멀티에셋트레이더','발주처미확인','투자전략대시보드','upodium아트테스트','suaveforge','zeromax','테스트회사'])
  assert.ok(!current().toLowerCase().includes('data-master-company="'+unknown+'"'),'unverified identity never becomes an employer chip: '+unknown);
 assert.ok(web.includes('title="유비펀 · 9개월"')&&web.includes('title="유비펀스튜디오 · 7개월"'),'insured MORPG split retained');
 assert.equal(field('AI 개발').includes('0 / 60개월'),true,'local non-employer must not create credited history');
 assert.ok(el('projects').innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'),'table escapes unsafe local company input');
 const rows=qa.allRows();
 for(const id of ['p20','p26','p27','p29','p30','p35','p37','p49']){
  assert.equal(rows.find(x=>x.rowId===id)?.status,'resource','independent activity archived as non-credited: '+id);
 }
 assert.equal(rows.find(x=>x.rowId==='p53')?.status,'linked');
 assert.equal(rows.find(x=>x.rowId==='p54')?.status,'linked');
 assert.ok(el('projects').innerHTML.includes('개발활동 확인 · 경력 증빙 대기'));
 assert.ok(el('projects').innerHTML.includes('참고자료 · 게이지 0개월'),'old umbrella still excluded');
 assert.ok(!current().includes('멀티에셋 트레이더'),'project name removed from company share chart');
 const pay=qa.getAxis().verifiedPaidEngagements;
 pay.push({company:'ZeroMax',start:'2023-02',end:'2023-08',verified:true,proofType:'paid_contract_or_payment'});
 qa.renderFields();
 assert.ok(field('웹 개발').includes('87 / 120개월'),'verified paid company months can be credited after explicit evidence approval');
 assert.ok(field('웹 개발').includes('data-master-company="zeromax"'));
 pay.pop();qa.renderFields();
 assert.ok(field('웹 개발').includes('82 / 120개월'),'unverified client no longer counts');
 console.log('CAREER_INSURANCE_PAID_GATED_9_FIELDS_54_RECORDS_PASS');
});
