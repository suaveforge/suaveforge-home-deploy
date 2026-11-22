'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'career/index.html'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'career/data.json'),'utf8'));
const block=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(block,'Career inline script exists');
const nodes=new Map();
const $=id=>{
 if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:id==='filter'?'all':'',hidden:false,
  addEventListener(){},querySelectorAll(){return []},setAttribute(){},
  scrollIntoView(){},focus(){}});
 return nodes.get(id);
};
const state={
 tasks:[
  {id:'test-1',company:'테스트회사',project:'AI 프로젝트',work:'검증',categories:['AI 개발'],start:'2026-10',end:'2026-10'},
  {id:'test-2',company:'테스트회사',project:'중복 기간',work:'검증',categories:['AI 개발'],start:'2026-10',end:'2026-10'},
  {id:'test-3',company:'알파회사',project:'같은 기간',work:'검증',categories:['AI 개발'],start:'2026-10',end:'2026-10'},
  {id:'test-4',company:'검토회사',project:'기간 확인중',work:'검증',categories:['AI 개발'],start:'',end:''},
  {id:'test-5',company:'<img src=x onerror=alert(1)>',project:'HTML 주입',work:'검증',categories:['AI 개발'],start:'',end:''},
  {id:'test-6',company:'테스트회사',project:'별도 미반영 AI 작업',work:'검증',categories:['AI 개발'],start:'',end:''}
 ],
 overrides:{}
};
const ctx={
 document:{getElementById:$},
 localStorage:{getItem:k=>k==='suaveforge:career:state:v2'?JSON.stringify(state):null,setItem(){}},
 fetch:async()=>({ok:true,json:async()=>data}),
 setTimeout,clearTimeout,console,URL,Blob,Date,Math,Set,Map,Array,Object,String,Number,
 alert(){},confirm(){return true}
};
const instrumented=block[1].replace('main();\n})();','globalThis.__careerShareTest={fieldEmployerContributions,careerMasterCompanies,fieldEmployerStates,allRows};\nmain();\n})();');
assert.notEqual(instrumented,block[1],'inject share calculation probes without altering page source');
vm.runInNewContext(instrumented,ctx,{timeout:3000,filename:'career/index.html'});
setImmediate(()=>{
 const result=$('fields').innerHTML;
 assert.equal((result.match(/<article class="field">/g)||[]).length,9,'retain all nine field cards');
 assert.equal((result.match(/<div class="track">/g)||[]).length,9,'retain every progress bar');
 const field=name=>{
  const begin=result.indexOf('<div class="name">'+name+'</div>');
  assert.ok(begin>=0,'field found: '+name);
  const end=result.indexOf('</article>',begin);
  return result.slice(begin,end);
 };
 const pc=field('PC 응용SW');
 assert.ok(pc.includes('>위메</span>'),'Wemade source');
 assert.ok(pc.includes('>넥슨</span>'),'Nexon source');
 assert.ok(pc.includes('>유비</span>'),'UbiFun source even when company has a slash');
 assert.ok(pc.includes('title="반영된 경력 · 넥슨GT"'),'full company is available on hover');
 const mobile=field('모바일 앱');
 for(const c of ['위메','유비','엔투','안드','네오','넥스','버드'])
  assert.ok(mobile.includes('>'+c+'</span>'),'keep all mobile source companies: '+c);
 const web=field('웹 개발');
 assert.ok(web.includes('>넥스</span>'),'confirmed Nexter');
 assert.ok(web.includes('>위메</span>'),'Wemade unconfirmed period');
 assert.ok(web.includes('<span class="field-source-label">미반영</span>'),'uncredited row is explicitly labeled');
 assert.ok(web.includes('class="field-source-chip pending" data-master-company="온더라이브"'),'OnTheLive is related web work without credited months');
 assert.ok(web.includes('title="미반영 · 해당 분야에 포함, 게이지 미등록 · 온더라이브"'),'OnTheLive remains period-unverified');
 assert.ok(!web.includes('class="field-source-chip unrelated" data-master-company="온더라이브"'),'OnTheLive must not show as not applicable for web');
 assert.ok(web.includes('89 / 120개월'),'OnTheLive does not fabricate any additional web months');
 assert.ok(web.includes('MetaFastest')&&web.includes('MetaCross'),'two freelance clients with same two-character abbreviation must both remain');
 assert.ok(web.includes('class="field-source-chip pending" data-master-company="프리랜서"'),'undated/generic freelance resources remain visible as uncredited');
 const freelanceSummary=shares=>shares.allRows().find(x=>x.rowId==='p19');
 assert.equal((ctx.__careerShareTest?.allRows?.()||[]).find(x=>x.rowId==='p19')?.status,'resource','generic 19 months kept as resource');
 assert.ok($('projects').innerHTML.includes('참고자료 · 게이지 0개월'),'project table explicitly marks excluded 19-month umbrella');
 const ai=field('AI 개발');
 assert.ok(ai.includes('>테스</span>')&&ai.includes('>알파</span>'),'dynamic local tasks displayed');
 assert.equal((ai.match(/title="반영된 경력 · 테스트회사 · 별도 미반영 작업 1건"/g)||[]).length,1,'same company appears once within credited row');
 assert.ok(ai.includes('1 / 60개월'),'overlapping months not counted twice');
 assert.ok(ai.includes('>검토</span>'),'uncredited source displayed');
 assert.equal((ai.match(/<span class="field-source-label">미반영<\/span>/g)||[]).length,1,'uncredited group exists once per field');
 assert.ok(ai.includes('별도 미반영 작업 1건'),'company with credited and unregistered work keeps pending task visible in tooltip');
 assert.ok(ai.includes('title="반영된 경력 · 테스트회사 · 별도 미반영 작업 1건"'),'credited company is classified once with pending detail');
 assert.equal((ai.match(/>테스<\/span>/g)||[]).length,1,'credited company is labeled once and has a percentage');
 assert.equal((ai.match(/<span class="field-chip-name">테스<\/span>/g)||[]).length,1,'one status per master company in this field');
 assert.ok(!ai.includes('<img src=x onerror=alert(1)>'),'untrusted user text escaped');
 assert.ok(ai.includes('&lt;img src=x onerror=alert(1)&gt;'),'full company escaped in title');
 const shares=ctx.__careerShareTest;
 assert.ok(shares,'company share calculations exposed in the test VM');
 const roster=shares.careerMasterCompanies(shares.allRows());
 assert.equal(roster.length,24,'20 source identities plus 4 locally added companies');
 const expectStates=(fieldName,counts)=>{
  const status=shares.fieldEmployerStates(shares.allRows(),fieldName,roster);
  assert.equal(status.total,24);
  assert.deepEqual(
   [status.credited.length,status.uncredited.length,status.unrelated.length].join(','),
   counts.join(','),'every company classified once across three states in '+fieldName);
  const markup=field(fieldName);
  const ids=[...markup.matchAll(/data-master-company="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,roster.length,'every master employer displayed, '+fieldName);
  assert.equal(new Set(ids).size,roster.length,'no repeated employer in three groups, '+fieldName);
  assert.ok(markup.includes('<span class="field-source-label">해당 X</span>'));
  assert.ok(markup.includes('<span class="field-source-label">반영</span>'));
  assert.ok(markup.includes('<span class="field-source-label">미반영</span>'));
 };
 expectStates('PC 응용SW',[3,0,21]);
 expectStates('웹 개발',[10,4,10]);
 expectStates('AI 개발',[2,2,20]);
 expectStates('블록체인',[0,2,22]);
 for(const f of data.fields)expectStates(f.name,
  [shares.fieldEmployerStates(shares.allRows(),f.name,roster).credited.length,
   shares.fieldEmployerStates(shares.allRows(),f.name,roster).uncredited.length,
   shares.fieldEmployerStates(shares.allRows(),f.name,roster).unrelated.length]);
 assert.ok(pc.includes('class="field-source-chip unrelated" data-master-company="온더라이브"'),'OnTheLive stays unrelated in PC unless specifically classified');
 const pcShare=shares.fieldEmployerContributions(shares.allRows(),'PC 응용SW');
 assert.equal(pcShare.total,69,'PC field unique credited months unchanged');
 assert.equal(pcShare.entries.length,3,'NexonGT and UbiFun credited by correct separate employment months');
 assert.equal(Array.from(pcShare.entries,x=>x.percent).join(','),'63.8,34,2.2');
 assert.equal(pcShare.entries.reduce((a,x)=>a+x.percent,0).toFixed(1),'100.0');
 assert.ok(pc.includes('class="field-share-track"'),'PC shows stacked employer progress');
 assert.ok(pc.includes('63.8%')&&pc.includes('34.0%')&&pc.includes('2.2%'),'employer chips show weighted percentages');
 assert.ok(pc.includes('중복되는 월은 회사별로 균등 분배'),'overlap policy clearly communicated');
 const pcWidths=[...pc.matchAll(/class="field-share-segment" style="width:([\d.]+)%/g)]
  .map(x=>Number(x[1]));
 assert.equal(pcWidths.length,3);
 assert.ok(Math.abs(pcWidths.reduce((a,b)=>a+b,0)-100)<0.001,'segments fill exactly the full credited share');
 const mobileShares=shares.fieldEmployerContributions(shares.allRows(),'모바일 앱');
 assert.equal(mobileShares.total,95,'existing mobile monthly count preserved');
 assert.equal(mobileShares.entries.length,8,'eight mobile employer sources include separate UbiFun and UbiFunStudio periods');
 assert.equal(mobileShares.entries.reduce((a,x)=>a+x.percent,0).toFixed(1),'100.0');
 const aiShare=shares.fieldEmployerContributions(shares.allRows(),'AI 개발');
 assert.equal(aiShare.total,1,'three local projects in the same month count once');
 assert.equal(Array.from(aiShare.entries,x=>x.percent).join(','),'50,50','repeated task from one employer does not inflate share');
 assert.equal(aiShare.entries.reduce((a,x)=>a+x.percent,0),100);
 assert.ok(ai.includes('50.0%'),'local added work is included in company share bar');
 const blockchain=field('블록체인');
 assert.ok(blockchain.includes('기간 확정 경력 없음'),'empty confirmed category shown honestly');
 assert.ok(!blockchain.includes('class="field-share-track"'),'no false share visualization when credited months are zero');
 assert.ok(blockchain.includes('title="미반영 · 해당 분야에 포함, 게이지 미등록 · ZeroMax"'));
 assert.ok(blockchain.includes('title="미반영 · 해당 분야에 포함, 게이지 미등록 · MetaCross"'));
 assert.equal((result.match(/<span class="field-source-label">미반영<\/span>/g)||[]).length,9,'uncredited group shown in all nine fields, even when empty');
 assert.ok(pc.includes('미반영 경력 없음'),'no fabricated uncredited companies');
 assert.ok(html.includes('.field-source-tags{display:flex;flex-wrap:wrap'),'multiple badges wrap on narrow screens');
 console.log('CAREER_FIELD_SOURCE_CHIPS_9_FIELDS_MULTIPLE_EMPLOYERS_LOCAL_OVERRIDES_PASS');
});
