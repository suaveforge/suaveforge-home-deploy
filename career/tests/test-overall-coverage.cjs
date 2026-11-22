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
const nodes=new Map(),el=id=>{
 if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,
 addEventListener(){},querySelectorAll(){return []},scrollIntoView(){},focus(){},reset(){}});
 return nodes.get(id);
};
const fixedDate=class extends Date{
 constructor(...args){super(...(args.length?args:['2026-11-22T03:00:00Z']))}
 static now(){return new Date('2026-11-22T03:00:00Z').valueOf()}
};
const ctx={document:{getElementById:el},localStorage:{getItem(){return null},setItem(){}},
 fetch:async()=>({ok:true,json:async()=>data}),
 Date:fixedDate,Intl,setTimeout,clearTimeout,console,URL,Blob,Math,Set,Map,Array,Object,String,Number,
 alert(){},confirm(){return true}};
const js=block[1].replace('main();\n})();',`globalThis.__careerTimelineTest={timelineBuild,timelineGroups,renderTimeline,allRows};\nmain();\n})();`);
assert.notEqual(js,block[1],'instrument timeline functions');
vm.runInNewContext(js,ctx,{timeout:3000,filename:'career/index.html'});
setImmediate(()=>{
 const api=ctx.__careerTimelineTest;assert.ok(api,'timeline API exposed');
 const list=api.timelineBuild();
 const counts={insurance:0,freelance:0,git:0,project:0,gap:0};
 for(const item of list)counts[item.type]++;
 assert.equal(list.length,214,'2009 Feb to Nov 2026 inclusive 214 months');
 assert.equal(counts.insurance,162,'nine insured employers cover 162 unique months');
 assert.equal(counts.freelance,19,'self-attested freelance 19 months');
 assert.equal(counts.git,3,'KIMSE September-November commit months');
 assert.equal(counts.project,0,'no extra dated rows outside baseline at load');
 assert.equal(counts.gap,30,'six gap groups total 30 months');
 const gaps=api.timelineGroups(list,'gap');
 assert.equal(gaps.map(x=>x.start+'~'+x.end+':'+x.length).join('|'),
  '2018-12~2019-01:2|2021-08~2021-08:1|2022-05~2022-06:2|2023-01~2023-06:6|2025-02~2026-08:19');
 const pre=list.find(x=>x.ym==='2025-08');assert.equal(pre.type,'gap');assert.ok(pre.hints.length,'portfolio hint in gap is not counted as performed month');
 assert.equal(list.find(x=>x.ym==='2016-08').type,'insurance','2-day uninsured gap inside August does not create full month gap');
 assert.equal(list.find(x=>x.ym==='2026-11').type,'git');
 assert.ok(el('timelineKpis').innerHTML.includes('184'),'184 linked months in summary');
 assert.ok(el('timelineKpis').innerHTML.includes('30'),'30 unlinked months in summary');
 assert.equal((el('timelineYearList').innerHTML.match(/class="timeline-year"/g)||[]).length,18);
 assert.equal((el('timelineYearList').innerHTML.match(/data-timeline-month=/g)||[]).length,214);
 assert.equal((el('timelineGapList').innerHTML.match(/data-gap-start=/g)||[]).length,6);
 assert.ok(el('timelineYearList').innerHTML.indexOf('data-timeline-month="2009-02"')<el('timelineYearList').innerHTML.indexOf('data-timeline-month="2026-11"'));
 assert.equal((el('fields').innerHTML.match(/<article class="field">/g)||[]).length,9,'unchanged field cards');
 assert.ok(el('fields').innerHTML.includes('88 / 120개월'),'web progress remains intact');
 console.log('CAREER_OVERALL_TIMELINE_214_MONTHS_184_LINKED_30_UNLINKED_6_GROUPS_PASS');
});
