/* SuaveForge original GLSL ES 1.00 effects. No third-party shader code or artwork. */
(function(){
'use strict';
const groups={all:'전체 16종',material:'금속·재질',glass:'유리·굴절',distort:'왜곡·액체',transition:'전환·글리치',particles:'입자·연기',procedural:'절차적 3D',light:'빛·오로라',retro:'후처리·레트로'};
const entries=[
['chrome','material','Liquid Chrome','반사광과 금속 질감 연출'],['iridescent','material','Iridescent Foil','표면 색상 간섭과 홀로그램'],['fluted','glass','Fluted Glass','세로 렌즈 리브를 통한 영상 굴절'],['frosted','glass','Frosted Glass','노이즈 오프셋의 서리 낀 유리'],['ripple','distort','Ripple Lens','마우스 반응 파문 굴절'],['liquidwarp','distort','Liquid Displacement','유체 같은 절차적 왜곡'],['dissolve','transition','Dissolve Edge','노이즈 마스크 발광 전환'],['datamosh','transition','RGB Datamosh','픽셀 블록과 RGB 색 분리'],['starfield','particles','Particle Starfield','GPU 셀 기반 입자·별빛'],['smoke','particles','Procedural Smoke','노이즈 다층 연기 연출'],['sdf','procedural','SDF Raymarch Orb','부호 거리장 3D 법선 조명'],['fractal','procedural','Mandelbrot Zoom','복소수 반복 프랙털'],['aurora','light','Aurora Curtains','오로라 커튼과 광량'],['godrays','light','God Rays','광원 중심 방사형 빛 산란'],['halftone','retro','Halftone Screen','휘도 기반 인쇄 스크린 점'],['crt','retro','CRT Scanlines','곡률·RGB·주사선 후처리']
];
const effects=entries.map((a,i)=>({id:a[0],group:a[1],title:a[2],description:a[3],no:String(i+1).padStart(2,'0')}));
const refs=[
['Shadertoy','GPU shader community','https://www.shadertoy.com/','각 작품 저작권 별도'],
['Paper Shaders','UI material effects','https://shaders.paper.design/','패키지·효과별 확인'],
['Shaders Presets','Premium WebGPU and shader presets','https://shaders.com/presets','Pro 프리셋 유료'],
['WebGL Shader Lab','Interactive WebGL experiments','https://pscactux.github.io/webgl-shader-lab/','개별 예제 사용권 확인'],
['The Book of Shaders','GLSL procedural education','https://thebookofshaders.com/','문서·코드 사용권 확인'],
['Codrops Creative Hub','Premium web interaction experiments','https://tympanus.net/codrops/hub/all/','작품별 저작권 확인'],
['pmndrs Postprocessing','High quality 3D render effects','https://github.com/pmndrs/postprocessing','오픈소스 조건 확인'],
['Three.js Examples','3D shaders and postprocessing','https://threejs.org/examples/','엔진 MIT · 모델 별도'],
['Shader Park','SDF authoring and design','https://shaderpark.com/','도구·에셋별 확인'],
['GLSL Sandbox','GLSL live coding playground','https://glslsandbox.com/','원작자별 저작권 확인'],
['glslCanvas','Simple WebGL GLSL sandbox','https://github.com/patriciogonzalezvivo/glslCanvas','MIT'],
['LYGIA','Reusable GPU shading functions','https://lygia.xyz/','개별 코드 조건 확인'],
['VertexShaderArt','GPU generated vertex art','https://www.vertexshaderart.com/','개별 작품 조건 확인'],
['React Bits','Animated frontend UI components','https://www.reactbits.dev/','컴포넌트별 조건 확인'],
['Inigo Quilez','SDF and raymarching technical articles','https://iquilezles.org/articles/','개별 코드 저작권 확인'],
['Clyune WebGL','Web shader effect components','https://component.clyune.com/webgl','컴포넌트별 사용권 확인']
].map((r,i)=>({id:'R'+String(i+1).padStart(2,'0'),name:r[0],type:r[1],url:r[2],license:r[3]}));
const header=String.raw`precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_intensity;
uniform float u_speed;
uniform vec3 u_color;
#define PI 3.14159265359
#define T (u_time*u_speed)
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise2(p);p=p*2.04+vec2(8.4,3.7);a*=.5;}return v;}
vec3 pal(float x){return .5+.5*cos(6.28318*(vec3(.12,.42,.70)+x));}
vec3 scenery(vec2 p){float t=T*.1;float n=fbm(p*2.3+vec2(t,-t*.5));vec3 c=mix(vec3(.04,.075,.21),vec3(.13,.32,.48),smoothstep(-.7,.7,p.y));c+=u_color*.23*pow(n,2.);c+=vec3(.82,.69,.48)*exp(-15.*length(p-vec2(.32,.08)));c+=vec3(.13,.43,.47)*smoothstep(.15,.2,sin(p.x*6.+p.y*2.+n));return c;}
vec2 rotate2(vec2 p,float a){return mat2(cos(a),-sin(a),sin(a),cos(a))*p;}
`;
const body={
chrome:String.raw`vec3 effect(vec2 p){float r=length(p);float a=atan(p.y,p.x);float twist=sin(a*4.+T*.36)*.035+sin(p.x*18.+p.y*7.+T*.6)*.044*u_intensity;float mask=1.-smoothstep(.53,.57,r+twist);float q=sin(p.x*14.+p.y*9.+T*.56)+cos(p.y*17.-p.x*7.);float stripe=pow(.5+.5*cos(q*3.+p.x*13.),4.);vec3 metal=mix(vec3(.02,.035,.08),vec3(.86,.92,1.),stripe);metal=mix(metal,vec3(.88,.58,.9),.23+.22*sin(a*5.+T*.25));metal+=pow(max(0.,1.-r*1.6),9.)*.65;return mix(vec3(.03,.06,.13),metal,mask); }`,
iridescent:String.raw`vec3 effect(vec2 p){p=rotate2(p,-.2);float r=length(p);float mask=1.-smoothstep(.53,.57,r);float f=sin(p.x*14.+sin(p.y*7.+T*.2))*sin(p.y*8.-T*.3);float phase=.29*p.x+.31*p.y+.2*f*u_intensity+.075*T+.13/max(.1,r);vec3 col=.52+.46*cos(6.28318*(vec3(0.,.34,.67)+phase));col+=pow(.5+.5*sin((p.x+p.y)*18.-f*3.+T*.8),7.)*.26;return mix(vec3(.03,.04,.1),col,mask);}`,
fluted:String.raw`vec3 effect(vec2 p){float rib=sin(p.x*70.);float disp=rib*(.025+u_intensity*.085)+sin(p.y*8.+T*.3)*.014;vec3 c=scenery(p+vec2(disp,0.));c*=.82+.18*pow(abs(cos(p.x*70.)),2.);c+=vec3(.35,.54,.72)*pow(1.-abs(rib),18.)*.3;return c;}`,
frosted:String.raw`vec3 effect(vec2 p){vec2 id=floor(p*19.);vec2 d=vec2(noise2(id+T*.05),noise2(id+19.+T*.07))-.5;vec2 q=p+d*(.08+u_intensity*.13);vec3 c=mix(scenery(q),scenery(q+vec2(.06,-.06)),.45);return c+.045+.045*noise2(p*52.+T*.2);}`,
ripple:String.raw`vec3 effect(vec2 p){vec2 o=(u_mouse-.5)*vec2(u_resolution.x/u_resolution.y,1.)*.55;vec2 q=p-o;float r=length(q);float w=sin(r*48.-T*7.)*exp(-r*3.5);vec2 uv=p+normalize(q+vec2(.0001))*w*(.01+u_intensity*.045);return scenery(uv)+vec3(.2,.7,1.)*pow(abs(w),7.)*.3;}`,
liquidwarp:String.raw`vec3 effect(vec2 p){float a=fbm(p*2.8+vec2(.13*T,-.11*T));float b=fbm(p*3.2+vec2(.20,-.10*T));vec2 flow=vec2(sin(a*7.+T*.37),cos(b*8.-T*.45))*(.04+u_intensity*.18);vec3 c=scenery(p+flow);return mix(c,vec3(.13,.77,.78),smoothstep(.5,.8,fbm(p*4.3+flow*2.4+T*.07))*.35);}`,
dissolve:String.raw`vec3 effect(vec2 p){float n=fbm(p*7.2+vec2(T*.13,T*.03));float cutoff=.50+.34*sin(T*.8)+.12*p.x*u_intensity;float edge=1.-smoothstep(.015,.08,abs(n-cutoff));float m=smoothstep(cutoff-.02,cutoff+.03,n);return mix(vec3(.015,.027,.068),scenery(p*.9)+.19*pal(p.x*.24+.2*T),m)+vec3(.30,.85,1.)*edge*.7;}`,
datamosh:String.raw`vec3 effect(vec2 p){float row=floor((p.y+.7)*25.);float gate=step(.7,hash21(vec2(row,floor(T*5.))));float dx=(hash21(vec2(row,13.))-.5)*.3*gate*u_intensity;vec2 q=p+vec2(dx,0.);vec3 c=vec3(scenery(q+vec2(.018*gate,0.)).r,scenery(q).g,scenery(q-vec2(.022*gate,0.)).b);c=mix(c,vec3(.9,.23,.72),step(.88,noise2(floor(q*15.)+floor(T*4.)))*.2);return c*(.90+.10*sin(p.y*420.));}`,
starfield:String.raw`vec3 effect(vec2 p){vec3 c=vec3(.012,.025,.065);for(int k=0;k<3;k++){float scale=9.+float(k)*13.;vec2 q=p*scale+vec2(T*(.22+float(k)*.30),float(k)*7.3);vec2 id=floor(q),f=fract(q)-.5;float h=hash21(id),g=hash21(id+24.7);float d=length(f-vec2(h-.5,g-.5)*.52);float s=pow(1.-smoothstep(.01,.23,d),4.)*step(.73,h)*(.5+float(k)*.17);c+=mix(vec3(.38,.7,1.),vec3(.95,.73,.93),h)*s*u_intensity;}return c+u_color*.20*pow(fbm(p*4.+T*.07),3.);}`,
smoke:String.raw`vec3 effect(vec2 p){float a=fbm(p*3.+vec2(.15*T,-.35*T));float b=fbm(p*5.7+vec2(-.2*T,.08*T));float c=fbm(p*2.1+vec2(a*.5,T*.06));float d=smoothstep(.4,.77,a*.57+b*.15+c*.54+p.y*.13);vec3 s=mix(vec3(.22,.36,.76),u_color*.75+vec3(.18,.12,.35),b);return vec3(.012,.022,.06)+s*d*(.75+u_intensity)+vec3(.7,.85,.98)*pow(d,5.)*.22;}`,
sdf:String.raw`float sdfBall(vec3 p){return length(p)-.69+sin(p.x*9.+T*.7)*sin(p.y*9.-T*.5)*sin(p.z*8.)*.04*u_intensity;}vec3 normalBall(vec3 p){float e=.002;return normalize(vec3(sdfBall(p+vec3(e,0.,0.))-sdfBall(p-vec3(e,0.,0.)),sdfBall(p+vec3(0.,e,0.))-sdfBall(p-vec3(0.,e,0.)),sdfBall(p+vec3(0.,0.,e))-sdfBall(p-vec3(0.,0.,e))));}vec3 effect(vec2 uv){vec3 ro=vec3(0.,0.,2.75),rd=normalize(vec3(uv,-1.85)),p;float dist=0.;bool hit=false;for(int i=0;i<54;i++){p=ro+rd*dist;float d=sdfBall(p);if(d<.002){hit=true;break;}dist+=d*.8;if(dist>5.)break;}vec3 bg=vec3(.018,.027,.075)+.06*pal(uv.y*.17);if(!hit)return bg;vec3 n=normalBall(p),light=normalize(vec3(-.46,.83,1.));float diff=max(dot(n,light),0.),rim=pow(1.-max(0.,dot(n,-rd)),3.),spec=pow(max(0.,dot(reflect(-light,n),-rd)),35.);vec3 base=mix(u_color,vec3(.24,.6,.89),.38+.25*sin(p.y*9.+T*.2));return base*(.14+.7*diff)+vec3(.95,.83,.96)*spec*.7+vec3(.43,.71,.96)*rim*.65;}`,
fractal:String.raw`vec3 effect(vec2 uv){float zoom=2.2+1.4*sin(T*.12);vec2 c=uv*zoom+vec2(-.63,.025)+vec2(.04*sin(T*.09),0.),z=vec2(0.);float count=0.;for(int i=0;i<64;i++){z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;if(dot(z,z)>16.)break;count+=1.;}float phase=count*.026+T*.018;vec3 color=.18+.58*cos(6.28318*(vec3(.12,.43,.69)+phase*u_intensity));color*=smoothstep(.0,.15,count/64.);return mix(color,vec3(.01,.018,.04),step(63.5,count));}`,
aurora:String.raw`vec3 effect(vec2 p){vec3 c=mix(vec3(.011,.026,.072),vec3(.036,.075,.14),p.y+.5);for(int i=0;i<5;i++){float f=float(i);float w=sin(p.x*(4.4+f*.5)+T*(.38+f*.07)+sin(p.x*3.+T*.23))*.12;float center=.12+f*.09+w;float band=exp(-pow((p.y-center)*9.,2.));float taper=smoothstep(-.58,-.16,p.y)*smoothstep(.65,.36,p.y);c+=mix(vec3(.06,.75,.61),vec3(.38,.43,.94),f/5.)*band*taper*(.37+u_intensity*.12);}float stars=step(.987,hash21(floor((p+1.)*vec2(125.,95.))))*.35;return c+vec3(stars);}`,
godrays:String.raw`vec3 effect(vec2 p){vec2 sun=vec2(.14,.11)+vec2(sin(T*.18)*.08,0.);vec2 q=p-sun;float a=atan(q.y,q.x),r=length(q);float rays=pow(max(0.,sin(a*17.+sin(a*8.+T*.17)*2.5)),8.)+pow(max(0.,sin(a*29.-T*.13)),11.)*.4;float scatter=exp(-r*2.4)*rays*(1.+u_intensity*2.4);vec3 bg=vec3(.035,.065,.15)+.1*pal(p.y*.2);return bg+vec3(.99,.72,.46)*scatter*.6+vec3(1.,.86,.68)*exp(-r*17.)*1.4;}`,
halftone:String.raw`vec3 effect(vec2 p){vec3 base=scenery(p*.85)+.28*pal(p.x*.11);float l=dot(base,vec3(.21,.72,.07)),scale=40.+u_intensity*35.;vec2 q=fract(p*scale)-.5;float r=length(q);float ink=1.-smoothstep(.20,.24,r/(.25+(.90-l)*.54));return mix(vec3(.92,.89,.82),mix(vec3(.12,.15,.28),u_color*.6,.25),ink);}`,
crt:String.raw`vec3 effect(vec2 p){vec2 q=p*(1.+.11*dot(p,p)*u_intensity);vec3 c=vec3(scenery(q+vec2(.012,0.)).r,scenery(q).g,scenery(q-vec2(.012,0.)).b);float scan=.82+.18*cos(q.y*u_resolution.y*2.),grille=.91+.09*sin((q.x+.5)*u_resolution.x*2.8),vign=1.-smoothstep(.20,.93,length(p));float fuzz=hash21(floor(q*u_resolution*.8)+floor(T*10.))*.07;return (c+fuzz)*scan*grille*vign;}`
};
window.SFVFXResearch={groups,effects,refs,header,body,updated:'2026-11-21',provenance:'Independently authored SuaveForge GLSL ES 1.00 effects; linked vendor demos are references only.'};
})();