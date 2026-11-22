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
 if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,
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
  {id:'test-5',company:'<img src=x onerror=alert(1)>',project:'HTML 주입',work:'검증',categories:['AI 개발'],start:'',end:''}
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
vm.runInNewContext(block[1],ctx,{timeout:3000,filename:'career/index.html'});
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
 assert.ok(web.includes('확인 중'),'unconfirmed sources are distinguished');
 assert.ok(web.includes('MetaFastest')&&web.includes('MetaCross'),'two freelance clients with same two-character abbreviation must both remain');
 const ai=field('AI 개발');
 assert.ok(ai.includes('>테스</span>')&&ai.includes('>알파</span>'),'dynamic local tasks displayed');
 assert.equal((ai.match(/>테스<\/span>/g)||[]).length,1,'same company only one badge');
 assert.ok(ai.includes('1 / 60개월'),'overlapping months not counted twice');
 assert.ok(ai.includes('>검토</span>'),'pending source displayed');
 assert.ok(!ai.includes('<img src=x onerror=alert(1)>'),'untrusted user text escaped');
 assert.ok(ai.includes('&lt;img src=x onerror=alert(1)&gt;'),'full company escaped in title');
 const blockchain=field('블록체인');
 assert.ok(blockchain.includes('기간 확정 경력 없음'),'empty confirmed category shown honestly');
 assert.ok(blockchain.includes('title="기간 미확정 · ZeroMax"'));
 assert.ok(blockchain.includes('title="기간 미확정 · MetaCross"'));
 assert.ok(html.includes('.field-source-tags{display:flex;flex-wrap:wrap'),'multiple badges wrap on narrow screens');
 console.log('CAREER_FIELD_SOURCE_CHIPS_9_FIELDS_MULTIPLE_EMPLOYERS_LOCAL_OVERRIDES_PASS');
});
