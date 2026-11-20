/* SuaveForge Shader & VFX Lab — one shared actual WebGL GPU context.
 * Visible preview canvases use 2D blits of our own GPU-rendered fragment shaders.
 * This avoids spawning 16+ simultaneous WebGL contexts and exhausting mobile GPU slots.
 */
(function(){
'use strict';
const data=window.SFVFXResearch;
const root=document.querySelector('[data-shader-grid]'),filters=document.querySelector('[data-shader-filters]'),search=document.querySelector('[data-shader-search]'),count=document.querySelector('[data-shader-count]'),status=document.querySelector('[data-gpu-status]');
const compare=document.querySelector('[data-compare-grid]'),compareEmpty=document.querySelector('[data-compare-empty]');
const compIntensity=document.querySelector('[data-compare-intensity]'),compSpeed=document.querySelector('[data-compare-speed]');
const modal=document.querySelector('[data-shader-modal]'),modalContent=document.querySelector('[data-shader-modal-content]'),modalTitle=document.querySelector('[data-shader-modal-title]');
if(!data||!root||!filters||!search)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const tintPalette=[[.42,.64,.99],[.47,.88,.75],[.97,.61,.51],[.80,.54,.96],[.91,.77,.50]];
const states=new Map(data.effects.map((d,i)=>[d.id,{intensity:1,speed:1,palette:i%tintPalette.length,paused:false,time:.33,frames:0,pixel:null}]));
const pins=new Set(['chrome','fluted','liquidwarp']);
const allViews=new Set();const programs=new Map();const errors=[];
let group='all',query='',lastRAF=0,observer;
const gpu=document.createElement('canvas');gpu.width=480;gpu.height=280;let gl=null,vbo=null;
const fixedVertex='attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.0,1.0);}';
const footer='void main(){vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;vec3 col=effect(uv);gl_FragColor=vec4(pow(clamp(col,0.0,1.0),vec3(.89)),1.0);}';
try{
 gl=gpu.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false,powerPreference:'low-power'});
 if(!gl)throw new Error('브라우저에서 WebGL 1.0 GPU 컨텍스트를 사용할 수 없습니다');
 vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 gl.viewport(0,0,gpu.width,gpu.height);gl.disable(gl.DEPTH_TEST);
 status.textContent='WEBGL GPU 연결됨';status.setAttribute('aria-busy','false');window.__sfVFXGPU=true;
}catch(e){errors.push(e.message);status.textContent='WebGL 미지원';status.setAttribute('aria-busy','true');window.__sfVFXGPU=false}
function shader(type,code){const sh=gl.createShader(type);gl.shaderSource(sh,code);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw new Error(log)}return sh}
function getProgram(id){
 if(programs.has(id))return programs.get(id);
 const entry=data.body[id];if(!entry)throw Error('Unknown shader '+id);
 const vs=shader(gl.VERTEX_SHADER,fixedVertex),fs=shader(gl.FRAGMENT_SHADER,data.header+'\n'+entry+'\n'+footer);
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const log=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw new Error(log)}
 const info={program,aPos:gl.getAttribLocation(program,'a_position'),uniforms:Object.fromEntries(['u_resolution','u_mouse','u_time','u_intensity','u_speed','u_color'].map(k=>[k,gl.getUniformLocation(program,k)]))};
 programs.set(id,info);return info;
}
function drawGPU(view){
 if(!gl||!view.canvas.isConnected)return;
 const s=states.get(view.id);
 try{
  const info=getProgram(view.id),U=info.uniforms;
  gl.useProgram(info.program);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.enableVertexAttribArray(info.aPos);gl.vertexAttribPointer(info.aPos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(U.u_resolution,gpu.width,gpu.height);
  gl.uniform2f(U.u_mouse,view.pointer.x,view.pointer.y);
  gl.uniform1f(U.u_time,s.time);
  gl.uniform1f(U.u_intensity,view.compare?Number(compIntensity.value):s.intensity);
  gl.uniform1f(U.u_speed,view.compare?Number(compSpeed.value):s.speed);
  const col=tintPalette[s.palette];gl.uniform3fv(U.u_color,new Float32Array(col));
  gl.drawArrays(gl.TRIANGLES,0,6);
  const ctx=view.ctx;ctx.drawImage(gpu,0,0,view.canvas.width,view.canvas.height);
  s.frames++;view.frames++;view.ready=true;view.canvas.dataset.rendered='true';view.canvas.dataset.glsl=idHash(view.id);view.last=performance.now();
  view.card?.setAttribute('data-rendered','true');view.card?.setAttribute('data-compiled','true');
 }catch(e){
  const msg=view.id+': '+e.message;errors.push(msg);view.card?.setAttribute('data-render-error',e.message);view.canvas.dataset.rendered='false';
  const fallback=view.canvas.parentElement?.querySelector('.fallback');if(fallback){fallback.textContent='쉐이더 실행 실패: '+e.message.slice(0,120);fallback.hidden=false;}
  view.visible=false;view.failed=true;console.error('SuaveForge shader compiler:',msg);
 }
}
function idHash(id){return String(data.effects.findIndex(d=>d.id===id)+1)}
function display(id,canvas,{isCompare=false,card=null}={}){
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
 canvas.width=480;canvas.height=280;
 const view={id,canvas,ctx,card,compare:isCompare,pointer:{x:.5,y:.5},frames:0,ready:false,visible:isCompare,last:0,failed:false};
 const pointer=e=>{const r=canvas.getBoundingClientRect();view.pointer={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height))};view.last=0};
 canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerdown',pointer);
 allViews.add(view);if(observer&&!isCompare)observer.observe(canvas);
 if(!gl){view.failed=true;const fallback=canvas.parentElement?.querySelector('.fallback');if(fallback){fallback.hidden=false;fallback.textContent='WebGL을 지원하는 브라우저가 필요합니다.'}}
 return view;
}
function cleanup(filter){for(const v of [...allViews])if(filter(v)){observer?.unobserve(v.canvas);allViews.delete(v)}}
function cardHTML(d,{isModal=false}={}){
 const s=states.get(d.id);
 const title=esc(d.title),description=esc(d.description),head=String(d.no)+' / '+esc(data.groups[d.group]);
 return '<article class="shader-card" data-shader-card="'+d.id+'" data-rendered="false"><header class="shader-head"><div><span class="shader-number">'+head+'</span><h3>'+title+'</h3><p>'+description+'</p></div><span class="shader-tech">GLSL · GPU</span></header><div class="shader-preview"><span class="overlay top">'+esc(d.id.toUpperCase())+' / FRAGMENT</span><canvas data-shader-canvas="'+d.id+'" role="img" aria-label="'+title+' 실제 GPU 쉐이더 화면"></canvas><span class="overlay bottom">SUAVEFORGE ORIGINAL</span><div class="fallback" hidden></div></div><div class="shader-control"><div class="slide-row"><label>강도</label><input data-intensity type="range" min="0.2" max="2" step="0.1" value="'+s.intensity+'" aria-label="'+title+' 강도 조절"><output data-intensity-output>'+s.intensity.toFixed(1)+'</output></div><div class="slide-row"><label>속도</label><input data-speed type="range" min="0.1" max="2.5" step="0.1" value="'+s.speed+'" aria-label="'+title+' 속도 조절"><output data-speed-output>'+s.speed.toFixed(1)+'</output></div><div class="action-row"><button type="button" data-pause>'+ (s.paused?'재생':'일시정지')+'</button><button type="button" data-palette>색상 변경</button><button type="button" data-pin aria-pressed="'+pins.has(d.id)+'">'+(pins.has(d.id)?'비교 해제':'비교 추가')+'</button><button type="button" data-expand>확대 ↗</button></div></div><footer class="shader-foot"><span>INDEPENDENT · WEBGL</span><a href="#references">관련 연구 자료 ↗</a></footer></article>';
}
function bindCard(card,{isModal=false}={}){
 const id=card.dataset.shaderCard,s=states.get(id);
 const canvas=card.querySelector('canvas');display(id,canvas,{card});const setFast=()=>{for(const v of allViews)if(v.id===id)v.last=0};
 card.querySelector('[data-intensity]').addEventListener('input',e=>{s.intensity=Number(e.target.value);card.querySelector('[data-intensity-output]').textContent=s.intensity.toFixed(1);setFast()});
 card.querySelector('[data-speed]').addEventListener('input',e=>{s.speed=Number(e.target.value);card.querySelector('[data-speed-output]').textContent=s.speed.toFixed(1);setFast()});
 card.querySelector('[data-pause]').addEventListener('click',e=>{s.paused=!s.paused;e.currentTarget.textContent=s.paused?'재생':'일시정지';card.dataset.paused=String(s.paused);setFast()});
 card.querySelector('[data-palette]').addEventListener('click',()=>{s.palette=(s.palette+1)%tintPalette.length;card.dataset.palette=String(s.palette);setFast()});
 card.querySelector('[data-pin]').addEventListener('click',()=>{if(pins.has(id))pins.delete(id);else{if(pins.size>=3)pins.delete(pins.values().next().value);pins.add(id)}renderCompare();updatePins()});
 const expand=card.querySelector('[data-expand]');if(isModal)expand.remove();else expand.addEventListener('click',()=>openModal(id));
 card.dataset.paused=String(s.paused);card.dataset.palette=String(s.palette);
}
function updatePins(){root.querySelectorAll('[data-shader-card]').forEach(card=>{const yes=pins.has(card.dataset.shaderCard);const b=card.querySelector('[data-pin]');b.setAttribute('aria-pressed',String(yes));b.textContent=yes?'비교 해제':'비교 추가'})}
function render(){
 cleanup(v=>!v.canvas.closest('dialog')&&!v.compare);
 const entries=data.effects.filter(d=>(group==='all'||d.group===group)&&[d.title,d.description,d.group].join(' ').toLocaleLowerCase().includes(query));
 root.innerHTML=entries.map(d=>cardHTML(d)).join('');for(const card of root.querySelectorAll('[data-shader-card]'))bindCard(card);
 count.textContent=entries.length+' / 16개 실제 GPU 쉐이더';
 const empty=document.querySelector('[data-shader-empty]');empty.hidden=entries.length>0;
 filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===group)));
}
function renderCompare(){
 cleanup(v=>v.compare);
 const items=[...pins].map(id=>data.effects.find(d=>d.id===id)).filter(Boolean);
 compare.innerHTML=items.map(d=>'<div class="compare-item"><p>'+esc(d.title)+'</p><div class="shader-preview"><span class="overlay top">'+d.id.toUpperCase()+'</span><canvas data-compare-canvas="'+d.id+'" aria-label="'+esc(d.title)+' 같은 파라미터 비교"></canvas><div class="fallback" hidden></div></div></div>').join('');
 compareEmpty.hidden=items.length>0;
 for(const c of compare.querySelectorAll('canvas'))display(c.dataset.compareCanvas,c,{isCompare:true});
 compare.dataset.count=String(items.length);
}
function openModal(id){const d=data.effects.find(d=>d.id===id);if(!d)return;modalTitle.textContent=d.title;modalContent.innerHTML=cardHTML(d,{isModal:true});modal.showModal();const card=modalContent.querySelector('.shader-card');bindCard(card,{isModal:true});const v=[...allViews].find(v=>v.canvas===card.querySelector('canvas'));if(v)v.visible=true;modal.dataset.active=id;}
modal?.addEventListener('close',()=>{cleanup(v=>!!v.canvas.closest('dialog'));modalContent.replaceChildren();modal.dataset.active=''});
document.querySelector('[data-modal-close]')?.addEventListener('click',()=>modal.close());
observer=new IntersectionObserver(entries=>{for(const entry of entries){const v=[...allViews].find(v=>v.canvas===entry.target);if(v)v.visible=entry.isIntersecting}},{threshold:0,rootMargin:'100px 0px 100px 0px'});
for(const [cat,label] of Object.entries(data.groups)){const b=document.createElement('button');b.type='button';b.dataset.category=cat;b.textContent=label;b.setAttribute('aria-pressed',String(cat===group));b.addEventListener('click',()=>{group=cat;render()});filters.append(b)}
search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase();render()});
const refRoot=document.querySelector('[data-shader-references]');
if(refRoot)refRoot.innerHTML=data.refs.map(r=>'<article class="ref"><div class="ref-meta">'+esc(r.type)+'</div><h3>'+esc(r.name)+'</h3><p>'+esc(r.description||'외부 공식 기술 예제 및 작품 모음')+'</p><small>'+esc(r.license)+'</small><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(r.name)+' 공식 사이트 열기">공식 갤러리 열기 ↗</a></article>').join('');
function animate(now){
 const dt=Math.min(.1,lastRAF?(now-lastRAF)/1000:.016);lastRAF=now;
 for(const st of states.values())if(!st.paused)st.time+=dt;
 let budget=5;
 const visible=[...allViews].filter(v=>v.visible&&!v.failed&&v.canvas.isConnected);
 visible.sort((a,b)=>a.last-b.last);
 for(const v of visible){if(budget<=0)break;if(now-v.last<65)continue;drawGPU(v);budget--}
 requestAnimationFrame(animate)
}
render();renderCompare();requestAnimationFrame(animate);
document.querySelector('[data-compare-reset]')?.addEventListener('click',()=>{pins.clear();renderCompare();updatePins()});
[compIntensity,compSpeed].forEach(el=>el.addEventListener('input',()=>{const out=el.parentElement.querySelector('output');if(out)out.textContent=Number(el.value).toFixed(1);for(const v of allViews)if(v.compare)v.last=0}));
window.__SFShaderQA={
 getStats:()=>({gpu:!!gl,programs:[...programs.keys()],errors:errors.slice(),group,shown:root.querySelectorAll('.shader-card').length,pins:[...pins],compare:compare.querySelectorAll('canvas').length,refs:refRoot?.querySelectorAll('.ref').length,views:[...allViews].map(v=>({id:v.id,frames:v.frames,rendered:v.ready,visible:v.visible,compare:v.compare,modal:!!v.canvas.closest('dialog')}))}),
 getPixel:(id)=>{const view=[...allViews].find(v=>v.id===id&&!v.compare);if(!view)return null;const c=view.canvas,ctx=view.ctx;const patch=ctx.getImageData(Math.floor(c.width*.4),Math.floor(c.height*.4),Math.min(25,c.width),Math.min(25,c.height)).data;let sum=0;for(let i=0;i<patch.length;i+=4)sum+=patch[i]*3+patch[i+1]*5+patch[i+2]*7;return sum},
 getPalette:id=>states.get(id)?.palette,
 getParams:id=>({intensity:states.get(id)?.intensity,speed:states.get(id)?.speed,paused:states.get(id)?.paused})
};
})();