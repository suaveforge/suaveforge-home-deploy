'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'career/index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'career/data.json'),'utf8'));
assert.equal(data.version,19);
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
 'globalThis.__careerQA={getAxis:()=>axis,allRows,careerMasterCompanies,fieldEmployerContributions,careerCreditedMonths,careerProgressBand,renderFields,companyGanttModel,ganttActivityGroups};\nmain();\n})();');
assert.notEqual(source,block[1],'test harness hook exists');
vm.runInNewContext(source,ctx,{timeout:5000});
setImmediate(()=>{
 const qa=ctx.__careerQA;assert.ok(qa);
 for(const [n,color,band] of [
  [0,'#c45152','5년 미만'],[59,'#c45152','5년 미만'],
  [60,'#c88b37','5년 이상 · 10년 미만'],[119,'#c88b37','5년 이상 · 10년 미만'],
  [120,'#267a9d','10년 이상 · 15년 미만'],[179,'#267a9d','10년 이상 · 15년 미만'],
  [180,'#18845b','15년 이상'],[240,'#18845b','15년 이상']
 ]){
  assert.equal(qa.careerProgressBand(n).color,color,n+' months uses the correct 5/10/15-year progress color');
  assert.equal(qa.careerProgressBand(n).label,band,n+' months uses the correct duration description');
 }
 const current=()=>el('fields').innerHTML;
 const field=name=>{
  const html=current(),begin=html.indexOf('<div class="name">'+name+'</div>');
  assert.ok(begin>=0,'field exists: '+name);
  return html.slice(begin,html.indexOf('</article>',begin));
 };
 const masters=qa.careerMasterCompanies(qa.allRows());
 assert.equal(masters.length,14,'nine original legal-company identities plus course, paid client and two unpaid sources');
 assert.equal(masters.slice(0,9).map(x=>x.company).join('|'),
 data.timeAxis.insurance.map(x=>x.company).join('|'));
 assert.equal(masters[9].company,'알지오');
 assert.equal(masters[10].company,'온더라이브');
 assert.equal(masters[11].company,'ZeroMax');
 assert.equal(masters[12].company,'U.Podium');
 assert.equal(masters[13].company,'MetaCross');
 assert.deepEqual(data.timeAxis.insurance.filter(x=>['넥슨GT','유비펀','유비펀스튜디오'].includes(x.company)).map(x=>x.company),['넥슨GT','유비펀','유비펀스튜디오'],'original insurer legal entity names preserved');
 assert.deepEqual(data.timeAxis.companyGroups[0].insuranceCompanyNames,['넥슨GT','유비펀','유비펀스튜디오'],'one grouped work-history source');
 assert.deepEqual(data.timeAxis.unpaidActivityCompanies.map(x=>x.company),['ZeroMax','U.Podium'],'MetaFastest and U.Podium one service identity, MetaCross separate undated candidate');
 const expected={'웹 개발':[103,120],'모바일 앱':[96,192],'PC 응용SW':[92,180],
  '서버 개발':[87,156],'DB 개발':[55,156],'백엔드':[87,120],
  'PM / 조직 리딩':[42,120],'AI 개발':[0,60],'블록체인':[6,60]};
 assert.equal((current().match(/<article class="field">/g)||[]).length,10);
 assert.ok(field('교육·강의').includes('>9개월</b>'),'separate nine-month education history');
 assert.ok(field('교육·강의').includes('경력 기준 미설정'),'no invented procurement eligibility threshold');
 assert.ok(!field('교육·강의').includes('9 / 0개월'),'no fake zero target');
 assert.ok(field('교육·강의').includes('title="알지오 · 9개월"'),'ALZIO source month labeled');
 assert.ok(!field('웹 개발').includes('title="알지오 · 9개월"'),'education does not inflate web development months');
 for(const [name,[months,target]] of Object.entries(expected)){
  const markup=field(name);
  assert.ok(markup.includes(months+' / '+target+'개월'),name+' includes dated ZeroMax and U.Podium irrespective of remuneration');
  const band=qa.careerProgressBand(months);
  assert.ok(markup.includes('class="fill" data-career-duration-band='),'all target-based fields have an annotated bar');
  assert.ok(markup.includes('background:'+band.color),'progress color follows credited months in '+name);
  assert.ok(markup.includes('title="'+band.label+'" role="progressbar"'),'field progress band is discoverable and accessible');
  const ids=[...markup.matchAll(/data-master-company="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,14,name+' retains all thirteen original company identities');
  assert.equal(new Set(ids).size,14,name+' shows each company exactly once');
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
 assert.equal(data.projects.length,60,'prior 59 project records preserved plus verified U.Podium mobile app');
 const mobileU=data.projects.find(p=>p.id==='p60');
 assert.ok(mobileU&&mobileU.company==='U.Podium'&&mobileU.start==='2024-04'&&mobileU.end==='2024-04');
 assert.deepEqual(mobileU.categories,['모바일 앱']);
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p60')).length,1,'U.Podium app directly committed one documented month');
 assert.equal(qa.fieldEmployerContributions(qa.allRows(),'모바일 앱').total,96,'existing 95 mobile months plus verified U.Podium April work');
 assert.equal(data.projects.find(p=>p.id==='p49').company,'U.Podium','U.Podium Sep 2023 to Jun 2024 separate from MetaCross later project');
 const gameHiWeb=data.projects.find(p=>p.id==='p59');
 assert.ok(gameHiWeb,'GameHi web work is recorded');
 assert.equal(gameHiWeb.company,'넥슨GT','GameHi web work retains original insurance entity');
 assert.deepEqual(gameHiWeb.categories,['웹 개발'],'web work does not alter PC classification');
 assert.equal(gameHiWeb.start,'2013-05');
 assert.equal(gameHiWeb.end,'2013-06');
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p59')).length,2,
  'GameHi web work adds two verified employment calendar months');
 assert.equal(qa.fieldEmployerContributions(qa.allRows(),'웹 개발').total,103,
  'web gauge counts GameHi May-Jun without double-counting');
 assert.equal(qa.fieldEmployerContributions(qa.allRows(),'웹 개발').entries.find(x=>x.company==='넥슨GT')?.rawMonths,2,
  'GameHi now appears in reflected web-company contributions');
 const gameHi=data.projects.find(p=>p.id==='p05');
 assert.ok(gameHi.evidence.some(e=>e.type==='user_confirmed_continuous_maintenance'),'GameHi maintenance work verified by user');
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p05')).length,2,'GameHi full 2 employment months already credited');
 const ubiFunMaintenance=data.projects.find(p=>p.id==='p57');
 assert.ok(ubiFunMaintenance&&ubiFunMaintenance.company==='유비펀');
 assert.equal(ubiFunMaintenance.start,'2013-06');
 assert.equal(ubiFunMaintenance.end,'2016-01');
 assert.deepEqual(ubiFunMaintenance.categories,['PC 응용SW']);
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p57')).length,32,'UbiFun maintenance spans 32 employment calendar months');
 const studioMaintenance=data.projects.find(p=>p.id==='p58');
 assert.equal(studioMaintenance.company,'유비펀스튜디오','original studio legal source remains intact');
 assert.equal(studioMaintenance.start,'2016-02');
 assert.equal(studioMaintenance.end,'2016-08');
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p58')).length,7,'seven studio PC maintenance calendar months');
 const pcContributions=qa.fieldEmployerContributions(qa.allRows(),'PC 응용SW');
 for(const [name,months] of [['넥슨GT',2],['유비펀',32],['유비펀스튜디오',7]]){
  assert.equal(pcContributions.entries.find(x=>x.company===name)?.rawMonths,months,
   name+' keeps an independent confirmed PC-game-maintenance share');
  assert.ok(field('PC 응용SW').includes('title="'+name+' · '+months+'개월"'),
   name+' has its own credited source chip');
 }
 assert.equal(pcContributions.total,92,'restoring legal company shares does not change distinct career months');
 assert.ok(field('PC 응용SW').includes('data-master-company="넥슨gt"') &&
  field('PC 응용SW').includes('data-master-company="유비펀"') &&
  field('PC 응용SW').includes('data-master-company="유비펀스튜디오"'),
  'three company badges remain separate although maintenance is continuous');
 assert.ok(Math.abs(pcContributions.entries.reduce((n,x)=>n+x.percent,0)-100)<.0001,
  'same-month GameHi-to-UbiFun transition is distributed without counting an extra month');
 const wemadeMaint=data.projects.find(p=>p.id==='p56');
 assert.equal(wemadeMaint.company,'위메이드');
 assert.equal(wemadeMaint.start,'2009-02');
 assert.equal(wemadeMaint.end,'2013-04');
 assert.deepEqual(wemadeMaint.categories,['PC 응용SW']);
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(p=>p.id==='p56')).length,51,'Wemade PC maintenance spans 51 employment calendar months');
 assert.equal(qa.fieldEmployerContributions(qa.allRows(),'PC 응용SW').total,92,'PC includes full UbiFun group through August 2016');
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
 assert.equal(activityGroups.length,7,'art test merged into U.Podium, no duplicate company-style row');
 assert.deepEqual(activityGroups.map(x=>x.id).join('|'),'upodium|zeromax|metacross|multiasset|investment|suaveforge|unknown');
 assert.ok(gh.indexOf('data-gantt-activity="upodium"')<gh.indexOf('data-gantt-activity="zeromax"')&&gh.indexOf('data-gantt-activity="zeromax"')<gh.indexOf('data-gantt-activity="metacross"'),'rendered rows follow U.Podium, ZeroMax, MetaCross order');
 assert.equal((gh.match(/data-gantt-activity=/g)||[]).length,7,'one U.Podium row combines art test and game development');
 assert.ok(gh.includes('data-gantt-activity="zeromax"')&&gh.includes('data-gantt-activity="multiasset"'),'unpaid source types displayed');
 assert.ok(!gh.includes('data-gantt-activity="arttest"')&&gh.includes('투자전략 대시보드'),'art test is not an independent Gantt row');
 const up=activityGroups.find(x=>x.id==='upodium');
 assert.ok(up.projects.includes('p26')&&up.projects.includes('p49'),'U.Podium art test evidence p26 preserved within U.Podium p49');
 assert.ok(up.months.has(2023*12+8),'September 2023 art test month retained once');
 assert.equal(up.window.start,'2022-11','MetaFastest earliest project material is visible before ZeroMax without adding work months');
 assert.equal(up.window.end,'2024-06');
 assert.ok(up.window.a<activityGroups.find(x=>x.id==='zeromax').window.a,'U.Podium footprint starts before ZeroMax evidence window');
 assert.equal(up.months.size,10,'early source window is never added to work months');
 assert.ok(gh.includes('data-activity-window="upodium"')&&gh.includes('data-activity-window="zeromax"'),'one continuous footprint per project');
 assert.equal((gh.match(/data-activity-window=/g)||[]).length,activityGroups.length,'exactly one coherent project timeline per row');
 assert.ok(gh.includes('초기 자료 2022.11 · 개발 확인 10개월'),'label separates document start and verified work months');
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
 assert.equal(zm.intervals.map(x=>x.start+'~'+x.end).join('|'),'2023-02~2023-03|2023-05~2023-08','only evidence-backed ZeroMax months are colored');
 assert.equal(zm.gaps.map(x=>x.start+'~'+x.end).join('|'),'2023-04~2023-04','April 2023 remains pale and uncredited within the connected bar');
 assert.equal(zm.window.start,'2023-02');
 assert.equal(zm.window.end,'2023-08');
 assert.ok(gh.includes('data-activity-window="metacross"'),'MetaCross has one continuous confirmed activity footprint');
 assert.ok(gh.includes('data-activity-gap="zeromax"'),'April gap gets dashed connector');
 assert.ok(gh.includes('data-activity-clue="upodium"'),'early MetaFastest sources appear as uncredited markers');
 assert.equal((gh.match(/data-activity-gap=/g)||[]).length,activityGroups.reduce((n,x)=>n+x.gaps.length,0),'each noncontiguous gap linked consistently');
 assert.ok(gh.includes('ZeroMax · 2023.02~2023.03')&&gh.includes('ZeroMax · 2023.05~2023.08'),'only verified intervals appear in solid purple');
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
 assert.ok(gh.includes('data-gantt-activity="metacross"'),'MetaCross now has a dated activity row');
 const mcGroup=activityGroups.find(x=>x.id==='metacross');
 assert.equal(mcGroup?.intervals.map(x=>x.start+'~'+x.end).join('|'),'2023-10~2024-03');
 assert.ok(gh.includes('MetaCross · 카지노 개발 · 2023.10~2024.03'));
 assert.equal(qa.careerCreditedMonths(qa.allRows().find(x=>x.rowId==='p15')).length,6);
 assert.equal((gh.match(/data-gantt-undated=/g)||[]).length,0,'MetaCross confirmed period no longer undated');
 assert.ok(!gh.includes('data-gantt-undated="MC"'),'MetaCross no duplicate undated row');
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
 assert.ok(web.includes('103 / 120개월'),'web gauge includes GameHi May-Jun work plus existing employers');
 assert.ok(web.includes('class="field-source-chip credited" data-master-company="넥슨gt"'),
  'GameHi appears as a reflected company, not unrelated');
 assert.ok(web.includes('title="넥슨GT · 2개월"'),
  'GameHi web experience is two months');
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
 assert.ok(web.includes('title="유비펀 · 9개월"')&&web.includes('title="유비펀스튜디오 · 7개월"'),
  'web development shows each company period independently');
 assert.ok(web.includes('data-master-company="유비펀스튜디오"')&&web.includes('data-master-company="넥슨gt"'),
  'all three legal companies remain separate as source identities');
 assert.ok(web.includes('data-master-company="온더라이브"')&&web.includes('title="온더라이브 · 5개월 · 유급 · 2024.06~10"'),'paid client shown in reflected field');
 assert.ok(!web.includes('field-paid-note')&&!web.includes('KOSA 공식 증빙 별도'),'unnecessary bureaucratic note not shown');
 assert.equal(field('AI 개발').includes('0 / 60개월'),true,'local non-employer must not create credited history');
 assert.ok(el('projects').innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'),'table escapes unsafe local company input');
 const rows=qa.allRows();
 assert.equal(rows.find(x=>x.rowId==='p15')?.status,'linked');
 assert.ok(field('블록체인').includes('6 / 60개월'));
 assert.ok(field('웹 개발').includes('data-master-company="metacross" title="MetaCross · 6개월"'));
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
 assert.equal(rows.find(x=>x.rowId==='p57')?.status,'linked','continuous UbiFun PC maintenance is reflected');
 assert.equal(rows.find(x=>x.rowId==='p58')?.status,'linked','continuous UbiFunStudio PC maintenance is reflected');
 assert.equal(rows.find(x=>x.rowId==='p59')?.status,'linked','GameHi web activity is reflected without affecting PC maintenance');
 assert.ok(el('projects').innerHTML.includes('개발활동 확인 · 경력 증빙 대기'));
 assert.ok(el('projects').innerHTML.includes('참고자료 · 게이지 0개월'),'old umbrella still excluded');
 assert.ok(!current().includes('멀티에셋 트레이더'),'project name removed from company share chart');
 const pay=qa.getAxis().verifiedPaidEngagements;
 pay.push({company:'ZeroMax',start:'2023-02',end:'2023-08',verified:true,proofType:'paid_contract_or_payment'});
 qa.renderFields();
 assert.ok(field('웹 개발').includes('103 / 120개월'),'pay flag must not change already reflected dated work');
 assert.ok(field('웹 개발').includes('data-master-company="zeromax"'));
 const distribution=qa.fieldEmployerContributions(qa.allRows(),'웹 개발');
 assert.equal(distribution.total,103,'source shares use same distinct months as gauge');
 assert.equal(distribution.entries.find(x=>x.company==='넥슨GT')?.rawMonths,2,
  'GameHi retained in web shares after paid-source test');
 assert.equal(distribution.entries.find(x=>x.company==='ZeroMax').rawMonths,5);
 assert.equal(distribution.entries.find(x=>x.company==='U.Podium').rawMonths,10);
 assert.ok(Math.abs(distribution.entries.reduce((sum,x)=>sum+x.percent,0)-100)<0.00001,'shared months allocated once');
 assert.ok(field('웹 개발').includes('background:#8c959f'),'unpaid contributors also receive gray percentage segments');
 pay.pop();qa.renderFields();
 assert.ok(field('웹 개발').includes('103 / 120개월'),'dated unpaid work and GameHi both remain reflected regardless of pay flag');
 console.log('CAREER_INSURANCE_PAID_GATED_9_FIELDS_54_RECORDS_PASS');
});
