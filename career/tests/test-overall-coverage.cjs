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
 assert.equal(counts.freelance,0,'generic freelance umbrella has zero credited months');
 assert.equal(counts.git,3,'KIMSE September-November commit months');
 assert.equal(counts.project,29,'ZeroMax Aug plus 28 additional Github-confirmed project activity months');
 assert.equal(counts.gap,20,'20 months still without code or project assignment evidence');
 assert.equal(data.timeAxis.reconstructionCandidates.length,7,'seven candidate work streams retained as resources');
 assert.ok(data.timeAxis.reconstructionCandidates.every(c=>Array.isArray(c.activity)&&c.activity.length>0),'each has evidence checkpoints');
 assert.equal(data.projects.find(p=>p.id==='p16').start,null,'OnTheLive payment does not invent start date');
 assert.equal(data.projects.find(p=>p.id==='p12').start,null,'MetaFastest source video does not invent start date');
 assert.equal(data.projects.find(p=>p.id==='p15').start,null,'MetaCross license does not invent start date');
 assert.equal(list.find(x=>x.ym==='2024-09').type,'gap','umbrella freelance period not counted as dated project');
 assert.equal(list.find(x=>x.ym==='2023-07').type,'project','3D customizer July actual code month credited, umbrella not');
 assert.equal(list.find(x=>x.ym==='2023-08').type,'project','ZeroMax Upodium August 2023 marked as project performance');
 assert.equal(list.find(x=>x.ym==='2023-09').type,'project','Upodium WebGL art test Sept directly committed');
 assert.equal(data.projects.filter(x=>x.start==='2023-08'&&x.end==='2023-08').length,1,'single dated named project');
 const gaps=api.timelineGroups(list,'gap');
 assert.equal(gaps.map(x=>x.start+'~'+x.end+':'+x.length).join('|'),
  '2018-12~2019-01:2|2021-08~2021-08:1|2022-05~2022-06:2|2023-01~2023-06:6|2023-10~2023-11:2|2024-02~2024-03:2|2024-09~2024-09:1|2025-08~2025-11:4');
 const pre=list.find(x=>x.ym==='2025-08');assert.equal(pre.type,'gap');assert.ok(pre.hints.length,'portfolio hint in gap is not counted as performed month');
 assert.equal(list.find(x=>x.ym==='2016-08').type,'insurance','2-day uninsured gap inside August does not create full month gap');
 assert.equal(list.find(x=>x.ym==='2026-11').type,'git');
 for(const m of ['2024-01','2024-04','2024-05','2024-06','2024-07','2024-08','2024-10','2024-11','2024-12','2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08'])assert.equal(list.find(x=>x.ym===m).type,'project','actual coded month '+m+' is no longer a red gap');
 for(const m of ['2024-02','2024-03','2024-09','2025-08','2025-09','2025-10','2025-11'])assert.equal(list.find(x=>x.ym===m).type,'gap','unproven month '+m+' stays red');
 assert.equal(data.projects.filter(x=>x.verifiedCommitMonths).length,13,'thirteen documented git project segments with exact monthly source');
 for(const row of data.projects.filter(x=>x.verifiedCommitMonths))assert.ok(row.evidence?.some(e=>e.url?.startsWith('https://github.com/')),'Git source preserved for '+row.id);
 assert.ok(el('timelineKpis').innerHTML.includes('194'),'194 linked months in summary');
 assert.ok(el('timelineKpis').innerHTML.includes('20'),'20 unlinked months in summary');
 assert.equal((el('recoveryItems').innerHTML.match(/data-recovery-id=/g)||[]).length,7,'all recovery cards rendered');
 assert.ok(el('recoveryItems').innerHTML.includes('2022-11'),'MetaFastest first material date displayed');
 assert.ok(el('recoveryItems').innerHTML.includes('2023-08'),'ZeroMax task date displayed');
 assert.ok(el('recoveryItems').innerHTML.includes('2023-10'),'MetaCross invitation date displayed');
 assert.equal((el('timelineYearList').innerHTML.match(/class="timeline-year"/g)||[]).length,18);
 assert.equal((el('timelineYearList').innerHTML.match(/data-timeline-month=/g)||[]).length,214);
 assert.equal((el('timelineGapList').innerHTML.match(/data-gap-start=/g)||[]).length,8);
 assert.ok(el('timelineYearList').innerHTML.indexOf('data-timeline-month="2009-02"')<el('timelineYearList').innerHTML.indexOf('data-timeline-month="2026-11"'));
 assert.equal((el('fields').innerHTML.match(/<article class="field">/g)||[]).length,9,'unchanged field cards');
 assert.ok(el('fields').innerHTML.includes('89 / 120개월'),'web progress remains intact');
 console.log('CAREER_OVERALL_TIMELINE_214_MONTHS_194_LINKED_20_UNLINKED_8_GROUPS_PASS');
});
