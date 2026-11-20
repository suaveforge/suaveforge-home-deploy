/* SuaveForge Research — Physics Simulation Lab UI.
 * All physical solvers are locally authored in models.js. No remote runtime dependencies.
 * Fixed timestep 1/90 s, capped catch-up for throttled tabs, canvas render on visibility.
 */
(function(){
'use strict';
const core=window.SFPhysicsModels;
const grid=document.querySelector('[data-physics-grid]');
const filter=document.querySelector('[data-physics-filters]');
const search=document.querySelector('[data-physics-search]');
const counter=document.querySelector('[data-physics-count]');
const empty=document.querySelector('[data-physics-empty]');
const dialog=document.querySelector('[data-physics-modal]');
const dialogBody=document.querySelector('[data-physics-modal-body]');
const dialogTitle=document.querySelector('[data-physics-modal-title]');
if(!core||!grid||!filter||!search)return;
const defs=[
{id:'collision',group:'rigid',no:'01',title:'강체 입자 충돌',subtitle:'운동량 교환과 반발계수 기반 2D 다물체 충돌',type:'IMPULSE · 2D',param:'반발계수',min:.2,max:1,step:.05,value:.8,unit:'',usage:'빈 공간을 클릭해 공을 추가',equation:'충격량 · 운동량 보존',source:'https://brm.io/matter-js/demo/'},
{id:'projectile',group:'rigid',no:'02',title:'포물선 탄도',subtitle:'중력·초기 속도·각도를 적용한 투사체 운동',type:'NEWTON · BALLISTIC',param:'발사 각도',min:20,max:75,step:1,value:51,unit:'°',usage:'클릭하면 다시 발사',equation:'x¨=0 · y¨=g',source:'https://www.myphysicslab.com/'},
{id:'cloth',group:'soft',no:'03',title:'천 · Verlet Mesh',subtitle:'연결 거리 제약으로 중력과 천의 변형을 계산',type:'VERLET · CLOTH',param:'바람 강도',min:-1,max:1,step:.1,value:.5,unit:'',usage:'천의 점을 잡아 당겨보기',equation:'Verlet · 거리 제약',source:'https://matthias-research.github.io/pages/tenMinutePhysics/index.html'},
{id:'rope',group:'soft',no:'04',title:'줄 · 거리 제약',subtitle:'연결된 질점과 반복 제약 해석을 통한 로프 운동',type:'PBD · ROPE',param:'중력 강도',min:2,max:18,step:1,value:11,unit:'',usage:'로프 끝을 드래그',equation:'Position-based constraints',source:'https://matthias-research.github.io/pages/tenMinutePhysics/index.html'},
{id:'fluid',group:'fluid',no:'05',title:'입자 기반 액체 근사',subtitle:'중력·근접 입자 분리·경계 압력을 적용한 간소 모형',type:'PARTICLES · APPROX.',param:'중력 계수',min:.3,max:2,step:.1,value:1,unit:'×',usage:'캔버스를 클릭해 액체 추가',equation:'Particle constraints · NOT CFD',source:'https://matthias-research.github.io/pages/tenMinutePhysics/index.html'},
{id:'shallow',group:'fluid',no:'06',title:'수면파 · 높이장',subtitle:'공간 격자의 수면 높이를 시간 차분으로 적분',type:'HEIGHTFIELD · 1D',param:'파동 계수',min:20,max:110,step:5,value:62,unit:'',usage:'수면을 클릭해 파문 생성',equation:'∂²η/∂t² ≈ c²∇²η',source:'https://www.falstad.com/mathphysics.html'},
{id:'spring',group:'wave',no:'07',title:'감쇠 스프링 진동',subtitle:'질량·복원력·감쇠력을 고려한 실시간 탄성 진동',type:'OSCILLATOR · ODE',param:'강성 k',min:4,max:40,step:1,value:22,unit:'',usage:'물체를 드래그해 진폭 변경',equation:'m x¨ + c x˙ + kx = 0',source:'https://www.myphysicslab.com/'},
{id:'doublepend',group:'wave',no:'08',title:'이중 진자 · 카오스',subtitle:'비선형 연립 운동방정식을 RK4 적분으로 계산',type:'CHAOS · RK4',param:'중력 g',min:2,max:18,step:1,value:10,unit:'',usage:'클릭하면 시작각 변경',equation:'Lagrangian coupled ODEs',source:'https://www.myphysicslab.com/pendulum/double-pendulum-en.html'},
{id:'orbit',group:'gravity',no:'09',title:'인공위성 궤도',subtitle:'중심 중력의 역제곱 법칙에 따른 입자 공전',type:'KEPLER · ORBIT',param:'중력 μ',min:3,max:8,step:.5,value:6,unit:'',usage:'빈 공간을 클릭해 위성 생성',equation:'a = −μr/|r|³',source:'https://phet.colorado.edu/en/simulations/gravity-and-orbits'},
{id:'nbody',group:'gravity',no:'10',title:'N-body 중력계',subtitle:'여러 질점이 각자 만드는 중력장을 서로 계산',type:'N-BODY · GRAVITY',param:'인력 강도',min:1,max:8,step:.5,value:4.3,unit:'',usage:'화면을 클릭해 큰 질량 추가',equation:'Pairwise softened gravity',source:'https://www.myphysicslab.com/'},
{id:'electric',group:'electro',no:'11',title:'전기장 · 시험 전하',subtitle:'양전하·음전하의 합성 전기장과 이동 경로 탐색',type:'COULOMB · FIELD',param:'전하 계수',min:.2,max:3,step:.2,value:1,unit:'×',usage:'빈 곳을 클릭해 전하 위치 이동',equation:'E ∝ Σ(qr/|r|³)',source:'https://www.falstad.com/mathphysics.html'},
{id:'optics',group:'electro',no:'12',title:'빛의 굴절 · 스넬 법칙',subtitle:'매질 굴절률에 따른 입사각·굴절각 수치 계산',type:'OPTICS · SNELL',param:'매질 굴절률',min:1.05,max:2.2,step:.05,value:1.5,unit:'',usage:'광선을 클릭해 입사각 변경',equation:'n₁sinθ₁ = n₂sinθ₂',source:'https://www.falstad.com/mathphysics.html'}
];
const groups={all:'전체 12종',rigid:'강체·충돌',soft:'연체·천',fluid:'유체·입자',wave:'파동·진동',gravity:'중력·천체',electro:'전자기·광학'};
const sources=[
{group:'rigid',name:'Rapier 2D / 3D',type:'Physics Engine',desc:'Rust·WebAssembly 기반 충돌·관절·강체 데모. 실제 게임·로봇 시뮬레이션 구현 후보.',url:'https://rapier.rs/demos/',license:'오픈소스 / 상용 적용 시 버전별 확인'},
{group:'rigid',name:'Matter.js',type:'2D Physics Sandbox',desc:'중력·충돌·마찰·제약·반발계수 조작이 가능한 2D 실시간 갤러리.',url:'https://brm.io/matter-js/demo/',license:'MIT 엔진'},
{group:'rigid',name:'Planck.js',type:'2D Dynamics Engine',desc:'Box2D 기반 강체 물리 엔진과 예제들.',url:'https://piqnt.com/planck.js/',license:'프로젝트 라이선스 확인'},
{group:'soft',name:'Ten Minute Physics',type:'Numerical Physics Tutorials',desc:'XPBD·로프·천·연체·충돌·FLIP 물·높이장 등의 코드와 브라우저 실행 사례.',url:'https://matthias-research.github.io/pages/tenMinutePhysics/index.html',license:'개별 예제 저작권 확인'},
{group:'soft',name:'Ten Minute Physics Contributions',type:'Community Physics Demos',desc:'다양한 위치 기반 역학과 입자·강체 알고리즘 커뮤니티 예제.',url:'https://matthias-research.github.io/pages/tenMinutePhysics/contribs/index.html',license:'기여작 개별 확인'},
{group:'fluid',name:'WebGPU Compute Explorations',type:'GPU Simulation',desc:'브라우저 WebGPU 기반 입자·유체·천·시뮬레이션 실험 자료.',url:'https://scttfrdmn.github.io/webgpu-compute-exploration/',license:'예제별 라이선스 확인'},
{group:'fluid',name:'Falstad Ripple Tank',type:'Wave & Fluid Laboratory',desc:'2차원 파동, 간섭, 회절, 굴절, 위상 변화를 조절하는 대화형 실험.',url:'https://www.falstad.com/ripple/',license:'사이트·소스 사용 조건 확인'},
{group:'wave',name:'myPhysicsLab',type:'Mathematical Physics',desc:'단진자·이중진자·스프링·카오스·강체 접촉과 운동방정식.',url:'https://www.myphysicslab.com/',license:'소스/개별 예제 조건 확인'},
{group:'wave',name:'Falstad Math Physics',type:'Waves & Oscillators',desc:'진동·파동·음향·전기장·자기장·광학 등 전문 물리 시뮬레이션 목록.',url:'https://www.falstad.com/mathphysics.html',license:'사이트·소스 사용 조건 확인'},
{group:'gravity',name:'PhET Gravity and Orbits',type:'Educational Simulation',desc:'질량·궤도·중력장을 교육용으로 이해하는 인터랙티브 실험.',url:'https://phet.colorado.edu/en/simulations/gravity-and-orbits',license:'CC BY-NC 4.0 / 상업적 이용 별도 허가'},
{group:'gravity',name:'Rapier 3D Joint Physics',type:'High-performance Dynamics',desc:'3차원 강체·연결 조인트·물리 동작을 비교할 수 있는 실시간 데모.',url:'https://rapier.rs/demos/',license:'엔진 사용권 확인'},
{group:'electro',name:'Falstad EM Field Applets',type:'Electromagnetism',desc:'2D·3D 전기장, 자기장, 회로 및 전자기파 시뮬레이션.',url:'https://www.falstad.com/mathphysics.html',license:'자료 원본 재배포 전 허가 확인'},
{group:'electro',name:'PhET Circuit Construction Kit',type:'Interactive Circuits',desc:'부품 연결·저항·전류를 시각적으로 시험하는 회로 교육 실험.',url:'https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc',license:'CC BY-NC 4.0 / 상업적 이용 별도 허가'},
{group:'electro',name:'PhET Geometric Optics',type:'Light & Optics',desc:'렌즈·굴절·빛의 경로에 대한 교육용 인터랙티브 시뮬레이션.',url:'https://phet.colorado.edu/en/simulations/geometric-optics',license:'CC BY-NC 4.0 / 상업적 이용 별도 허가'}
];
window.SFPhysicsCatalog={demos:defs.map(d=>({id:d.id,title:d.title,group:d.group})),groups,sources:sources.length};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const alive=new Set();let selected='all',query='',lastTick=0,observer;
function html(d){return '<article class="sim-card" data-physics-card="'+d.id+'" data-group="'+d.group+'"><header class="sim-head"><div><span class="sim-num">'+d.no+' / '+esc(groups[d.group])+'</span><h3>'+esc(d.title)+'</h3><p>'+esc(d.subtitle)+'</p></div><span class="sim-tag">'+esc(d.type)+'</span></header><div class="sim-canvas-box"><span class="sim-label">'+esc(d.type)+'</span><canvas data-physics-canvas="'+d.id+'" role="img" aria-label="'+esc(d.title)+' 직접 실행 캔버스"></canvas></div><div class="sim-status"><span data-status>실시간 계산</span><small>'+esc(d.equation)+'</small></div><div class="sim-controls"><div class="sliderline"><label for="p-'+d.id+'">'+esc(d.param)+'</label><input id="p-'+d.id+'" type="range" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.value+'" aria-label="'+esc(d.param)+'"><output data-param-output>'+d.value+d.unit+'</output></div><div class="buttonline"><button type="button" data-toggle>일시정지</button><button type="button" data-reset>초기화</button><button type="button" data-expand>크게 보기 ↗</button></div></div><footer class="sim-foot"><span>'+esc(d.usage)+'</span><a href="'+esc(d.source)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(d.title)+' 관련 공식 기술 예제">기술 참고 ↗</a></footer></article>'}
function create(card,d,isModal=false){
 const model=core.engines[d.id]();model.reset();const canvas=card.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx){card.querySelector('.sim-canvas-box').insertAdjacentText('beforeend','Canvas 2D 미지원');return}
 const instance={id:d.id,model,card,canvas,ctx,d,paused:false,param:d.value,acc:0,visible:isModal,steps:0,interactions:0,rendered:0,clicking:false,pointerX:0,pointerY:0};
 alive.add(instance);
 function resize(){const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const dpr=Math.min(2,devicePixelRatio||1);const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}ctx.setTransform(canvas.width/core.W,0,0,canvas.height/core.H,0,0);}
 const resizeObserver=new ResizeObserver(()=>{resize();render()});resizeObserver.observe(canvas);instance.resizeObserver=resizeObserver;
 function render(){resize();ctx.fillStyle='#11243d';ctx.fillRect(0,0,core.W,core.H);model.draw(ctx);instance.rendered++;card.dataset.rendered='true';card.dataset.steps=String(instance.steps)}
 function status(){const s=card.querySelector('[data-status]');s.textContent=instance.paused?'일시정지':'실시간 계산';s.classList.toggle('paused',instance.paused)}
 card.querySelector('[data-toggle]').addEventListener('click',()=>{instance.paused=!instance.paused;card.querySelector('[data-toggle]').textContent=instance.paused?'다시 시작':'일시정지';status();render()});
 card.querySelector('[data-reset]').addEventListener('click',()=>{model.reset();instance.steps=0;instance.paused=false;instance.acc=0;card.querySelector('[data-toggle]').textContent='일시정지';status();render()});
 const input=card.querySelector('input[type=range]');input.addEventListener('input',()=>{instance.param=Number(input.value);card.querySelector('[data-param-output]').textContent=input.value+d.unit;instance.interactions++;render()});
 if(!isModal)card.querySelector('[data-expand]').addEventListener('click',()=>open(d));
 else card.querySelector('[data-expand]').remove();
 const pos=(e)=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*core.W/r.width,y:(e.clientY-r.top)*core.H/r.height}};
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();const p=pos(e);instance.clicking=true;instance.interactions++;instance.pointerX=p.x;instance.pointerY=p.y;canvas.setPointerCapture(e.pointerId);model.pointer?.(p.x,p.y,'down');render()});
 canvas.addEventListener('pointermove',e=>{if(!instance.clicking)return;const p=pos(e);instance.pointerX=p.x;instance.pointerY=p.y;model.pointer?.(p.x,p.y,'move');render()});
 const up=e=>{if(!instance.clicking)return;instance.clicking=false;const p=pos(e);model.pointer?.(p.x,p.y,'up');render()};canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 instance.render=render;instance.step=(dt)=>{if(instance.paused||!instance.visible)return;const fixed=1/90;instance.acc=Math.min(.065,instance.acc+dt);let n=0;while(instance.acc>=fixed&&n<4){model.step(fixed,instance.param);instance.steps++;instance.acc-=fixed;n++}if(n)render()};
 instance.dispose=()=>{alive.delete(instance);resizeObserver.disconnect()};
 render();status();return instance
}
function clear(){for(const inst of [...alive])if(!inst.card.closest('dialog'))inst.dispose();observer?.disconnect()}
function show(){clear();const found=defs.filter(d=>(selected==='all'||d.group===selected)&&[d.title,d.subtitle,d.param,d.equation,groups[d.group]].join(' ').toLocaleLowerCase().includes(query));grid.innerHTML=found.map(html).join('');empty.hidden=found.length>0;counter.textContent=found.length+' / 12개 실행 시뮬레이션';filter.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===selected)));
 const instances=[];for(const card of grid.querySelectorAll('[data-physics-card]')){const d=defs.find(x=>x.id===card.dataset.physicsCard),inst=create(card,d);instances.push(inst)}
 observer=new IntersectionObserver(entries=>{for(const e of entries){const inst=instances.find(i=>i.canvas===e.target);if(inst)inst.visible=e.isIntersecting}},{rootMargin:'80px 0px 80px 0px',threshold:0});instances.forEach(i=>observer.observe(i.canvas))}
