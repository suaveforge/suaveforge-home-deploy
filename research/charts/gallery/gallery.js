/* SuaveForge Research · Live chart comparison: 5 actual engines × 4 category datasets.
 * Data is synthetic DEMO data only. Every vendor receives the exact same category data.
 * External scripts are pinned and loaded only on this gallery page. Failures remain isolated.
 */
(() => {
'use strict';
const COLORS=['#486ff0','#e18370','#3ca6a0','#8d7ada','#e7b65e','#577d9b'];
const INK='#50617a', GRID='#e8edf4';
const categories={
 trend:{label:'추세 · 선 그래프',title:'월별 활동 추세',description:'월별 변화의 방향과 속도를 비교합니다. 모든 엔진에 동일한 6개월·6개 값을 사용합니다.',unit:'건',labels:['3월','4월','5월','6월','7월','8월'],values:[18,24,31,29,42,48],hint:'월별 인정 활동 건수 · 가상 데이터'},
 bar:{label:'단계 · 막대 그래프',title:'6P 단계별 달성 인원',description:'동일한 6개 단계와 값을 사용해 수치 읽기·막대 간격·축 가독성을 비교합니다.',unit:'명',labels:['P1','P2','P3','P4','P5','P6'],values:[39,35,31,26,20,14],hint:'단계별 달성 인원 · 가상 데이터'},
 donut:{label:'구성비 · 도넛 차트',title:'활동 유형별 구성',description:'상호 배타적인 4개 활동 유형의 합계 100건을 동일하게 표시합니다. MIRAE 복수 연계 실적에는 이런 도넛을 적용하지 않습니다.',unit:'건',labels:['연구','교육','프로젝트','멘토링'],values:[35,25,24,16],hint:'중복 없는 유형별 구성 · 가상 데이터'},
 scatter:{label:'관계 · 산점도',title:'참여 시간과 성과의 관계',description:'8개 가상 관측치의 두 변수 관계를 동일한 축 범위로 비교합니다. 상관관계를 인과관계처럼 단정하지 않습니다.',unit:'점',labels:['A','B','C','D','E','F','G','H'],points:[{x:2,y:56},{x:3,y:62},{x:3.7,y:59},{x:4.5,y:75},{x:5,y:77},{x:6,y:81},{x:7,y:88},{x:8,y:90}],hint:'가상 데이터: x 참여 시간(h) · y 성과 점수(점)'}
};
const engines=[
{id:'echarts',name:'Apache ECharts',code:'EC',subtitle:'Apache 2.0 · Canvas',url:'https://echarts.apache.org/examples/en/index.html'},
{id:'chartjs',name:'Chart.js',code:'CJ',subtitle:'MIT · Canvas',url:'https://www.chartjs.org/docs/latest/samples/'},
{id:'plotly',name:'Plotly.js',code:'PL',subtitle:'MIT · SVG',url:'https://plotly.com/javascript/'},
{id:'vega',name:'Vega-Lite',code:'VG',subtitle:'BSD-3-Clause · Vega',url:'https://vega.github.io/vega-lite/examples/'},
{id:'d3',name:'D3.js',code:'D3',subtitle:'ISC · SVG',url:'https://observablehq.com/@d3/gallery'}
];
const scripts={
 echarts:['https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/echarts.min.js'],
 chartjs:['https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js'],
 plotly:['https://cdn.plot.ly/plotly-4.1.1.min.js'],
 vega:['https://cdn.jsdelivr.net/npm/vega@6.4.0/build/vega.min.js','https://cdn.jsdelivr.net/npm/vega-lite@6.5.0/build/vega-lite.min.js','https://cdn.jsdelivr.net/npm/vega-embed@7.3.0/build/vega-embed.min.js'],
 d3:['https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js']
};
const control=document.querySelector('[data-category-controls]');
const grid=document.querySelector('[data-live-grid]');
if(!control||!grid)return;
const title=document.querySelector('[data-category-title]');
const desc=document.querySelector('[data-category-description]');
const hint=document.querySelector('[data-category-hint]');
const table=document.querySelector('[data-sample-table]');
const statusEl=document.querySelector('[data-render-status]');
const loads=new Map(), instances=new Map(), buttons=new Map();
let active='trend',epoch=0,resizeTimer;
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadScript(src){
  if(loads.has(src))return loads.get(src);
  const p=new Promise((resolve,reject)=>{
   const el=document.createElement('script');el.src=src;el.async=false;el.crossOrigin='anonymous';
   const timer=setTimeout(()=>{el.remove();reject(Error('CDN 응답 시간 초과'))},18000);
   el.onload=()=>{clearTimeout(timer);resolve()};
   el.onerror=()=>{clearTimeout(timer);el.remove();reject(Error('라이브러리 로드 실패'))};
   document.head.appendChild(el);
  });
  loads.set(src,p);p.catch(()=>loads.delete(src));return p;
}
async function loadEngine(id){
  // Vega dependencies must load in this order; other engines can load concurrently.
  for(const src of scripts[id])await loadScript(src);
  const ready={echarts:()=>!!window.echarts,chartjs:()=>!!window.Chart,plotly:()=>!!window.Plotly,vega:()=>!!window.vegaEmbed,d3:()=>!!window.d3};
  if(!ready[id]())throw Error('라이브러리 초기화 확인 실패');
}
function dispose(){
  for(const [id,obj] of instances){try{
    if(id==='echarts')obj.dispose();
    if(id==='chartjs')obj.destroy();
    if(id==='plotly')window.Plotly?.purge(obj);
    if(id==='vega')obj.finalize();
  }catch(err){console.warn('Chart cleanup',id,err)}}
  instances.clear();
}
function state(id,value){const el=document.querySelector('[data-engine-state="'+id+'"]');if(!el)return;el.textContent=value==='ready'?'렌더링 완료':value==='error'?'로딩 실패':'준비 중';el.className='live-state'+(value==='ready'?' good':value==='error'?' bad':'');}
function fallback(root,message){root.replaceChildren();const wrap=document.createElement('div');wrap.className='chart-error';const p=document.createElement('span');p.textContent=message;const btn=document.createElement('button');btn.type='button';btn.textContent='다시 시도';btn.addEventListener('click',()=>drawOne(root.closest('[data-engine]').dataset.engine,epoch));wrap.append(p,btn);root.append(wrap)}
function renderECharts(root,c){
 const e=window.echarts.init(root,null,{renderer:'canvas'});
 let option={animation:true,grid:{left:42,right:20,top:23,bottom:39},tooltip:{trigger:c.points?'item':'axis'},textStyle:{fontFamily:'sans-serif',color:INK},color:COLORS,backgroundColor:'transparent'};
 if(active==='donut'){option={...option,tooltip:{trigger:'item',formatter:'{b}: {c}건 ({d}%)'},legend:{bottom:0,textStyle:{fontSize:10,color:INK}},series:[{type:'pie',radius:['50%','74%'],center:['50%','42%'],data:c.labels.map((name,i)=>({name,value:c.values[i]})),label:{show:false},itemStyle:{borderColor:'#fff',borderWidth:3}}]};}
 else if(active==='scatter'){option={...option,xAxis:{type:'value',min:0,max:10,name:'시간(h)',nameLocation:'middle',nameGap:29,splitLine:{lineStyle:{color:GRID}},axisLabel:{color:INK}},yAxis:{type:'value',min:0,max:100,name:'점수',splitLine:{lineStyle:{color:GRID}},axisLabel:{color:INK}},series:[{type:'scatter',symbolSize:12,data:c.points.map(p=>[p.x,p.y]),itemStyle:{color:COLORS[0]}}]};}
 else{option={...option,xAxis:{type:'category',data:c.labels,axisTick:{show:false},axisLine:{show:false},axisLabel:{color:INK,fontSize:11}},yAxis:{type:'value',min:0,max:active==='trend'?60:45,splitLine:{lineStyle:{color:GRID}},axisLabel:{color:INK}},series:[{name:c.title,type:active==='trend'?'line':'bar',smooth:active==='trend',symbol:'circle',symbolSize:8,barMaxWidth:29,data:c.values,areaStyle:active==='trend'?{opacity:.09}:undefined,lineStyle:{width:3},itemStyle:{borderRadius:active==='bar'?[5,5,0,0]:undefined}}]};}
 e.setOption(option);instances.set('echarts',e);
}
function renderChartJS(root,c){
 const canvas=document.createElement('canvas');root.append(canvas);
 const mode=active,labels=c.labels;
 const isDonut=mode==='donut',isScatter=mode==='scatter';
 const data=isScatter?{datasets:[{label:c.title,data:c.points,backgroundColor:COLORS[0],pointRadius:6,pointHoverRadius:8}]}:{labels,datasets:[{label:c.title,data:c.values,borderColor:COLORS[0],backgroundColor:isDonut?COLORS:isDonut?'':mode==='trend'?'rgba(72,111,240,.10)':COLORS[0],fill:mode==='trend',pointRadius:mode==='trend'?4:0,borderWidth:mode==='trend'?3:0,tension:.35,borderRadius:mode==='bar'?5:0,hoverOffset:isDonut?8:0}]};
 const options={responsive:true,maintainAspectRatio:false,animation:{duration:450},plugins:{legend:{display:isDonut,position:'bottom',labels:{boxWidth:11,color:INK,font:{size:10}}},tooltip:{enabled:true}},layout:{padding:{top:8,right:6,bottom:5,left:0}},scales:isDonut?{}:isScatter?{x:{type:'linear',min:0,max:10,title:{display:true,text:'시간(h)'},grid:{color:GRID},ticks:{color:INK}},y:{min:0,max:100,title:{display:true,text:'점수'},grid:{color:GRID},ticks:{color:INK}}}:{x:{grid:{display:false},ticks:{color:INK,font:{size:11}}},y:{min:0,max:mode==='trend'?60:45,grid:{color:GRID},ticks:{color:INK}}}};
 const obj=new window.Chart(canvas,{type:isDonut?'doughnut':isScatter?'scatter':mode==='trend'?'line':'bar',data,options});instances.set('chartjs',obj);
}
async function renderPlotly(root,c){
 const mode=active,donut=mode==='donut',scatter=mode==='scatter';
 const trace=donut?{type:'pie',labels:c.labels,values:c.values,hole:.56,marker:{colors:COLORS},textinfo:'percent',hoverinfo:'label+value+percent',sort:false,direction:'clockwise'}:scatter?{type:'scatter',mode:'markers',x:c.points.map(p=>p.x),y:c.points.map(p=>p.y),marker:{size:12,color:COLORS[0]},hovertemplate:'%{x}시간 · %{y}점<extra></extra>'}:{type:mode==='bar'?'bar':'scatter',mode:mode==='trend'?'lines+markers':undefined,x:c.labels,y:c.values,marker:{color:COLORS[0],size:8,line:{width:0}},line:{color:COLORS[0],width:3,shape:'spline'},fill:mode==='trend'?'tozeroy':undefined,fillcolor:'rgba(72,111,240,.08)',hovertemplate:'%{x}: %{y}<extra></extra>'};
 const opts={autosize:false,width:Math.max(200,root.clientWidth),height:260,margin:donut?{l:9,r:9,t:8,b:48}:{l:44,r:16,t:15,b:39},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial,sans-serif',size:11,color:INK},showlegend:donut,legend:{orientation:'h',x:.5,xanchor:'center',y:-.08,font:{size:10}},xaxis:donut?undefined:{showgrid:scatter,gridcolor:GRID,zeroline:false,range:scatter?[0,10]:undefined,title:scatter?{text:'시간(h)',font:{size:10}}:undefined},yaxis:donut?undefined:{showgrid:true,gridcolor:GRID,zeroline:false,range:[0,scatter?100:mode==='trend'?60:45],title:scatter?{text:'점수',font:{size:10}}:undefined}};
 // Pie traces have no Cartesian axes. Do not pass xaxis/yaxis: undefined: Plotly cleanLayout reads .anchor.\n if(donut){delete opts.xaxis;delete opts.yaxis;}\n await window.Plotly.newPlot(root,[trace],opts,{displaylogo:false,displayModeBar:false,responsive:true});
 instances.set('plotly',root);
}
async function renderVega(root,c){
 const mode=active,donut=mode==='donut',scatter=mode==='scatter';
 const values=scatter?c.points.map((p,i)=>({name:c.labels[i],x:p.x,y:p.y})):c.labels.map((label,i)=>({category:label,value:c.values[i]}));
 const spec={$schema:'https://vega.github.io/schema/vega-lite/v6.json',width:Math.max(185,root.clientWidth-54),height:donut?190:203,background:null,padding:6,data:{values},config:{view:{stroke:null},axis:{gridColor:GRID,labelColor:INK,labelFontSize:10,titleColor:INK,titleFontSize:10},legend:{labelColor:INK,labelFontSize:10,orient:'bottom'},range:{category:COLORS}}};
 if(donut){Object.assign(spec,{mark:{type:'arc',innerRadius:60,outerRadius:92,stroke:'#fff',strokeWidth:2},encoding:{theta:{field:'value',type:'quantitative',stack:true},color:{field:'category',type:'nominal',sort:c.labels,scale:{domain:c.labels,range:COLORS.slice(0,4)},legend:{title:null,orient:'bottom',columns:2}},tooltip:[{field:'category',title:'유형'},{field:'value',title:'건수'}]}});}
 else if(scatter){Object.assign(spec,{mark:{type:'point',filled:true,size:110,color:COLORS[0]},encoding:{x:{field:'x',type:'quantitative',title:'시간(h)',scale:{domain:[0,10]}},y:{field:'y',type:'quantitative',title:'점수',scale:{domain:[0,100]}},tooltip:[{field:'name',title:'관측치'},{field:'x',title:'시간'},{field:'y',title:'점수'}]}});}
 else{Object.assign(spec,{mark:mode==='trend'?{type:'line',point:{filled:true,size:66},strokeWidth:3,color:COLORS[0]}:{type:'bar',cornerRadiusEnd:4,color:COLORS[0]},encoding:{x:{field:'category',type:'ordinal',sort:c.labels,title:null,axis:{labelAngle:0,grid:false}},y:{field:'value',type:'quantitative',title:null,scale:{domain:[0,mode==='trend'?60:45]}},tooltip:[{field:'category',title:'항목'},{field:'value',title:'건수'}]}});}
 const {view}=await window.vegaEmbed(root,spec,{actions:false,renderer:'svg',mode:'vega-lite'});
 instances.set('vega',view);
}
function renderD3(root,c){
 const d3=window.d3,W=470,H=250,margin={top:14,right:19,bottom:37,left:41};
 const svg=d3.select(root).append('svg').attr('viewBox','0 0 '+W+' '+H).attr('role','img').attr('aria-label','D3.js로 렌더링한 '+c.title);
 const innerW=W-margin.left-margin.right,innerH=H-margin.top-margin.bottom;
 if(active==='donut'){
   const g=svg.append('g').attr('transform','translate('+W/2+','+(H/2-12)+')');
   const pie=d3.pie().sort(null).value(d=>d.value),arc=d3.arc().innerRadius(68).outerRadius(98);
   g.selectAll('path').data(pie(c.labels.map((label,i)=>({label,value:c.values[i]})))).enter().append('path').attr('d',arc).attr('fill',(_,i)=>COLORS[i]).attr('stroke','#fff').attr('stroke-width',3).append('title').text(d=>d.data.label+': '+d.data.value+'건');
   g.append('text').attr('text-anchor','middle').attr('font-size',29).attr('font-weight',800).attr('fill','#28374e').attr('dy','3').text('100');
   g.append('text').attr('text-anchor','middle').attr('font-size',11).attr('fill',INK).attr('dy','22').text('전체 건수');
   c.labels.forEach((label,i)=>{const col=i%2,row=Math.floor(i/2),posX=W/2-115+col*130,posY=H-25+row*16;svg.append('circle').attr('cx',posX).attr('cy',posY).attr('r',5).attr('fill',COLORS[i]);svg.append('text').attr('x',posX+10).attr('y',posY+4).attr('font-size',11).attr('fill',INK).text(label+' '+c.values[i]+'%');});
   return;
 }
 const g=svg.append('g').attr('transform','translate('+margin.left+','+margin.top+')');
 const scatter=active==='scatter';
 const x=scatter?d3.scaleLinear().domain([0,10]).range([0,innerW]):d3.scaleBand().domain(c.labels).range([0,innerW]).padding(active==='bar'?.38:.1);
 const y=d3.scaleLinear().domain([0,scatter?100:active==='trend'?60:45]).range([innerH,0]);
 g.append('g').call(d3.axisLeft(y).ticks(5).tickSize(-innerW)).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke',GRID);ax.selectAll('text').attr('fill',INK).attr('font-size',10)});
 g.append('g').attr('transform','translate(0,'+innerH+')').call(scatter?d3.axisBottom(x).ticks(5):d3.axisBottom(x)).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').remove();ax.selectAll('text').attr('fill',INK).attr('font-size',11)});
 if(scatter){
   g.selectAll('.dot').data(c.points).enter().append('circle').attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',6).attr('fill',COLORS[0]).attr('stroke','#fff').attr('stroke-width',1.5).append('title').text(d=>d.x+'시간 · '+d.y+'점');
   svg.append('text').attr('x',W/2).attr('y',H-3).attr('text-anchor','middle').attr('font-size',10).attr('fill',INK).text('참여 시간(h)');
 }else if(active==='bar'){
   g.selectAll('.bar').data(c.values).enter().append('rect').attr('x',(_,i)=>x(c.labels[i])).attr('y',d=>y(d)).attr('width',x.bandwidth()).attr('height',d=>innerH-y(d)).attr('rx',5).attr('fill',COLORS[0]).append('title').text((d,i)=>c.labels[i]+': '+d+'명');
 }else{
   const cx=i=>x(c.labels[i])+x.bandwidth()/2;
   const line=d3.line().x((_,i)=>cx(i)).y(d=>y(d)).curve(d3.curveMonotoneX);
   g.append('path').datum(c.values).attr('fill','none').attr('stroke',COLORS[0]).attr('stroke-width',3).attr('d',line);
   g.selectAll('circle.series').data(c.values).enter().append('circle').attr('cx',(_,i)=>cx(i)).attr('cy',d=>y(d)).attr('r',5).attr('fill','#fff').attr('stroke',COLORS[0]).attr('stroke-width',3).append('title').text((d,i)=>c.labels[i]+': '+d+'건');
 }
}
const renderers={echarts:renderECharts,chartjs:renderChartJS,plotly:renderPlotly,vega:renderVega,d3:renderD3};
function buildTable(c){
 const head=c.points?'<tr><th scope="col">관측치</th><th scope="col">참여 시간(h)</th><th scope="col">성과 점수(점)</th></tr>':'<tr><th scope="col">항목</th><th scope="col">값 ('+c.unit+')</th></tr>';
 const rows=c.points?c.points.map((p,i)=>'<tr><td>'+escapeText(c.labels[i])+'</td><td>'+p.x+'</td><td>'+p.y+'</td></tr>').join(''):c.labels.map((s,i)=>'<tr><td>'+escapeText(s)+'</td><td>'+c.values[i]+'</td></tr>').join('');
 table.innerHTML='<thead>'+head+'</thead><tbody>'+rows+'</tbody>';
}
function updateHeader(c){title.textContent=c.title;desc.textContent=c.description;hint.textContent=c.hint;buildTable(c)}
function buildCards(){grid.innerHTML=engines.map((e,i)=>'<article class="live-card" data-engine="'+e.id+'"><div class="live-card-head"><div class="live-title"><span class="live-emblem">'+e.code+'</span><div><div class="live-name">'+e.name+'</div><div class="live-desc">'+e.subtitle+'</div></div></div><span class="live-state" data-engine-state="'+e.id+'">준비 중</span></div><div class="chart-root" data-engine-root="'+e.id+'"><div class="loading-pulse">실제 차트 엔진 불러오는 중</div></div><div class="live-card-foot"><span>동일 데이터 · 엔진별 실시간 렌더</span><a href="'+e.url+'" target="_blank" rel="noopener noreferrer">공식 예제 ↗</a></div></article>').join('')}
async function drawOne(id,run){
 const root=document.querySelector('[data-engine-root="'+id+'"]');if(!root||run!==epoch)return;
 root.innerHTML='<div class="loading-pulse">차트 렌더링 중</div>';state(id,'loading');
 try{
  await loadEngine(id);if(run!==epoch)return;
  root.replaceChildren();await renderers[id](root,categories[active]);if(run!==epoch)return;
  state(id,'ready');
 }catch(err){if(run!==epoch)return;console.warn('Chart gallery',id,err);state(id,'error');fallback(root,'엔진을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.')}
 finally {const ok=[...document.querySelectorAll('.live-state.good')].length;const bad=[...document.querySelectorAll('.live-state.bad')].length;if(run===epoch){statusEl.textContent=ok+' / 5개 렌더 완료'+(bad?' · '+bad+'개 오류':'')}}
}
function selectCategory(key){
 if(!categories[key])return;
 active=key;const run=++epoch;
 dispose();for(const [k,b] of buttons)b.setAttribute('aria-pressed',String(k===key));
 updateHeader(categories[key]);buildCards();statusEl.textContent='0 / 5개 렌더 완료';
 engines.forEach(e=>void drawOne(e.id,run));
 // Preserve shareable category URL without navigation.
 const u=new URL(location.href);u.searchParams.set('type',key);history.replaceState(null,'',u);
}
for(const [id,c] of Object.entries(categories)){
 const btn=document.createElement('button');btn.type='button';btn.textContent=c.label;btn.dataset.category=id;btn.setAttribute('aria-pressed','false');btn.addEventListener('click',()=>selectCategory(id));control.append(btn);buttons.set(id,btn)
}
const incoming=new URL(location.href).searchParams.get('type');selectCategory(incoming&&categories[incoming]?incoming:'trend');
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{try{instances.get('echarts')?.resize();instances.get('chartjs')?.resize();const el=instances.get('plotly');if(el&&window.Plotly)window.Plotly.Plots.resize(el)}catch(e){console.warn('resize',e)}},220)},{passive:true});
})();
