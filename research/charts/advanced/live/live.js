/* SuaveForge Research — Live Advanced Showcase
 * Original SuaveForge visualizations, independently implemented using permissive engines.
 * The 35 vendor references are research inspiration, NOT hosted vendor demo source code.
 * Data is fictional and intentionally identical per visualization type across cards where appropriate.
 */
(function(){
'use strict';
const lib={
 echarts:['https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/echarts.min.js'],
 plotly:['https://cdn.plot.ly/plotly-4.1.1.min.js'],
 d3:['https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js']
};
const engines={
 R001:['sankey','echarts'],R002:['sankey','plotly'],R003:['sankey','echarts'],R004:['chord','d3'],R005:['sankey','echarts'],R006:['network','echarts'],
 R007:['sunburst','echarts'],R008:['sunburst','echarts'],R009:['treemap','plotly'],R010:['sunburst','echarts'],R011:['sunburst','echarts'],R012:['treemap','echarts'],
 R013:['calendar','echarts'],R014:['calendar','echarts'],R015:['heatmap','echarts'],R016:['heatmap','echarts'],R017:['violin','plotly'],R018:['violin','plotly'],
 R019:['parallel','plotly'],R020:['parallel','echarts'],R021:['surface','plotly'],R022:['contour','plotly'],R023:['surface','plotly'],R024:['scatter3d','plotly'],
 R025:['sankey','echarts'],R026:['radar','echarts'],R027:['network','echarts'],R028:['treemap','echarts'],R029:['multiples','echarts'],
 R030:['candlestick','echarts'],R031:['heatmap','echarts'],R032:['mixed','echarts'],R033:['bubble','echarts'],R034:['gantt','echarts'],R035:['gauge','echarts']
};
const labels={sankey:'흐름 · Sankey',chord:'연결 · Chord',network:'관계 · Network',sunburst:'계층 · Sunburst',treemap:'면적 · Treemap',calendar:'기간 · Calendar',heatmap:'밀도 · Matrix',violin:'통계 · Violin',parallel:'차원 · Parallel',surface:'표면 · 3D Surface',contour:'고도 · Contour',scatter3d:'공간 · 3D Scatter',radar:'비교 · Radar',multiples:'소형 다중 차트',candlestick:'시계열 · Candlestick',mixed:'복합 · Bar + Line',bubble:'분포 · Bubble',gantt:'일정 · Gantt',gauge:'현황 · Gauge'};
const C=['#5474e8','#24a69b','#ef9f61','#9b78d8','#d9697a','#65a1b4'];
const TEXT='#5c6b80',GRID='#e9edf5';
const data=window.SF_ADVANCED_RESEARCH?.items||[];
const root=document.querySelector('[data-live-gallery]');
const control=document.querySelector('[data-live-category]');
const total=document.querySelector('[data-live-count]');
const search=document.querySelector('[data-live-search]');
const empty=document.querySelector('[data-live-empty]');
if(!root||data.length!==35||!control||!search)return;
const loaded={},libraryPromise={},instances=new Map(),observerOptions={rootMargin:'180px 0px 180px 0px',threshold:.01};
let observer=null,active='featured',term='',gen=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function jsload(url){if(libraryPromise[url])return libraryPromise[url];libraryPromise[url]=new Promise((resolve,reject)=>{
 const el=document.createElement('script');let timer=setTimeout(()=>{el.remove();reject(new Error('네트워크 타임아웃'))},18000);
 el.src=url;el.async=true;el.crossOrigin='anonymous';el.onload=()=>{clearTimeout(timer);resolve()};el.onerror=()=>{clearTimeout(timer);el.remove();reject(new Error('CDN 로드 실패'))};document.head.append(el);
});return libraryPromise[url].catch(e=>{delete libraryPromise[url];throw e});}
async function ensureEngine(engine){if(loaded[engine])return;for(const url of lib[engine])await jsload(url);if(!(engine==='echarts'?window.echarts:engine==='plotly'?window.Plotly:window.d3))throw Error('엔진 초기화 실패');loaded[engine]=true}
function destroy(){for(const [dom,obj] of instances){try{if(obj.engine==='echarts')obj.value.dispose();if(obj.engine==='plotly')window.Plotly?.purge(dom)}catch(e){console.warn('cleanup',e)}}instances.clear()}
const base={animation:false,textStyle:{fontFamily:'Arial, sans-serif',color:TEXT,fontSize:11},color:C,backgroundColor:'transparent',tooltip:{confine:true,backgroundColor:'#17243b',textStyle:{color:'#fff',fontSize:11},borderWidth:0}};
const T=['진입','선발','연구','교육','최종','보류'];
function sankey(variant){
 const nodes=T.map(name=>({name}));
 let links=[{source:'진입',target:'선발',value:82},{source:'진입',target:'보류',value:18},{source:'선발',target:'연구',value:48},{source:'선발',target:'교육',value:34},{source:'연구',target:'최종',value:38},{source:'교육',target:'최종',value:29}];
 if(variant===3){links=[{source:'진입',target:'선발',value:90},{source:'진입',target:'보류',value:10},{source:'선발',target:'연구',value:56},{source:'선발',target:'교육',value:34},{source:'연구',target:'최종',value:49},{source:'교육',target:'최종',value:31}]}
 return {...base,tooltip:{...base.tooltip,trigger:'item'},series:[{type:'sankey',layoutIterations:32,top:12,right:24,bottom:14,left:20,emphasis:{focus:'adjacency'},nodeWidth:12,nodeGap:13,nodeAlign:'justify',draggable:false,lineStyle:{color:'gradient',opacity:.36,curveness:.55},label:{fontSize:10,color:TEXT},itemStyle:{borderWidth:0,borderRadius:3},data:nodes,links}]}
}
const TREE=[{name:'연구',value:43,children:[{name:'개발',value:20},{name:'논문',value:13},{name:'실험',value:10}]},{name:'교육',value:32,children:[{name:'공통',value:18},{name:'특화',value:14}]},{name:'실습',value:25,children:[{name:'팀',value:13},{name:'개인',value:12}]}];
function sunburst(id){return {...base,series:[{type:'sunburst',data:TREE,sort:null,center:['50%','50%'],radius:['16%','91%'],nodeClick:'rootToNode',emphasis:{focus:'ancestor'},label:{rotate:'radial',fontSize:10,color:'#273b55'},itemStyle:{borderColor:'#fff',borderWidth:2}}]}}
function treemap(){return {...base,tooltip:{...base.tooltip,formatter:'{b}: {c}'},series:[{type:'treemap',data:TREE,leafDepth:2,roam:false,nodeClick:'zoomToNode',breadcrumb:{height:19,bottom:0},top:7,bottom:24,right:5,left:5,levels:[{itemStyle:{borderColor:'#fff',borderWidth:2,gapWidth:3}},{itemStyle:{borderColor:'#fff',borderWidth:3,gapWidth:2}}],label:{show:true,fontSize:11,position:'insideTopLeft'}}]}}
function calendar(id){const start=new Date('2026-01-01T00:00:00Z'),days=[];for(let i=0;i<92;i++){const date=new Date(start.getTime()+i*86400000);days.push([date.toISOString().slice(0,10),((i*17+(id%7)*11)%41)+(i%9===0?12:0)])}
return {...base,visualMap:{show:false,min:0,max:58,inRange:{color:['#edf2fc','#b7ccfa','#5374e9','#283e91']}},calendar:{orient:'horizontal',top:54,left:20,right:13,range:['2026-01-01','2026-03-31'],cellSize:['auto',21],itemStyle:{borderWidth:3,borderColor:'#fff'},splitLine:{show:false},dayLabel:{firstDay:1,nameMap:'en',color:TEXT,fontSize:9},monthLabel:{color:TEXT,fontSize:10},yearLabel:{show:false}},series:[{type:'heatmap',coordinateSystem:'calendar',data:days}]};}
function heatmap(id){const isLarge=id===31,xx=isLarge?Array.from({length:16},(_,i)=>String(i+1).padStart(2,'0')):['P1','P2','P3','P4','P5','P6'];const yy=isLarge?Array.from({length:10},(_,i)=>'조 '+(i+1)):['1주','2주','3주','4주','5주','6주'];const vals=[];xx.forEach((x,i)=>yy.forEach((y,j)=>vals.push([i,j,((i*11+j*19+id*7)%37)+8+(i===j?16:0)])));return {...base,grid:{left:44,right:14,top:15,bottom:47},visualMap:{min:0,max:60,calculable:false,orient:'horizontal',left:'center',bottom:0,itemWidth:12,itemHeight:95,inRange:{color:['#eff4fe','#bad0fa','#718fec','#2849a9']},textStyle:{fontSize:9,color:TEXT}},xAxis:{type:'category',data:xx,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:TEXT,fontSize:isLarge?8:11}},yAxis:{type:'category',data:yy,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:TEXT,fontSize:isLarge?8:11}},series:[{type:'heatmap',data:vals,progressive:isLarge?800:0,label:{show:!isLarge,formatter:x=>x.value[2],fontSize:10,color:'#344760'},emphasis:{itemStyle:{shadowBlur:10,shadowColor:'#5474e8'}}}]}}
function network(id){const names=['Platform','Data','AI','Cloud','UX','Security','API','Mobile','Insight','Sync'];const nodes=names.map((name,i)=>({name,value:10+i,symbolSize:i===0?38:13+((i*7)%14),itemStyle:{color:C[i%C.length]},label:{show:i===0||i===2||i===4,fontSize:9}}));const pairs=[[0,1],[0,2],[0,3],[0,4],[1,5],[1,8],[2,8],[3,6],[3,9],[4,7],[4,6],[5,6],[6,9],[7,9],[8,9],[2,7]];return {...base,series:[{type:'graph',layout:'force',roam:false,draggable:false,data:nodes,links:pairs.map(([a,b])=>({source:names[a],target:names[b]})),force:{repulsion:170,gravity:.09,edgeLength:[35,75],layoutAnimation:false},lineStyle:{color:'#a9bce2',width:1.5,opacity:.7},emphasis:{focus:'adjacency'},label:{position:'right',color:TEXT}}]};}
function radar(){return {...base,radar:{center:['50%','52%'],radius:'65%',axisName:{fontSize:11,color:TEXT},splitLine:{lineStyle:{color:'#e0e8f5'}},splitArea:{areaStyle:{color:['#fff','#f6f8fd']}},axisLine:{lineStyle:{color:'#dbe5f3'}},indicator:[{name:'연구',max:100},{name:'협업',max:100},{name:'기획',max:100},{name:'실행',max:100},{name:'발표',max:100},{name:'성장',max:100}]},series:[{type:'radar',data:[{value:[87,72,96,84,78,89],name:'A',areaStyle:{opacity:.18}},{value:[66,90,75,82,95,64],name:'B',areaStyle:{opacity:.10}}],symbol:'circle',symbolSize:4,lineStyle:{width:2.5}}]}}
function parallel(){return {...base,parallelAxis:[{dim:0,name:'연구',min:0,max:100},{dim:1,name:'교육',min:0,max:100},{dim:2,name:'성과',min:0,max:100},{dim:3,name:'협업',min:0,max:100}],parallel:{left:45,right:36,top:33,bottom:33,parallelAxisDefault:{type:'value',nameLocation:'end',nameGap:18,axisLabel:{fontSize:9,color:TEXT},nameTextStyle:{fontSize:10,color:TEXT},axisLine:{lineStyle:{color:'#cad5e7'}},splitLine:{show:false}}},series:[{type:'parallel',lineStyle:{width:1.8,opacity:.48,color:'#5474e8'},data:Array.from({length:24},(_,i)=>[(i*17+18)%100,(i*29+43)%100,(i*11+36)%100,(i*23+15)%100])}]}}
function multiples(){const xs=['1','2','3','4','5','6'];const grids=[{left:35,top:24,width:'26%',height:'67%'},{left:'38%',top:24,width:'26%',height:'67%'},{left:'71%',top:24,width:'26%',height:'67%'}];return {...base,grid:grids,title:[{text:'교육',left:'15%',top:3,textStyle:{fontSize:11,fontWeight:600,color:TEXT}},{text:'연구',left:'48%',top:3,textStyle:{fontSize:11,fontWeight:600,color:TEXT}},{text:'성과',left:'80%',top:3,textStyle:{fontSize:11,fontWeight:600,color:TEXT}}],xAxis:grids.map((_,i)=>({type:'category',gridIndex:i,data:xs,axisTick:{show:false},axisLine:{show:false},axisLabel:{fontSize:9,color:TEXT}})),yAxis:grids.map((_,i)=>({type:'value',gridIndex:i,min:0,max:80,splitNumber:4,axisLabel:{fontSize:8,color:TEXT},splitLine:{lineStyle:{color:GRID}}})),series:grids.map((_,i)=>({type:'line',xAxisIndex:i,yAxisIndex:i,smooth:true,symbol:'none',lineStyle:{width:3},areaStyle:{opacity:.12},data:xs.map((_,j)=>20+(i*9+j*11+((i*j*17)%21))%55)}))}}
function candle(){const xs=Array.from({length:14},(_,i)=>(i+1)+'일');const d=xs.map((_,i)=>{const x=55+i*2+Math.sin(i*1.8)*8,y=x+(i%3===0?-6:7);return [x,y,Math.min(x,y)-5,Math.max(x,y)+6]});return {...base,grid:{left:34,right:8,top:13,bottom:32},xAxis:{type:'category',data:xs,axisTick:{show:false},axisLabel:{fontSize:9,color:TEXT},axisLine:{show:false}},yAxis:{type:'value',scale:true,axisLabel:{fontSize:10,color:TEXT},splitLine:{lineStyle:{color:GRID}}},series:[{type:'candlestick',data:d,itemStyle:{color:'#24a69b',color0:'#d9697a',borderColor:'#24a69b',borderColor0:'#d9697a'}}]}}
function mixed(){const xs=['3월','4월','5월','6월','7월','8월'];return {...base,grid:{left:40,right:15,top:23,bottom:33},legend:{show:true,top:0,textStyle:{fontSize:9,color:TEXT}},xAxis:{type:'category',data:xs,axisTick:{show:false},axisLabel:{fontSize:10,color:TEXT},axisLine:{show:false}},yAxis:{type:'value',min:0,max:85,axisLabel:{color:TEXT,fontSize:9},splitLine:{lineStyle:{color:GRID}}},series:[{type:'bar',name:'참여',barMaxWidth:22,itemStyle:{borderRadius:[4,4,0,0],color:'#91a9ef'},data:[42,48,49,52,63,69]},{type:'line',name:'이수',smooth:true,symbolSize:6,lineStyle:{width:3},data:[22,28,37,45,57,71]}]}}
function bubble(){return {...base,grid:{left:41,right:14,top:15,bottom:35},xAxis:{type:'value',name:'참여시간',nameTextStyle:{fontSize:9},axisLabel:{color:TEXT,fontSize:9},splitLine:{lineStyle:{color:GRID}}},yAxis:{type:'value',name:'성과',nameTextStyle:{fontSize:9},axisLabel:{color:TEXT,fontSize:9},splitLine:{lineStyle:{color:GRID}}},series:[{type:'scatter',data:Array.from({length:20},(_,i)=>[10+i*3+(i%3)*5,25+(i*11)%65,10+(i*5)%25]),symbolSize:v=>v[2],itemStyle:{opacity:.68,color:p=>C[p.dataIndex%C.length]}}]}}
function gantt(){const names=['설계','구현','데이터','검수','배포'];const begins=[0,2,4,8,11],durations=[4,7,5,4,2];return {...base,grid:{left:58,right:15,top:14,bottom:35},xAxis:{type:'value',min:0,max:14,axisLabel:{fontSize:10,color:TEXT,formatter:v=>v+'주'},splitLine:{lineStyle:{color:GRID}}},yAxis:{type:'category',data:names,inverse:true,axisTick:{show:false},axisLine:{show:false},axisLabel:{fontSize:11,color:TEXT}},series:[{type:'bar',stack:'duration',data:begins,itemStyle:{color:'transparent'},silent:true,barWidth:18},{type:'bar',stack:'duration',data:durations,itemStyle:{color:p=>C[p.dataIndex%C.length],borderRadius:5},barWidth:18,tooltip:{valueFormatter:v=>v+'주'}}]}}
function gauge(){return {...base,series:[{type:'gauge',startAngle:205,endAngle:-25,min:0,max:100,center:['50%','57%'],radius:'92%',progress:{show:true,width:19,roundCap:true,itemStyle:{color:'#5474e8'}},axisLine:{lineStyle:{width:19,color:[[1,'#e5ecf7']]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},pointer:{show:false},anchor:{show:false},title:{show:true,offsetCenter:[0,'65%'],fontSize:12,color:TEXT},detail:{valueAnimation:false,offsetCenter:[0,'12%'],fontSize:34,fontWeight:750,color:'#1c3152',formatter:'{value}%'},data:[{value:82,name:'목표 달성률'}]}]}}
function echartsOpt(item){
 const type=engines[item.id][0],id=Number(item.id.slice(1));
 if(type==='sankey')return sankey(id);
 if(type==='sunburst')return sunburst(id);
 if(type==='treemap')return treemap();
 if(type==='calendar')return calendar(id);
 if(type==='heatmap')return heatmap(id);
 if(type==='network')return network(id);
 if(type==='radar')return radar();
 if(type==='parallel')return parallel();
 if(type==='multiples')return multiples();
 if(type==='candlestick')return candle();
 if(type==='mixed')return mixed();
 if(type==='bubble')return bubble();
 if(type==='gantt')return gantt();
 if(type==='gauge')return gauge();
 throw new Error('Unknown ECharts preview '+type)
}
function plotlyTrace(item){
 const type=engines[item.id][0],id=Number(item.id.slice(1));
 if(type==='sankey')return [{type:'sankey',orientation:'h',node:{pad:12,thickness:14,color:C.slice(0,6),label:T},link:{source:[0,0,1,1,2,3],target:[1,5,2,3,4,4],value:[82,18,48,34,38,29],color:'rgba(84,116,232,.24)'}}];
 if(type==='treemap')return [{type:'treemap',labels:['전체','연구','교육','실습','개발','논문','실험','공통','특화','팀','개인'],parents:['','전체','전체','전체','연구','연구','연구','교육','교육','실습','실습'],values:[100,43,32,25,20,13,10,18,14,13,12],branchvalues:'total',textinfo:'label+value',marker:{colors:['#254681',...C,...C]}}];
 if(type==='violin')return ['연구','교육','실습'].map((name,j)=>({type:'violin',name,y:Array.from({length:22},(_,i)=>35+j*10+((i*13+j*9)%49)+Math.sin(i)*7),box:{visible:true},meanline:{visible:true},points:false,spanmode:'hard',fillcolor:['rgba(84,116,232,.3)','rgba(36,166,155,.3)','rgba(239,159,97,.3)'][j],line:{color:C[j],width:1.6}}));
 if(type==='parallel'){const dimensions=['연구','교육','성과','협업'].map((label,j)=>({label,values:Array.from({length:32},(_,i)=>((i*(j*7+11)+j*19+5)%94)+3),range:[0,100]}));return [{type:'parcoords',dimensions,line:{color:Array.from({length:32},(_,i)=>i*3),colorscale:[[0,'#bad3f9'],[1,'#2547a8']],showscale:false}}]}
 const size=22,z=Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>55+24*Math.sin(x*.26)*Math.cos(y*.3)+(id%4)*3));
 if(type==='surface')return [{type:'surface',z,colorscale:[[0,'#2d427a'],[.4,'#6d8fef'],[.7,'#54b6ba'],[1,'#eeb876']],showscale:false,lighting:{ambient:.85,diffuse:.7}}];
 if(type==='contour')return [{type:'contour',z,colorscale:'YlGnBu',contours:{coloring:'fill',showlabels:true,labelfont:{size:9}},line:{width:1.2},showscale:false}];
 if(type==='scatter3d')return [{type:'scatter3d',mode:'markers',x:Array.from({length:45},(_,i)=>(i*7)%35),y:Array.from({length:45},(_,i)=>(i*11)%36),z:Array.from({length:45},(_,i)=>20+Math.sin(i*.8)*12+(i%7)*4),marker:{size:4,color:Array.from({length:45},(_,i)=>i*2),colorscale:'Viridis',opacity:.85,showscale:false}}];
 throw Error('Unknown Plotly renderer '+type)
}
function plotlyLayout(root,item){const type=engines[item.id][0],is3d=type==='surface'||type==='scatter3d',pie=type==='treemap'||type==='sankey',violin=type==='violin',par=type==='parallel';
 const layout={width:Math.max(root.clientWidth,260),height:root.clientHeight||250,autosize:false,margin:is3d?{l:0,r:0,t:0,b:0}:pie||par?{l:6,r:6,t:7,b:7}:{l:42,r:12,t:12,b:32},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial, sans-serif',color:TEXT,size:10},showlegend:violin,legend:{orientation:'h',x:.5,xanchor:'center',y:-.22},hovermode:'closest'};
 if(!pie&&!par&&!is3d){layout.xaxis={gridcolor:GRID,zeroline:false};layout.yaxis={gridcolor:GRID,zeroline:false}}
 if(is3d){layout.scene={xaxis:{title:'X',showbackground:false},yaxis:{title:'Y',showbackground:false},zaxis:{title:'Z',showbackground:false},camera:{eye:{x:1.5,y:1.4,z:.8}},aspectratio:{x:1,y:1,z:.55}};}
 return layout;
}
function drawChord(root){const d3=window.d3,w=Math.max(270,root.clientWidth),h=Math.max(245,root.clientHeight),size=Math.min(w,h)-50,rad=size/2;const matrix=[[0,16,10,4,8],[8,0,12,6,5],[10,12,0,7,8],[5,7,9,0,7],[7,4,10,9,0]];
 const svg=d3.select(root).append('svg').attr('width','100%').attr('height','100%').attr('viewBox',[0,0,w,h].join(' ')).attr('role','img').attr('aria-label','SuaveForge 독립 구현 연결 Chord 그래프');
 const g=svg.append('g').attr('transform','translate('+w/2+','+h/2+')');
 const chord=d3.chord().padAngle(.055).sortSubgroups(d3.descending)(matrix);
 const arc=d3.arc().innerRadius(rad*.68).outerRadius(rad*.76),ribbon=d3.ribbon().radius(rad*.66);
 g.append('g').selectAll('path').data(chord.groups).join('path').attr('d',arc).attr('fill',d=>C[d.index]).attr('stroke','#fff').attr('stroke-width',1).append('title').text(d=>['연구','교육','실습','성과','협업'][d.index]+': '+d.value);
 g.append('g').attr('fill-opacity',.55).selectAll('path').data(chord).join('path').attr('d',ribbon).attr('fill',d=>C[d.source.index]).attr('stroke','#fff').attr('stroke-opacity',.35).append('title').text(d=>d.source.index+' → '+d.target.index+': '+d.source.value);
 g.append('g').selectAll('text').data(chord.groups).join('text').attr('transform',d=>{const a=(d.startAngle+d.endAngle)/2-Math.PI/2;return 'rotate('+(a*180/Math.PI)+') translate('+(rad*.89)+',0) rotate('+(a>Math.PI/2&&a<Math.PI*1.5?180:0)+')';}).attr('text-anchor','middle').attr('font-size',9).attr('fill',TEXT).text(d=>['연구','교육','실습','성과','협업'][d.index]);
}
function recordInstance(root,engine,value){instances.set(root,{engine,value})}
async function draw(root,item,generation){
 const id=item.id,engine=engines[id][1],label=root.closest('.advanced-live-card')?.querySelector('[data-preview-status]')||root.parentElement?.querySelector('[data-preview-status]');
 if(!root.isConnected||generation!==gen)return;
 label.textContent='렌더링 중';label.className='preview-state';
 try{
 await ensureEngine(engine);if(!root.isConnected||generation!==gen)return;
 root.replaceChildren();
 if(engine==='echarts'){const value=window.echarts.init(root,null,{renderer:'canvas'});value.setOption(echartsOpt(item));recordInstance(root,engine,value)}
 else if(engine==='plotly'){await window.Plotly.newPlot(root,plotlyTrace(item),plotlyLayout(root,item),{displayModeBar:false,displaylogo:false,responsive:false});if(!root.isConnected||generation!==gen){window.Plotly.purge(root);return;}recordInstance(root,engine,root)}
 else {drawChord(root);recordInstance(root,engine,null)}
 label.textContent='실행됨';label.className='preview-state ok';root.dataset.ready='true';
 }catch(e){console.warn('Advanced live chart',id,e);root.innerHTML='';const msg=document.createElement('div');msg.className='preview-error';msg.textContent='실행 실패 · 다시 시도';msg.setAttribute('role','button');msg.setAttribute('tabindex','0');const retry=()=>{root.innerHTML='';draw(root,item,gen)};msg.addEventListener('click',retry);msg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();retry()}});root.append(msg);label.textContent='오류';label.className='preview-state error'}
}
function makeCards(){
 if(observer)observer.disconnect();destroy();gen++;
 const featured=new Set(['R001','R004','R007','R009','R013','R016','R017','R019','R021','R022','R028','R030','R034','R035']);
 const display=data.filter(item=>(active==='all'||(active==='featured'&&featured.has(item.id))||item.category===active)&&[item.title,item.engine,item.description,item.use,item.license].join(' ').toLowerCase().includes(term));
 total.textContent=display.length+' / 35개 로컬 차트';
 empty.hidden=display.length>0;
 root.innerHTML=display.map(item=>{
 const [type,engine]=engines[item.id];
 return '<article class="advanced-live-card" data-ref="'+item.id+'"><header class="preview-header"><div class="preview-topline"><span class="preview-number">'+item.id+'</span><span class="preview-kind">'+esc(labels[type])+'</span></div><h3>'+esc(item.title)+'</h3><p>공식 참고: '+esc(item.engine)+' · 자체 실행: <b>'+esc(engine==='echarts'?'Apache ECharts 6':engine==='plotly'?'Plotly.js':'D3.js')+'</b></p></header><div class="preview-plot" data-chart="' + item.id + '" role="img" aria-label="'+esc(item.title)+' 예시 차트 · 가상 데이터"><div class="preview-loading">차트 준비 중</div></div><footer class="preview-footer"><span data-preview-status class="preview-state">준비 중</span><div class="preview-actions"><button type="button" data-open-preview="'+item.id+'">크게 보기 ↗</button><a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(item.title)+' 공식 참고 데모">원본 참고 ↗</a></div></footer></article>';
 }).join('');
 observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);const id=entry.target.dataset.chart;const item=data.find(x=>x.id===id);if(item)void draw(entry.target,item,gen)}},observerOptions);
 root.querySelectorAll('[data-chart]').forEach(node=>observer.observe(node));
 root.querySelectorAll('[data-open-preview]').forEach(button=>button.addEventListener('click',()=>openModal(button.dataset.openPreview)));
}
const modal=document.querySelector('[data-live-modal]'),modalStage=document.querySelector('[data-modal-chart]'),modalTitle=document.querySelector('[data-modal-title]');
let modalRoot=null;
function openModal(id){
 const item=data.find(x=>x.id===id);if(!item||!modal)return;
 if(modalRoot){try{if(instances.get(modalRoot)?.engine==='echarts')instances.get(modalRoot).value.dispose();if(instances.get(modalRoot)?.engine==='plotly')window.Plotly.purge(modalRoot)}catch{}instances.delete(modalRoot);}
 modalTitle.textContent=item.title;modalStage.innerHTML='<div class="modal-chart-target" data-chart="'+id+'"></div>';modalRoot=modalStage.firstElementChild;
 // The same renderer is used for card and modal; a scope-specific status element is provided.
 const fake=document.createElement('span');fake.dataset.previewStatus='';fake.className='preview-state';modalStage.append(fake);
 modal.showModal();void draw(modalRoot,item,gen);
}
modal?.addEventListener('close',()=>{if(modalRoot){try{if(instances.get(modalRoot)?.engine==='echarts')instances.get(modalRoot).value.dispose();if(instances.get(modalRoot)?.engine==='plotly')window.Plotly.purge(modalRoot)}catch{}instances.delete(modalRoot);modalRoot=null}modalStage.replaceChildren()});
const close=document.querySelector('[data-modal-close]');close?.addEventListener('click',()=>modal.close());
for(const button of control.querySelectorAll('button'))button.addEventListener('click',()=>{active=button.dataset.category;for(const b of control.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));makeCards()});
search.addEventListener('input',()=>{term=search.value.trim().toLowerCase();makeCards()});
const requested=new URLSearchParams(location.search).get('chart');
if(requested&&data.some(x=>x.id===requested)){active=data.find(x=>x.id===requested).category;for(const b of control.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.category===active));}
makeCards();
if(requested){const target=document.getElementById(requested);if(target)setTimeout(()=>target.scrollIntoView({behavior:'instant',block:'center'}),50)}
const ro=new ResizeObserver(entries=>{for(const e of entries){const obj=instances.get(e.target);if(!obj)continue;try{if(obj.engine==='echarts')obj.value.resize();else if(obj.engine==='plotly'&&e.target.clientWidth>0){window.Plotly.relayout(e.target,{width:e.target.clientWidth,height:e.target.clientHeight})}}catch{}}});
const orig=recordInstance;recordInstance=(root,engine,value)=>{orig(root,engine,value);ro.observe(root)};
})();