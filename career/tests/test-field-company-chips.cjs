'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'career/index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'career/data.json'),'utf8'));
assert.equal(data.version,15);
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
 assert.equal(masters.length,13,'nine insured, one paid course, OnTheLive, and two unpaid activity sources');
 assert.equal(masters.slice(0,9).map(x=>x.company).join('|'),data.timeAxis.insurance.map(x=>x.company).join('|'));
 assert.equal(masters[9].company,'알지오');
 assert.equal(masters[10].company,'온더라이브');
 assert.equal(masters[11].company,'ZeroMax');
 assert.equal(masters[12].company,'U.Podium');
 assert.deepEqual(data.timeAxis.unpaidActivityCompanies.map(x=>x.company),['ZeroMax','U.Podium'],'only requested two unpaid companies');
 const expected={'웹 개발':[101,120],'모바일 앱':[95,192],'PC 응용SW':[77,180],
  '서버 개발':[87,156],'DB 개발':[55,156],'백엔드':[87,120],
  'PM / 조직 리딩':[42,120],'AI 개발':[0,60],'블록체인':[0,60]};
 assert.equal((current().match(/<article class="field">/g)||[]).length,10);
 assert.ok(field('교육·강의').includes('>9개월</b>'),'separate nine-month education history');
 assert.ok(field('교육·강의').includes('경력 기준 미설정'),'no invented procurement eligibility threshold');
 assert.ok(!field('교육·강의').includes('9 / 0개월'),'no fake zero target');
 assert.ok(field('교육·강의').includes('title="알지오 · 9개월"'),'ALZIO source month labeled');
 assert.ok(!field('웹 개발').includes('title="알지오 · 9개월"'),'education does not inflate web development months');
 for(const [name,[months,target]] of Object.entries(expected)){
  const markup=field(name);
  assert.ok(markup.includes(months+' / '+target+'개월'),name+' includes dated ZeroMax and U.Podium irrespective of remuneration');
  const ids=[...markup.matchAll(/data-master-company="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,13,name+' retains all thirteen company-source identities');
  assert.equal(new Set(ids).size,13,name+' labels each source exactly once');
  assert.deepEqual(ids.slice().sort().join('|'),masters.map(x=>x.id).sort().join('|'),name+' stable employer master');
  if(months){
   const chart=qa.fieldEmployerContributions(qa.allRows(),name);
   assert.equal(chart.total,months,name+' company totals match actual credited months');
   assert.ok(Math.abs(chart.entries.reduce((n,x)=>n+x.percent,0)-100)<0.00001);
  }
 }
 const gh=el('ganttBoard').innerHTML;
 assert.ok(gh.includes('data-gantt-education="E01"'),'ALZIO teaching period appears as month-precision paid row');
 assert.ok(gh.includes('알지오 · 2013.07~2014.03 (유급 강의)'),'ALZIO short paid teaching tooltip');
 assert.equal((gh.match(/data-gantt-education=/g)||[]).length,1,'one paid teaching Gantt row');
 assert.equal(data.projects.length,56,'55 existing records preserved plus continuous Wemade PC game maintenance');
 const wemadeMaint=data.projects.find(p=>p.id==='p56');
 assert.equal(wemadeMaint.company,'위메이드');
 assert.equal(wemadeMaint.start,'2009-02');
 assert.equal(wemadeMaint.end,'2013-04');
 assert.deepEqual(wemadeMaint.categories,['PC 응용SW']);
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p56')).length,51,'Wemade PC maintenance spans 51 employment calendar months');
 assert.equal(qa.fieldEmployerContributions(qa.allRows(),'PC 응용SW').total,77,'PC gauge counts only seven additional, nonoverlapping months');
 assert.equal(qa.fieldEmployerContributions(qa.allRows(),'PC 응용SW').entries.find(x=>x.company==='위메이드').rawMonths,51,'Wemade PC contribution reflects full 2009-2013 employment');
 assert.ok(field('PC 응용SW').includes('title="위메이드 · 51개월"'),'Wemade full PC work duration shown in PC card');
 assert.equal(data.projects.find(x=>x.id==='p55').categories.join('|'),'교육·강의');
 assert.equal(data.timeAxis.userConfirmedPaidEducation[0].paymentReceiptVerified,false,'no fabricated payment receipt');
 assert.equal((gh.match(/data-gantt-company=/g)||[]).length,10,'nine insured plus one user-confirmed paid contractor; teaching separate');
 assert.ok(gh.includes('2009.02.16 ~ 2013.04.30'),'Wemade exact dates');
 assert.ok(gh.includes('2016.08.19')&&gh.includes('2016.08.22'),'Studio/N2 exact transition');
 assert.ok(el('ganttKpis').innerHTML.includes('167개월'),'162 insured plus 5 user-confirmed paid months, deduplicated');
 assert.ok(el('ganttKpis').innerHTML.includes('162개월'),'insurance months separately preserved');
 assert.ok(el('ganttCaption').textContent.includes('실제 날짜 겹침 0구간'),'no fabricated overlapping days');
 assert.ok(el('ganttCaption').textContent.includes('같은 달에 회사가 바뀐 사례 3개월'),'three calendar-month transitions');
 assert.ok(el('ganttCaption').textContent.includes('회사 사이 날짜 공백 6구간'),'five exact company-to-company gaps');
 assert.ok(el('ganttGaps').innerHTML.includes('2016.08.20 ~ 2016.08.21'),'2-day gap not lost in monthly buckets');
 assert.ok(el('ganttGaps').innerHTML.includes('2018.11.17 ~ 2019.02.17'),'93-day break');
 assert.equal((el('ganttGaps').innerHTML.match(/class="cg-gap"/g)||[]).length,8,'initial, interim and final uncovered slices after paid interval');
 assert.ok(gh.includes('id="ganttGuide"')&&gh.includes('id="ganttGuideDate"'),'hover date guide mounted');
 const activityGroups=qa.ganttActivityGroups(qa.companyGanttModel());
 assert.equal(activityGroups.length,6,'art test merged into U.Podium, no duplicate company-style row');
 assert.deepEqual(activityGroups.map(x=>x.id).join('|'),'zeromax|upodium|multiasset|investment|suaveforge|unknown');
 assert.equal((gh.match(/data-gantt-activity=/g)||[]).length,6,'one U.Podium row combines art test and game development');
 assert.ok(gh.includes('data-gantt-activity="zeromax"')&&gh.includes('data-gantt-activity="multiasset"'),'unpaid source types displayed');
 assert.ok(!gh.includes('data-gantt-activity="arttest"')&&gh.includes('투자전략 대시보드'),'art test is not an independent Gantt row');
 const up=activityGroups.find(x=>x.id==='upodium');
 assert.ok(up.projects.includes('p26')&&up.projects.includes('p49'),'U.Podium art test evidence p26 preserved within U.Podium p49');
 assert.ok(up.months.has(2023*12+8),'September 2023 art test month retained once');
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
 assert.ok(gh.includes('ZeroMax · 2023.02~2023.08 (4월 미확인)'),'ZeroMax compact tooltip identifies the visually bridged unverified month');
 assert.ok(gh.includes('위메이드 · 2009.02.16~2013.04.30'),'insured bar tooltip contains only company and exact dates');
 assert.ok(!gh.includes('월 단위 근거, 일자 미확정')&&!gh.includes('기록 공백을 차트에서만 연결')&&!gh.includes('월 걸침)'),'verbose native bar titles removed');
 assert.equal((gh.match(/data-gantt-activity="zeromax"/g)||[]).length,1);
 assert.equal((gh.match(/class="cg-bar activity"/g)||[]).length,activityGroups.reduce((n,g)=>n+g.intervals.length,0));
 const trader=activityGroups.find(x=>x.id==='multiasset');
 assert.equal(trader.intervals.map(x=>x.start+'~'+x.end).join('|'),
  '2024-01~2024-01|2024-04~2024-08|2024-10~2025-07|2025-12~2026-05|2026-07~2026-07',
  'do not fill documented gaps between trading project commits');
 assert.ok(trader.intervals.every(x=>new Date(x.a).toISOString().slice(0,7)===x.start),'starts exactly at first day of recorded month');
 assert.ok(trader.intervals.every(x=>new Date(x.b-86400000).toISOString().slice(0,7)===x.end),'ends exactly at last day of recorded month');
 assert.ok(!gh.includes('data-gantt-activity="메타크로스"'),'undated work not invented');
 assert.equal((gh.match(/data-gantt-undated=/g)||[]).length,1,'MetaCross remains undated; OnTheLive is now in verified-date rows');
 assert.ok(gh.includes('data-gantt-undated="MC"')&&gh.includes('>MetaCross</strong>'),'MetaCross unverified row remains');
 assert.ok(gh.includes('data-gantt-company="온더라이브"'),'paid OnTheLive has one dated employer row');
 assert.ok(gh.includes('data-gantt-user-period="OL2024"'),'single user-confirmed paid bar drawn');
 assert.ok(gh.includes('온더라이브 · 2024.06.09~2024.10.09 · 유급'),'short accurate tooltip');
 assert.ok(!gh.includes('data-git-activity="OL"')&&!gh.includes('cg-git-evidence'),'overlaid Git marker removed');
 assert.equal((gh.match(/data-gantt-user-period="OL2024"/g)||[]).length,1,'OnTheLive only one period bar');
 assert.ok(!gh.includes('data-gantt-undated="MF"'),'MetaFastest stays consolidated in U.Podium');
 const navy=data.projects.find(p=>p.id==='p16');
 assert.equal(navy.start,'2024-06');
 assert.equal(navy.end,'2024-10');
 assert.equal(navy.confirmedMinimumPeriod.start,'2024-06-09');
 assert.equal(navy.confirmedMinimumPeriod.end,'2024-10-09');
 assert.equal(navy.confirmedMinimumPeriod.monthCount,5);
 assert.equal(navy.confirmedMinimumPeriod.officialVerification,'pending');
 assert.equal(navy.confirmedGitActivity.firstCommit,'2024-08-09');
 assert.equal(navy.confirmedGitActivity.lastCommit,'2024-08-19');
 assert.equal(navy.paidConfirmedByUser,true,'paid status is user-confirmed');
 assert.equal(data.timeAxis.userConfirmedPaidEngagements[0].proofState,'documents_pending','paper verification stays separate');
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p16')).length,5,'five calendar-month internal credit');
  const web=field('웹 개발');
 assert.ok(web.includes('미반영 개발활동 14개월'),'dated ZeroMax/U.Podium activity resolves 14 web career months');
 assert.ok(web.includes('101 / 120개월'),'web gauge must include both unpaid companies');
 assert.equal((web.match(/class="field-source-chip credited unpaid"/g)||[]).length,2,'web shows exactly two unpaid company tags');
 assert.ok(web.includes('data-master-company="zeromax" title="ZeroMax · 5개월"'),'ZeroMax web development has five distinct dated months (February, May-August)');
 assert.ok(web.includes('data-master-company="u.podium" title="U.Podium · 10개월"'),'U.Podium shows ten documented months without double-counting September');
 assert.ok(web.includes('>제맥</span>')&&web.includes('>유포</span>'),'unpaid source names remain readable and concise');
 assert.ok(!web.includes('class="field-source-row unpaid"'),'no separate unpaid row is created');
 const creditedPart=web.slice(web.indexOf('<span class="field-source-label">반영</span>'),web.indexOf('<span class="field-source-label">미반영</span>'));
 assert.ok(creditedPart.includes('class="field-source-chip credited unpaid" data-master-company="zeromax"')&&
  creditedPart.includes('class="field-source-chip credited unpaid" data-master-company="u.podium"'),
  'gray ZeroMax and U.Podium are reflected career contributors, with percentage shares');
 const pendingPart=web.slice(web.indexOf('<span class="field-source-label">미반영</span>'),web.indexOf('<div class="field-source-row unrelated">'));
 assert.ok(!pendingPart.includes('class="field-source-chip credited unpaid"'),'dated unpaid companies must never appear in 미반영');
 assert.equal((web.match(/<span class="field-source-label">무급<\/span>/g)||[]).length,0,'no visible unpaid heading');
 assert.equal((field('PC 응용SW').match(/class="field-source-chip credited unpaid"/g)||[]).length,1,'PC field shows ZeroMax dated Unity code only');
 assert.ok(field('PC 응용SW').includes('data-master-company="zeromax" title="ZeroMax · 1개월"'),'PC dated evidence is March 2023 only');
 for(const category of ['모바일 앱','DB 개발','백엔드','블록체인','교육·강의']){
  const card=field(category);
  assert.ok(!card.includes('class="field-source-row unpaid"'),'no undated/unrelated company is mislabeled unpaid under '+category);
 }
 assert.ok(!web.includes('class="field-source-chip pending" data-master-company="zeromax"'),'ZeroMax verified work is reflected, not pending');
 assert.ok(!web.includes('class="field-source-chip pending" data-master-company="u.podium"'),'U.Podium is unpaid, not payment-pending');
 for(const unknown of ['멀티에셋트레이더','발주처미확인','투자전략대시보드','upodium아트테스트','suaveforge','테스트회사'])
  assert.ok(!current().toLowerCase().includes('data-master-company="'+unknown+'"'),'unverified identity never becomes an employer chip: '+unknown);
 assert.ok(web.includes('title="유비펀 · 9개월"')&&web.includes('title="유비펀스튜디오 · 7개월"'),'insured MORPG split retained');
 assert.ok(web.includes('data-master-company="온더라이브"')&&web.includes('title="온더라이브 · 5개월 · 유급 · 2024.06~10"'),'paid client shown in reflected field');
 assert.ok(!web.includes('field-paid-note')&&!web.includes('KOSA 공식 증빙 별도'),'unnecessary bureaucratic note not shown');
 assert.equal(field('AI 개발').includes('0 / 60개월'),true,'local non-employer must not create credited history');
 assert.ok(el('projects').innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'),'table escapes unsafe local company input');
 const rows=qa.allRows();
 for(const id of ['p24','p25','p26','p39','p42','p48','p49'])
  assert.equal(rows.find(x=>x.rowId===id)?.status,'linked','dated client work must be classified as reflected: '+id);
 assert.equal(qa.careerCreditedMonths(rows.find(x=>x.rowId==='p49')).length,10,'ten U.Podium months credited once');
 assert.equal(qa.careerCreditedMonths(rows.find(x=>x.rowId==='p42')).length,1,'ZeroMax March Unity counted for PC');
 for(const id of ['p20','p27','p29','p30','p35','p37']){
  assert.equal(rows.find(x=>x.rowId===id)?.status,'resource','independent activity archived as non-credited: '+id);
 }
 assert.equal(rows.find(x=>x.rowId==='p53')?.status,'linked');
 assert.equal(rows.find(x=>x.rowId==='p54')?.status,'linked');
 assert.equal(rows.find(x=>x.rowId==='p55')?.status,'linked','self-reported paid course recorded solely under education');
 assert.equal(rows.find(x=>x.rowId==='p56')?.status,'linked','continuous Wemade PC maintenance is reflected');
 assert.ok(el('projects').innerHTML.includes('개발활동 확인 · 경력 증빙 대기'));
 assert.ok(el('projects').innerHTML.includes('참고자료 · 게이지 0개월'),'old umbrella still excluded');
 assert.ok(!current().includes('멀티에셋 트레이더'),'project name removed from company share chart');
 const pay=qa.getAxis().verifiedPaidEngagements;
 pay.push({company:'ZeroMax',start:'2023-02',end:'2023-08',verified:true,proofType:'paid_contract_or_payment'});
 qa.renderFields();
 assert.ok(field('웹 개발').includes('101 / 120개월'),'pay flag must not change already reflected dated work');
 assert.ok(field('웹 개발').includes('data-master-company="zeromax"'));
 const distribution=qa.fieldEmployerContributions(qa.allRows(),'웹 개발');
 assert.equal(distribution.total,101,'source shares use same distinct months as gauge');
 assert.equal(distribution.entries.find(x=>x.company==='ZeroMax').rawMonths,5);
 assert.equal(distribution.entries.find(x=>x.company==='U.Podium').rawMonths,10);
 assert.ok(Math.abs(distribution.entries.reduce((sum,x)=>sum+x.percent,0)-100)<0.00001,'shared months allocated once');
 assert.ok(field('웹 개발').includes('background:#8c959f'),'unpaid contributors also receive gray percentage segments');
 pay.pop();qa.renderFields();
 assert.ok(field('웹 개발').includes('101 / 120개월'),'dated unpaid work remains reflected regardless of pay flag');
 console.log('CAREER_INSURANCE_PAID_GATED_9_FIELDS_54_RECORDS_PASS');
});