function open(d){dialogTitle.textContent=d.title;dialogBody.innerHTML=html(d);dialog.showModal();const inst=create(dialogBody.querySelector('.sim-card'),d,true);dialog._instance=inst;dialog.dataset.active=d.id;}
dialog?.addEventListener('close',()=>{dialog._instance?.dispose();dialog._instance=null;dialogBody.replaceChildren();dialog.dataset.active=''});
document.querySelector('[data-modal-close]')?.addEventListener('click',()=>dialog.close());
Object.entries(groups).forEach(([id,name])=>{const btn=document.createElement('button');btn.type='button';btn.dataset.category=id;btn.textContent=name;btn.setAttribute('aria-pressed',String(id===selected));btn.addEventListener('click',()=>{selected=id;show()});filter.append(btn)});
search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase();show()});
const reference=document.querySelector('[data-physics-references]');
if(reference){reference.innerHTML=sources.map(s=>'<article class="ref-card"><span class="type">'+esc(groups[s.group])+' / '+esc(s.type)+'</span><h3>'+esc(s.name)+'</h3><p>'+esc(s.desc)+'</p><small>'+esc(s.license)+'</small><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(s.name)+' 공식 예제 보기">공식 예제 열기 ↗</a></article>').join('')}
show();
function loop(t){if(!lastTick)lastTick=t;const dt=Math.min(.05,(t-lastTick)/1000);lastTick=t;for(const inst of alive)inst.step(dt);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
window.__SFPhysicsLab={stats:()=>[...alive].map(i=>({id:i.id,paused:i.paused,visible:i.visible,steps:i.steps,rendered:i.rendered,interactions:i.interactions,param:i.param,metric:i.model.metric?.(),canvasW:i.canvas.width,canvasH:i.canvas.height})),filters:()=>({selected,query,shown:grid.querySelectorAll('[data-physics-card]').length}),references:()=>sources.length};
})();