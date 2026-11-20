/* SuaveForge Physics Lab — original educational numerical experiments (no imported demo code).
 * All solvers are intentionally simplified and run at a fixed timestep.
 * Canvas world: 360 × 240. Not engineering-certified or CFD-validated.
 */
(function(){
'use strict';
const W=360,H=240,PI=Math.PI,TAU=2*PI;
const PAL=['#73a0ff','#46d7c5','#f5b86f','#dd88ef','#fa7798','#8ec7f7'];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rnd=(i)=>{const n=Math.sin(i*78.233+4.92)*43758.5453;return n-Math.floor(n)};
const hypot=Math.hypot;
function grid(ctx){ctx.save();ctx.lineWidth=.6;ctx.strokeStyle='rgba(151,184,226,.10)';for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.restore()}
function label(ctx,text,x,y,color='#b7cce8'){ctx.fillStyle=color;ctx.font='10px Arial,sans-serif';ctx.fillText(text,x,y)}
function circle(ctx,x,y,r,color,glow=0){ctx.save();if(glow){ctx.shadowBlur=glow;ctx.shadowColor=color}ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill();ctx.restore()}
function path(ctx,points,color,width=2,close=false){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke()}
function line(ctx,x1,y1,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function ground(ctx,y=222){line(ctx,12,y,348,y,'#7394bf',1.5);for(let x=15;x<347;x+=24)line(ctx,x,y+3,x+7,y+9,'#476786',1)}
function hud(ctx,text){ctx.fillStyle='rgba(14,31,54,.72)';ctx.fillRect(10,206,340,21);label(ctx,text,20,220,'#9ec4ee')}
function collisions(){
 let balls=[],collisions=0;
 function reset(){collisions=0;balls=Array.from({length:9},(_,i)=>({x:55+(i%5)*44,y:42+Math.floor(i/5)*35,vx:(rnd(i+5)-.5)*145,vy:-rnd(i+11)*45,r:11+(i%3)*2,m:1+(i%3)*.4,color:PAL[i%PAL.length]}))}
 function step(dt,p){for(const b of balls){b.vy+=380*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.999;
  if(b.x<b.r+12){b.x=b.r+12;b.vx=Math.abs(b.vx)*p}
  if(b.x>348-b.r){b.x=348-b.r;b.vx=-Math.abs(b.vx)*p}
  if(b.y>220-b.r){b.y=220-b.r;b.vy=-Math.abs(b.vy)*p;b.vx*=.993}
  if(b.y<b.r+7){b.y=b.r+7;b.vy=Math.abs(b.vy)*p}}
 for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j];let dx=b.x-a.x,dy=b.y-a.y,d=hypot(dx,dy)||.001;const overlap=a.r+b.r-d;if(overlap<=0)continue;let nx=dx/d,ny=dy/d;const mass=a.m+b.m;a.x-=nx*overlap*b.m/mass;b.x+=nx*overlap*a.m/mass;a.y-=ny*overlap*b.m/mass;b.y+=ny*overlap*a.m/mass;const vel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(vel<0){const impulse=-(1+p)*vel/(1/a.m+1/b.m);a.vx-=impulse*nx/a.m;a.vy-=impulse*ny/a.m;b.vx+=impulse*nx/b.m;b.vy+=impulse*ny/b.m;collisions++}}}
 function draw(c){grid(c);ground(c);for(const b of balls){circle(c,b.x,b.y,b.r,b.color,9);circle(c,b.x-3,b.y-4,2.5,'#ffffffb5')}hud(c,'IMPULSE COLLISIONS  '+String(collisions).padStart(4,'0')+'    RESTITUTION '+Math.round(pVal*100)+'%')}
 let pVal=.81;
 return {reset,step:(dt,p)=>{pVal=p;step(dt,p)},draw,pointer(x,y){balls.push({x:clamp(x,17,342),y:clamp(y,17,200),vx:(rnd(balls.length*7)-.5)*180,vy:-100,r:12,m:1.1,color:PAL[balls.length%PAL.length]});if(balls.length>18)balls.shift()},metric:()=>({collisions,objects:balls.length,x:balls[0]?.x,y:balls[0]?.y})}
}
function projectile(){
 let ball,trail=[],time=0,travel=0,angle=51;
 function reset(){const a=angle*PI/180;ball={x:26,y:203,vx:210*Math.cos(a),vy:-210*Math.sin(a)};trail=[];time=0;travel=0}
 function step(dt,p){if(p!==angle){angle=p;reset()}time+=dt;ball.vy+=285*dt;ball.vx*=1-.045*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;travel=Math.max(travel,ball.x-26);if(trail.length===0||time%1<.5)trail.push([ball.x,ball.y]);if(trail.length>90)trail.shift();if(ball.y>=203){ball.y=203;ball.vy*=-.25;ball.vx*=.75;if(time>2.3)reset()}if(ball.x>350||time>5)reset()}
 function draw(c){grid(c);ground(c,217);path(c,[[22,205],[42,205],[42,215],[22,215]],'#90aee3',3);if(trail.length>1)path(c,trail,'#6899ff95',2);line(c,26,206,26+80*Math.cos(angle*PI/180),206-80*Math.sin(angle*PI/180),'#9ebaf2',1);circle(c,ball.x,ball.y,8,'#f8bb74',13);label(c,'INITIAL SPEED 210 PX/S',18,27);hud(c,'RANGE '+Math.round(travel)+'px   ANGLE '+angle+'°   g=285')}
 return {reset,step,draw,pointer(){reset()},metric:()=>({x:ball.x,y:ball.y,range:travel,time})}
}
function buildConstraints(points,w,h,diagonal=false){const edges=[];function edge(a,b){const dx=points[a].x-points[b].x,dy=points[a].y-points[b].y;edges.push([a,b,hypot(dx,dy)])}for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i;if(i<w-1)edge(k,k+1);if(j<h-1)edge(k,k+w);if(diagonal&&i<w-1&&j<h-1){edge(k,k+w+1);edge(k+1,k+w)}}return edges}
function constraints(points,edges,iters,drag){for(let k=0;k<iters;k++)for(const [ia,ib,rest] of edges){const a=points[ia],b=points[ib];let dx=b.x-a.x,dy=b.y-a.y,d=hypot(dx,dy)||.0001;const diff=(d-rest)/d,freeA=(!a.fixed&&drag!==ia)?1:0,freeB=(!b.fixed&&drag!==ib)?1:0,div=freeA+freeB||1;if(freeA){a.x+=dx*diff*freeA/div;a.y+=dy*diff*freeA/div}if(freeB){b.x-=dx*diff*freeB/div;b.y-=dy*diff*freeB/div}}}
function cloth(){
 let points,edges,held=-1,wind=0;
 function reset(){points=[];const nx=13,ny=8;for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=50+i*21.5,y=30+j*21;points.push({x,y,oldX:x,oldY:y,fixed:j===0&&(i%3===0||i===nx-1)})}edges=buildConstraints(points,nx,ny,true);held=-1}
 function step(dt,p){wind=p;for(let i=0;i<points.length;i++){const n=points[i];if(n.fixed||i===held)continue;let vx=(n.x-n.oldX)*.993,vy=(n.y-n.oldY)*.993;n.oldX=n.x;n.oldY=n.y;n.x+=vx+Math.sin(i*.5+elapsed*1.3)*p*115*dt*dt;n.y+=vy+400*dt*dt;n.x=clamp(n.x,12,348);n.y=clamp(n.y,10,218)}constraints(points,edges,4,held)}
 let elapsed=0;
 function render(c){grid(c);for(const [ia,ib] of edges){const a=points[ia],b=points[ib];if(Math.abs(ia-ib)!==1&&Math.abs(ia-ib)!==13)continue;line(c,a.x,a.y,b.x,b.y,'#5c9ce3aa',1.25)}for(let i=0;i<points.length;i++){const n=points[i];circle(c,n.x,n.y,n.fixed?3.3:1.9,n.fixed?'#f3b76c':i===held?'#fff':'#54d1c6',n.fixed?3:0)}hud(c,'VERLET CLOTH  13×8 NODES · WIND '+pFmt(wind))}
 function pFmt(v){return v>=0?'+'+v.toFixed(1):v.toFixed(1)}
 function pointer(x,y,type){if(type==='up'){held=-1;return}if(type==='move'&&held>=0){const p=points[held];p.x=clamp(x,15,345);p.y=clamp(y,12,210);p.oldX=p.x;p.oldY=p.y;return}if(type==='down'){let best=9999;for(let i=0;i<points.length;i++){const p=points[i],d=hypot(p.x-x,p.y-y);if(d<best&&!p.fixed){best=d;held=i}}if(best>36)held=-1}}
 return {reset,step:(dt,p)=>{elapsed+=dt;step(dt,p)},draw:render,pointer,metric:()=>({held,nodes:points.length,x:points[42].x,y:points[42].y})}
}
function rope(){
 let points=[],edges=[],held=-1,gravity=11;
 function reset(){points=Array.from({length:18},(_,i)=>{const x=177+Math.sin(i*.28)*i*1.65,y=20+i*10.8;return {x,y,oldX:x,oldY:y,fixed:i===0}});edges=points.slice(1).map((_,i)=>[i,i+1,11]);held=-1}
 function step(dt,p){gravity=p;for(let i=1;i<points.length;i++){if(held===i)continue;const a=points[i],vx=(a.x-a.oldX)*.996,vy=(a.y-a.oldY)*.996;a.oldX=a.x;a.oldY=a.y;a.x+=vx;a.y+=vy+p*33*dt*dt;a.x=clamp(a.x,10,350);a.y=clamp(a.y,10,219)}constraints(points,edges,9,held)}
 function draw(c){grid(c);let pts=points.map(a=>[a.x,a.y]);path(c,pts,'#70b5ec',4);points.forEach((a,i)=>circle(c,a.x,a.y,i===0||i===held?5:2.8,i===0?'#f5bf7a':i===held?'#fff':'#74d5d0',2));circle(c,points.at(-1).x,points.at(-1).y,9,'#f6b981',8);hud(c,'DISTANCE CONSTRAINTS · GRAVITY '+gravity.toFixed(1))}
 function pointer(x,y,type){if(type==='up'){held=-1;return}if(type==='move'&&held>=0){points[held].x=x;points[held].y=y;return}if(type==='down'){let k=-1,d=30;for(let i=1;i<points.length;i++){const a=points[i],n=hypot(a.x-x,a.y-y);if(n<d){d=n;k=i}}held=k}}
 return {reset,step,draw,pointer,metric:()=>({x:points.at(-1).x,y:points.at(-1).y,held,segments:17})}
}
function waterParticles(){
 let parts=[],touch=0;
 function reset(){parts=Array.from({length:80},(_,i)=>({x:86+(i%10)*9,y:22+Math.floor(i/10)*10,vx:(rnd(i+90)-.5)*4,vy:0}));touch=0}
 function step(dt,p){const g=200*p;for(const a of parts){a.vy+=g*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.vx*=.996;a.vy*=.996}
 // Position based neighbour overlap and boundary confinement; deliberately simplified liquid approximation.
 for(let loop=0;loop<3;loop++){for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const a=parts[i],b=parts[j],dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2<80&&d2>.0001){const d=Math.sqrt(d2),m=(9-d)*.30/d;a.x-=dx*m;a.y-=dy*m;b.x+=dx*m;b.y+=dy*m}}
 for(const a of parts){if(a.x<36){a.x=36;a.vx=Math.abs(a.vx)*.16}if(a.x>325){a.x=325;a.vx=-Math.abs(a.vx)*.16}if(a.y>214){a.y=214;a.vy=-Math.abs(a.vy)*.13;a.vx*=.95}if(a.y<18){a.y=18;a.vy=Math.abs(a.vy)*.16}}}}
 function draw(c){grid(c);c.fillStyle='#2a6b9d29';c.fillRect(23,42,316,181);line(c,25,45,25,224,'#7ba9d0',2);line(c,335,45,335,224,'#7ba9d0',2);line(c,25,224,335,224,'#7ba9d0',2);for(const p of parts)circle(c,p.x,p.y,5.5,'#5ccddde0',4);hud(c,'PARTICLE FLUID APPROX.  '+parts.length+' DROPLETS · '+touch+' SPLASHES')}
 function pointer(x,y,type){if(type!=='down')return;touch++;for(let i=0;i<10;i++)parts.push({x:clamp(x+(rnd(i+touch*7)-.5)*32,37,323),y:clamp(y+(rnd(i+touch*5)-.5)*15,19,210),vx:(rnd(i+touch*11)-.5)*120,vy:-rnd(i+touch*9)*90});if(parts.length>110)parts.splice(0,parts.length-110)}
 return {reset,step,draw,pointer,metric:()=>({particles:parts.length,y:parts[0]?.y,splashes:touch})}
}
function surfaceWaves(){
 const N=134;let h=[],v=[],clock=0;
 function reset(){h=Array.from({length:N},(_,i)=>Math.exp(-Math.pow((i-36)/8,2))*23+Math.exp(-Math.pow((i-94)/11,2))*(-12));v=new Array(N).fill(0);clock=0}
 function step(dt,p){clock+=dt;const factor=p*22;for(let i=1;i<N-1;i++){const force=(h[i-1]-2*h[i]+h[i+1])*factor;v[i]=(v[i]+force*dt)*(1-1.2*dt)}for(let i=1;i<N-1;i++)h[i]+=v[i]*dt;h[0]=h[1];h[N-1]=h[N-2]}
 function draw(c){grid(c);const pts=h.map((e,i)=>[20+i*(320/(N-1)),151-e]);c.beginPath();c.moveTo(20,230);pts.forEach(p=>c.lineTo(p[0],p[1]));c.lineTo(340,230);c.closePath();c.fillStyle='#48a8d447';c.fill();path(c,pts,'#5dd9dd',2.5);line(c,20,153,340,153,'#7b9ec059',1);hud(c,'1D SHALLOW WATER / WAVE EQUATION · C '+pVal)}
 let pVal=62;
 function pointer(x,y,type){if(type!=='down'&&type!=='move')return;const k=Math.round(clamp((x-20)/320,0,1)*(N-1));for(let i=0;i<N;i++)h[i]+=Math.exp(-Math.pow((i-k)/4.5,2))*((151-y)*.31)}
 return {reset,step:(dt,p)=>{pVal=p;step(dt,p)},draw,pointer,metric:()=>({amplitude:Math.max(...h)-Math.min(...h),sample:h[68],time:clock})}
}
function spring(){
 let x=58,v=0,t=0,k=22;function reset(){x=63;v=0;t=0}
 function step(dt,p){k=p;t+=dt;const accel=-k*x-.57*v;v+=accel*dt;x+=v*dt}
 function draw(c){grid(c);const cx=193+x;line(c,36,120,322,120,'#597fae',2);const pts=[[48,120]];for(let i=0;i<14;i++)pts.push([48+(cx-77)*((i+1)/15),120+(i%2===0?-13:13)]);pts.push([cx-28,120]);path(c,pts,'#9cd1fb',2.5);c.fillStyle='#7595e44e';c.fillRect(cx-24,102,48,36);c.strokeStyle='#9cd5f7';c.lineWidth=2;c.strokeRect(cx-24,102,48,36);circle(c,cx,120,7,'#f2b56c',8);line(c,193,70,193,155,'#7c9bb85b',1);label(c,'E = '+Math.round(.5*k*x*x+.5*v*v)+'',18,28);hud(c,'F = −kx − cv     K '+k.toFixed(1)+'   X '+x.toFixed(1))}
 function pointer(px,py,type){if(type==='down'||type==='move'){x=clamp(px-193,-110,110);v=0}}
 return {reset,step,draw,pointer,metric:()=>({x,v,k,t})}
}
function doublePendulum(){
 let st=[],trail=[],g=9.8;
 function reset(){st=[2.05,1.28,0,0];trail=[]}
 function derivative(q,gg){const [a,b,va,vb]=q,m1=1,m2=1,l1=.73,l2=.68;const dif=a-b,den=2*m1+m2-m2*Math.cos(2*dif);
 const da=(-gg*(2*m1+m2)*Math.sin(a)-m2*gg*Math.sin(a-2*b)-2*Math.sin(dif)*m2*(vb*vb*l2+va*va*l1*Math.cos(dif)))/(l1*den);
 const db=(2*Math.sin(dif)*(va*va*l1*(m1+m2)+gg*(m1+m2)*Math.cos(a)+vb*vb*l2*m2*Math.cos(dif)))/(l2*den);
 return [va,vb,da,db]}
 function step(dt,p){g=p;const k1=derivative(st,g),s1=st.map((a,i)=>a+k1[i]*dt/2),k2=derivative(s1,g),s2=st.map((a,i)=>a+k2[i]*dt/2),k3=derivative(s2,g),s3=st.map((a,i)=>a+k3[i]*dt),k4=derivative(s3,g);
 st=st.map((a,i)=>a+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);st[2]=clamp(st[2],-28,28);st[3]=clamp(st[3],-28,28);
 const [x,y]=end();trail.push([x,y]);if(trail.length>130)trail.shift()}
 function end(){const ox=180,oy=40,x=ox+74*Math.sin(st[0]),y=oy+74*Math.cos(st[0]);return [x+67*Math.sin(st[1]),y+67*Math.cos(st[1])]}
 function draw(c){grid(c);const x1=180+74*Math.sin(st[0]),y1=40+74*Math.cos(st[0]),[x2,y2]=end();if(trail.length>1)path(c,trail,'#4fd2c55c',1.3);line(c,180,40,x1,y1,'#7daaf5',4);line(c,x1,y1,x2,y2,'#e3aaf5',3);circle(c,180,40,4,'#a8b8cf');circle(c,x1,y1,10,'#75a9ff',7);circle(c,x2,y2,11,'#f5b371',9);hud(c,'DOUBLE PENDULUM · RK4    g='+g.toFixed(1)+'m/s²')}
 function pointer(x,y,type){if(type==='down'){st=[Math.atan2(x-180,y-40),1.3,0,0];trail=[]}}
 return {reset,step,draw,pointer,metric:()=>({angle1:st[0],angle2:st[1],angularSpeed:st[2],x:end()[0],trail:trail.length})}
}
function orbit(){
 let sats=[],mu=120000;
 function reset(){sats=[55,79,103].map((r,i)=>{const a=i*1.2,px=180+Math.cos(a)*r,py=122+Math.sin(a)*r,speed=Math.sqrt(mu/r);return {x:px,y:py,vx:-Math.sin(a)*speed,vy:Math.cos(a)*speed,r:i===0?5:4,trail:[],color:PAL[i]}})}
 function step(dt,p){mu=p*20000;for(const s of sats){const dx=s.x-180,dy=s.y-122,r=Math.sqrt(dx*dx+dy*dy+80);const g=mu/(r*r*r);s.vx-=dx*g*dt;s.vy-=dy*g*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.x<6||s.x>354||s.y<6||s.y>234){s.x=180+(rnd(sats.length)*2-1)*85;s.y=122-80;s.vx=35;s.vy=12}s.trail.push([s.x,s.y]);if(s.trail.length>90)s.trail.shift()}}
 function draw(c){grid(c);for(const r of [55,79,103]){c.beginPath();c.arc(180,122,r,0,TAU);c.strokeStyle='#80a6d922';c.lineWidth=1;c.stroke()}circle(c,180,122,17,'#f5b45a',26);circle(c,180,122,5,'#fff3c5',9);for(const s of sats){if(s.trail.length>1)path(c,s.trail,s.color+'88',1.3);circle(c,s.x,s.y,s.r,s.color,7)}hud(c,'INVERSE-SQUARE GRAVITY · µ='+Math.round(mu))}
 function pointer(x,y,type){if(type!=='down')return;let dx=x-180,dy=y-122,r=hypot(dx,dy);if(r<28)return;const speed=Math.sqrt(mu/r);sats.push({x,y,vx:-dy/r*speed,vy:dx/r*speed,r:4,color:PAL[sats.length%PAL.length],trail:[]});if(sats.length>8)sats.shift()}
 return {reset,step,draw,pointer,metric:()=>({orbiters:sats.length,x:sats[0]?.x,y:sats[0]?.y,mu})}
}
function nbody(){
 let bodies=[],energy=0;
 function reset(){bodies=Array.from({length:14},(_,i)=>{const a=i*TAU/14,r=27+(i%5)*17;return {x:180+Math.cos(a)*r,y:120+Math.sin(a)*r,vx:-Math.sin(a)*(15+r*.16),vy:Math.cos(a)*(15+r*.16),m:7+(i%4)*3,color:PAL[i%PAL.length],trail:[]}})}
 function step(dt,p){const accel=bodies.map(()=>({x:0,y:0}));let grav=p*175;for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,r2=dx*dx+dy*dy+140,inv=Math.pow(r2,-1.5),fac=grav*inv;accel[i].x+=dx*fac*b.m;accel[i].y+=dy*fac*b.m;accel[j].x-=dx*fac*a.m;accel[j].y-=dy*fac*a.m}
 for(let i=0;i<bodies.length;i++){const b=bodies[i],a=accel[i];b.vx+=a.x*dt;b.vy+=a.y*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<12||b.x>348){b.vx*=-.7;b.x=clamp(b.x,12,348)}if(b.y<12||b.y>228){b.vy*=-.7;b.y=clamp(b.y,12,228)}b.trail.push([b.x,b.y]);if(b.trail.length>32)b.trail.shift()}}
 function draw(c){grid(c);bodies.forEach(b=>{if(b.trail.length>1)path(c,b.trail,b.color+'44',1);circle(c,b.x,b.y,3.2+b.m*.17,b.color,7)});hud(c,'SOFTENED N-BODY · '+bodies.length+' BODIES · PAIR FORCES')}
 function pointer(x,y,type){if(type==='down'){bodies.push({x,y,vx:0,vy:0,m:50,color:'#ffd094',trail:[]});if(bodies.length>20)bodies.shift()}}
 return {reset,step,draw,pointer,metric:()=>({bodies:bodies.length,x:bodies[0]?.x,y:bodies[0]?.y})}
}
function electric(){
 let charges=[],probe,trail=[],gain=1;
 function reset(){charges=[{x:120,y:117,q:1},{x:237,y:117,q:-1}];probe={x:170,y:59,vx:0,vy:0};trail=[]}
 function field(x,y){let ex=0,ey=0;for(const q of charges){const dx=x-q.x,dy=y-q.y,d2=dx*dx+dy*dy+160;const k=8500*q.q*gain/Math.pow(d2,1.5);ex+=dx*k;ey+=dy*k}return {ex,ey}}
 function step(dt,p){gain=p;const E=field(probe.x,probe.y);probe.vx=(probe.vx+E.ex*55*dt)*.999;probe.vy=(probe.vy+E.ey*55*dt)*.999;probe.x+=probe.vx*dt;probe.y+=probe.vy*dt;if(probe.x<10||probe.x>350||probe.y<10||probe.y>230)probe={x:170,y:59,vx:0,vy:0};trail.push([probe.x,probe.y]);if(trail.length>95)trail.shift()}
 function draw(c){grid(c);for(let y=30;y<213;y+=22)for(let x=24;x<343;x+=24){const E=field(x,y),mag=hypot(E.ex,E.ey)||1,ux=E.ex/mag,uy=E.ey/mag,len=clamp(mag*4,4,12);line(c,x-ux*len/2,y-uy*len/2,x+ux*len/2,y+uy*len/2,'#7dbee1a8',1.1);const a=Math.atan2(uy,ux);line(c,x+ux*len/2,y+uy*len/2,x+ux*len/2-Math.cos(a-.5)*3,y+uy*len/2-Math.sin(a-.5)*3,'#7dbee1a8',1)}
 for(const q of charges){circle(c,q.x,q.y,14,q.q>0?'#f5a779':'#72a5ff',14);label(c,q.q>0?'+':'−',q.x-4,q.y+4,'#172b48')}if(trail.length>2)path(c,trail,'#f7dc9b8c',1);circle(c,probe.x,probe.y,6,'#f8d58c',7);hud(c,'E = Σ kq r̂ / r²    TEST CHARGE / q+' )}
 function pointer(x,y,type){if(type==='down'){let nearest=charges.reduce((a,q)=>hypot(q.x-x,q.y-y)<hypot(a.x-x,a.y-y)?q:a);nearest.x=clamp(x,25,335);nearest.y=clamp(y,30,200);probe={x:170,y:59,vx:0,vy:0};trail=[]}}
 return {reset,step,draw,pointer,metric:()=>({testX:probe.x,testY:probe.y,ex:field(180,120).ex,chargeCount:charges.length})}
}
function optics(){
 let n2=1.52,incident=43,time=0;
 function reset(){time=0;incident=43}
 function step(dt,p){n2=p;time+=dt}
 function draw(c){grid(c);c.fillStyle='#476caa36';c.fillRect(0,122,360,118);line(c,0,122,360,122,'#95c1e3',1.3);c.setLineDash([5,6]);line(c,180,16,180,226,'#b2cbea96',1);c.setLineDash([]);
 const a=incident*PI/180,r=Math.asin(clamp(Math.sin(a)/n2,-1,1)),len=113;
 const x1=180-Math.sin(a)*len,y1=122-Math.cos(a)*len;
 const xr=180+Math.sin(a)*len,yr=122-Math.cos(a)*len;
 const x2=180+Math.sin(r)*120,y2=122+Math.cos(r)*120;
 line(c,x1,y1,180,122,'#f7b976',3.5);line(c,180,122,xr,yr,'#f7b97665',1.5);line(c,180,122,x2,y2,'#69dfd5',3.8);
 const t=(time*.32)%2,frac=t<1?t:t-1;if(t<1)circle(c,x1+(180-x1)*frac,y1+(122-y1)*frac,4,'#ffe4ab',8);else circle(c,180+(x2-180)*frac,122+(y2-122)*frac,4,'#b4fff3',9);
 circle(c,180,122,4,'#fff');label(c,'AIR  n₁=1.00',14,29);label(c,'MEDIUM  n₂='+n2.toFixed(2),14,147);
 label(c,'θᵢ '+incident+'°',216,75);label(c,'θᵣ '+Math.round(r*180/PI)+'°',205,194,'#75dace');
 hud(c,'SNELL: n₁ sin θ₁ = n₂ sin θ₂')}
 function pointer(x,y,type){if(type==='down')incident=clamp(Math.round((x/360)*75),10,75)}
 return {reset,step,draw,pointer,metric:()=>({n2,theta1:incident,theta2:Math.asin(Math.sin(incident*PI/180)/n2)*180/PI,time})}
}
const engines={collision:collisions,projectile,cloth,rope,fluid:waterParticles,shallow:surfaceWaves,spring,doublepend:doublePendulum,orbit,nbody,electric,optics};
window.SFPhysicsModels={W,H,engines,grid,colors:PAL};
})();