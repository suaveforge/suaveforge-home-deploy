/* SuaveForge original Interactive Spatial Lab. A synthetic building and assembly, not an IFC/BIM model.
 * Three.js r180 (MIT). No third-party 3D model, demo image or source is copied.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
const viewport=document.querySelector('[data-spatial-viewport]');
const fallback=document.querySelector('[data-spatial-fallback]');
const summary=document.querySelector('[data-spatial-summary]');
const idLabel=document.querySelector('[data-scene-name]');
const xyz=document.querySelector('[data-scene-xyz]');
const sceneStatus=document.querySelector('[data-scene-status]');
if(viewport){
const state={mode:'building',theme:'structure',floor:-1,explode:false,auto:false,yaw:.73,pitch:.50,zoom:12.6,angle:0,moveEnd:0,scaleEnd:0,pulseStart:0,pulseKind:'',ready:false};
let renderer,camera,scene,clock,stage,building,device,grid,rafId,prevTime=0,resizeObserver;
const floors=[],parts=[],pickable=[],meshes=[];
let drag=null;
function displayFallback(text){fallback.hidden=false;sceneStatus.textContent='WEBGL 미지원';const msg=fallback.querySelector('[data-fallback-text]');if(msg)msg.textContent=text;viewport.dataset.webglReady='false'}
function box(parent,w,h,d,x,y,z,kind,opacity=.85,color='#d9e7f3',floor=-1,pick=false){
 const mat=new THREE.MeshStandardMaterial({color,transparent:true,opacity,depthWrite:opacity>.85,metalness:.17,roughness:.49,side:THREE.DoubleSide,emissive:color,emissiveIntensity:kind==='structure'?.02:.13});
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.userData={kind,base:opacity,floor,desired:opacity};parent.add(mesh);meshes.push(mesh);if(pick){pickable.push(mesh)}return mesh
}
function orb(parent,r,x,y,z,kind,opacity,color,floor=-1){
 const mat=new THREE.MeshStandardMaterial({color,metalness:.18,roughness:.29,transparent:true,opacity,depthWrite:false,emissive:color,emissiveIntensity:.4});const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,11,8),mat);mesh.position.set(x,y,z);mesh.userData={kind,base:opacity,desired:opacity,floor};parent.add(mesh);meshes.push(mesh);return mesh
}
function tube(parent,coords,r,kind,color,floor=-1,opacity=.9){
 const mat=new THREE.MeshStandardMaterial({color,metalness:.25,roughness:.27,transparent:true,opacity,depthWrite:false,emissive:color,emissiveIntensity:.15});
 const path=new THREE.CatmullRomCurve3(coords.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(15,coords.length*6),r,7,false),mat);m.userData={kind,base:opacity,desired:opacity,floor};parent.add(m);meshes.push(m);return m
}
function makeBuilding(){
 const g=new THREE.Group();
 for(let i=0;i<5;i++){
  const group=new THREE.Group();group.position.y=i*.83;group.userData.floor=i;g.add(group);floors.push(group);
  const slab=box(group,5.8,.17,4.2,0,0,0,'structure',.88,'#c3d7ee',i,true);slab.userData.clickable=true;
  box(group,5.9,.032,4.28,0,.104,0,'structure',.34,'#8baadc',i);
  for(const x of [-2.66,0,2.66])for(const z of [-1.91,1.91])box(group,.10,.72,.10,x,.43,z,'structure',.78,'#c1d8f3',i,true);
  for(const z of [-2.04,2.04])box(group,5.36,.67,.055,0,.46,z,'structure',.14,'#8fb9e4',i);
  for(const x of [-2.76,2.76])box(group,.055,.67,3.86,x,.46,0,'structure',.13,'#a9c4e7',i);
  box(group,1.18,.43,1.18,1.58,.32,-.91,'structure',.49,'#b3c4e0',i);
  for(const x of [-1.25,.43])box(group,.035,.46,3.6,x,.36,0,'structure',.13,'#c2d7ef',i);
  // Electrical routes & luminaires.
  tube(group,[[-2.15,.18,1.44],[-1.25,.18,1.44],[-1.25,.18,-.65],[.80,.18,-.65],[2.1,.18,-.65]],.055,'power','#f5bb65',i);
  for(const x of [-1.8,.18,1.7])orb(group,.083,x,.25,-.65,'power',.85,'#ffc66e',i);
  box(group,.64,.15,.34,2.05,.32,-1.37,'power',.94,'#eabb69',i);
  // Ventilation ducts.
  box(group,4.15,.17,.24,-.12,.60,.62,'hvac',.92,'#4fcec2',i);
  box(group,.22,.26,1.62,.85,.62,-.35,'hvac',.85,'#6ad7da',i);
  for(const x of [-1.75,-.4,1.05])box(group,.20,.20,.27,x,.57,.62,'hvac',.99,'#a4ece3',i);
  // Emergency path and alert.
  tube(group,[[-2.3,.17,-1.3],[-1.3,.17,-1.3],[-1.3,.17,.9],[.2,.17,.9],[1.85,.17,.9]],.048,'safety','#fa788e',i);
  orb(group,.115,2.03,.61,1.65,'safety',1,'#ff7e8e',i);
  box(group,.41,.23,.16,-2.16,.55,.9,'safety',.92,'#ff718d',i);
 }
 // Ground plinth, not part of picked floors
 box(g,6.45,.17,4.85,0,-.21,0,'structure',.78,'#516b94',-1);
 return g
}
function makeEquipment(){
 const g=new THREE.Group();
 const units=[];
 function part(label,y){const p=new THREE.Group();p.userData.label=label;p.position.y=y;g.add(p);units.push(p);return p}
 let p=part('차대',0);box(p,4.35,.32,3.18,0,.2,0,'structure',1,'#a8bfe0');for(const x of [-1.75,1.75])for(const z of [-1.18,1.18])box(p,.32,.48,.32,x,-.15,z,'structure',.92,'#c3d4e8');
 p=part('전장',.74);box(p,3.62,.20,2.62,0,.08,0,'power',.90,'#f5bb65');for(let i=0;i<5;i++)box(p,.17,.36,1.86,-1.35+i*.67,.31,0,'power',.9,i%2?'#e4a248':'#ffcb7e');
 tube(p,[[-1.8,.15,-1.14],[-1.6,.25,-.85],[-.15,.25,-.85],[.2,.25,.70],[1.5,.3,.70]],.06,'power','#ffbd68');
 p=part('공조 코어',1.41);box(p,3.50,.34,2.57,0,0,0,'hvac',.80,'#43bfbd');
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.71,.13,12,44),new THREE.MeshStandardMaterial({color:'#58d8d1',metalness:.6,roughness:.24,transparent:true,opacity:.94,emissive:'#2a8b89',emissiveIntensity:.13}));ring.rotation.x=Math.PI/2;ring.position.set(0,.29,0);p.add(ring);ring.userData={kind:'hvac',base:.94,desired:.94};meshes.push(ring);
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const blade=box(p,.28,.10,.87,Math.cos(a)*.32,.28,Math.sin(a)*.32,'hvac',.92,'#8ee3da');blade.rotation.y=-a}
 p=part('안전 감지',2.05);box(p,3.40,.17,2.37,0,0,0,'structure',.88,'#c3d4e7');for(const x of [-1.35,1.35])orb(p,.17,x,.18,.75,'safety',1,'#fa7e8e');
 tube(p,[[-1.4,.18,-.85],[-.35,.18,-.85],[.65,.18,-.85],[1.42,.18,.55]],.045,'safety','#fa8191');
 p=part('투명 커버',2.63);box(p,3.81,.64,2.78,0,.25,0,'structure',.17,'#b8daef');
 box(p,3.78,.12,2.76,0,.61,0,'structure',.79,'#c9dded');
 parts.push(...units);
 return g
}
function applyThemeTargets(){
 const mode=state.mode;for(const m of meshes){
   const owner=m.parent;const isEquipment=owner&&owner.parent===device||m.parent===device; // display determined by parent visibility, opacity still kept
   let mul=1;
   if(mode==='building'&&m.userData.floor!==undefined&&m.userData.floor>=0&&state.floor>=0&&m.userData.floor!==state.floor)mul=.21;
   const group=m.userData.kind;
   const wanted=state.theme==='structure'?group==='structure'?m.userData.base:Math.min(.08,m.userData.base*.16):group===state.theme?m.userData.base:group==='structure'?Math.min(.20,m.userData.base*.22):Math.min(.055,m.userData.base*.08);
   m.userData.desired=Math.max(.018,wanted*mul);
 }
}
function buttonState(){
 document.querySelectorAll('[data-scene-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sceneMode===state.mode)));
 document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===state.theme)));
 document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.floor)===state.floor)));
 const explode=document.querySelector('[data-explode]');explode.setAttribute('aria-pressed',String(state.explode));explode.textContent=state.explode?'층/부품 결합 ↙':'층/부품 분리 ↗';
 const auto=document.querySelector('[data-auto]');auto.setAttribute('aria-pressed',String(state.auto));auto.textContent=state.auto?'자동 회전 중지':'자동 회전';
 const themes={structure:'구조·외피',power:'전기·설비',hvac:'공조·환기',safety:'안전·소방'};
 const modeName=state.mode==='building'?'5층 건축 구조도':'모듈형 공조 장비';
 idLabel.textContent=modeName;
 const room=state.floor>=0?' · '+(state.floor+1)+'층 선택':' · 전체 층';
 summary.innerHTML='<b>'+modeName+'</b>에서 <b>'+themes[state.theme]+'</b> 객체를 강조합니다.'+(state.mode==='building'?room:' · 부품 분해를 지원합니다.')+' 선택한 객체 외에는 투명도를 낮추고 카메라·모델을 부드럽게 전환합니다.';
 viewport.dataset.sceneMode=state.mode;viewport.dataset.sceneTheme=state.theme;viewport.dataset.sceneFloor=String(state.floor);viewport.dataset.sceneExploded=String(state.explode);
 if(state.mode==='equipment'){document.querySelector('[data-floor-controls]').hidden=true}else document.querySelector('[data-floor-controls]').hidden=false;
 applyThemeTargets()
}
function setMode(mode){state.mode=mode;state.floor=-1;state.explode=false;state.zoom=mode==='building'?12.6:10.2;state.yaw=.72;state.pitch=.49;buttonState()}
function setTheme(theme){state.theme=theme;state.angle+=.12;buttonState()}
function chooseFloor(floor){state.floor=floor;buttonState()}
function toggleExplode(){state.explode=!state.explode;buttonState()}
function pulse(kind){const t=performance.now();if(kind==='rotate'){state.angle+=Math.PI*.6;viewport.dataset.lastMotion='rotate'}else if(kind==='move'||kind==='scale'){state.pulseStart=t;state.pulseProgress=0;state.pulseKind=kind;viewport.dataset.lastMotion=kind}else if(kind==='explode'){toggleExplode();viewport.dataset.lastMotion='explode'}}
function bind(){
 document.querySelectorAll('[data-scene-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.sceneMode)));
 document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
 document.querySelectorAll('[data-floor]').forEach(b=>b.addEventListener('click',()=>chooseFloor(Number(b.dataset.floor))));
 document.querySelector('[data-explode]').addEventListener('click',toggleExplode);
 document.querySelector('[data-auto]').addEventListener('click',()=>{state.auto=!state.auto;buttonState()});
 document.querySelector('[data-reset]').addEventListener('click',()=>{state.auto=false;state.angle=0;state.yaw=.73;state.pitch=.50;state.floor=-1;state.zoom=state.mode==='building'?12.6:10.2;state.explode=false;state.pulseKind='';buttonState()});
 document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>pulse(b.dataset.motion)));
 const canvas=renderer.domElement;
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;drag={startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;if(Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY)>5)drag.moved=true;if(drag.moved){state.yaw-=dx*.007;state.pitch=Math.max(.17,Math.min(1.17,state.pitch+dy*.006))}});
 canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&state.mode==='building'){const rect=canvas.getBoundingClientRect();const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));const ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(pickable,false);if(hits[0])chooseFloor(hits[0].object.userData.floor)}drag=null});
 canvas.addEventListener('pointercancel',()=>{drag=null});
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(7,Math.min(18,state.zoom+e.deltaY*.009))},{passive:false});
}
function init(){
try{
 if(!window.WebGLRenderingContext)throw new Error('WebGL 미지원');
 scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#d9e9ff','#243e64',2.2));const sun=new THREE.DirectionalLight('#e8f3ff',3.1);sun.position.set(6,11,9);scene.add(sun);const accent=new THREE.PointLight('#669cfe',65,18,2);accent.position.set(-5,5,-3);scene.add(accent);
 camera=new THREE.PerspectiveCamera(39,1,.1,75);
 stage=new THREE.Group();scene.add(stage);
 building=makeBuilding();device=makeEquipment();stage.add(building,device);
 grid=new THREE.GridHelper(14,20,'#385d8d','#264062');grid.position.y=-.37;grid.material.transparent=true;grid.material.opacity=.32;scene.add(grid);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;viewport.append(renderer.domElement);
 fallback.hidden=true;state.ready=true;viewport.dataset.webglReady='true';sceneStatus.textContent='LIVE WEBGL';bind();buttonState();function resize(){const r=viewport.getBoundingClientRect();const w=Math.max(100,Math.floor(r.width)),h=Math.max(100,Math.floor(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}resize();resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
 function step(t){
  rafId=requestAnimationFrame(step);const dt=Math.min((t-prevTime)/1000||.016,.06);prevTime=t;const ease=1-Math.exp(-dt*7.2);
  building.visible=state.mode==='building';device.visible=state.mode==='equipment';
  const m=state.mode==='building'?building:device;
  const other=state.mode==='building'?device:building;
  if(state.auto)state.angle+=dt*.22;
  stage.rotation.y+=(state.angle-stage.rotation.y)*ease;
  for(let i=0;i<floors.length;i++){const f=floors[i];const goal=i*(state.explode?1.20:.83);f.position.y+=(goal-f.position.y)*ease;const scale=state.floor===i?1.045:1;f.scale.setScalar(f.scale.x+(scale-f.scale.x)*ease);}
  for(let i=0;i<parts.length;i++){const p=parts[i],base=[0,.74,1.41,2.05,2.63][i];const desired=base+(state.explode?i*.42:0);p.position.y+=(desired-p.position.y)*ease;const desiredX=state.explode?(i%2===0?.15:-.15):0;p.position.x+=(desiredX-p.position.x)*ease;}
  let pulseScale=1,pulseX=0;if(state.pulseKind){state.pulseProgress=Math.min(1,(state.pulseProgress||0)+dt/1.15);const progress=state.pulseProgress,value=Math.sin(progress*Math.PI);if(state.pulseKind==='move')pulseX=value*1.15;if(state.pulseKind==='scale')pulseScale=1+value*.25;if(progress>=1)state.pulseKind=''}
  stage.position.x+=(pulseX-stage.position.x)*ease;const s=stage.scale.x+(pulseScale-stage.scale.x)*ease;stage.scale.setScalar(s);
  for(const obj of meshes){if(!obj.material||!obj.userData.desired)continue;obj.material.opacity+=(obj.userData.desired-obj.material.opacity)*ease;}
  const ytarget=state.mode==='building'?(state.floor>=0?state.floor*(state.explode?1.20:.83)+.30:2.0):1.45;
  const target=new THREE.Vector3(0,ytarget,0);const cos=Math.cos(state.pitch);const wanted=new THREE.Vector3(Math.sin(state.yaw)*cos*state.zoom,ytarget+Math.sin(state.pitch)*state.zoom,Math.cos(state.yaw)*cos*state.zoom);
  camera.position.lerp(wanted,ease*.72);camera.lookAt(target);xyz.textContent='YAW '+Math.round(state.yaw*180/Math.PI)+'° · ZOOM '+state.zoom.toFixed(1)+'m';
  renderer.render(scene,camera)
 }rafId=requestAnimationFrame(step);
 return true
}catch(e){console.warn('Interactive spatial init failed',e);displayFallback('현재 브라우저에서 3D 엔진을 실행할 수 없습니다. WebGL 지원 여부를 확인하세요.');return false}
}
init();
window.__sfInteractiveQA={snapshot:()=>({ready:state.ready,mode:state.mode,theme:state.theme,floor:state.floor,explode:state.explode,rotation:stage?.rotation.y||0,scale:stage?.scale.x||1,position:stage?.position.x||0,levels:floors.map(f=>Number(f.position.y.toFixed(3))),parts:parts.map(p=>Number(p.position.y.toFixed(3))),pickable:pickable.length,sceneObjects:meshes.length})};
window.addEventListener('pagehide',()=>{if(rafId)cancelAnimationFrame(rafId);resizeObserver?.disconnect();renderer?.dispose()},{once:true});
}
