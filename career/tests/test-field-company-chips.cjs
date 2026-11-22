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
 'globalThis.__careerQA={getAxis:()=>axis,allRows,careerMasterCompanies,fieldEmployerContributions,careerCreditedMonths,renderFields};\nmain();\n})();');
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
