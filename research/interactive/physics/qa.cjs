/* Real Chromium QA for twelve independently solved physics models, filter/menu and mobile */
const {chromium}=require('../qa/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const OUT=path.join(__dirname,'qa-artifacts');fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:8181';
const groups=[['rigid',['collision','projectile']],['soft',['cloth','rope']],['fluid',['fluid','shallow']],['wave',['spring','doublepend']],['gravity',['orbit','nbody']],['electro',['electric','optics']]];
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const errors=[],results=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:930},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('pageerror '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text())});
 const response=await page.goto(BASE+'/research/interactive/physics/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__SFPhysicsLab?.stats().length===12,null,{timeout:12000});
 const count=await page.locator('[data-physics-card]').count();
 const sources=await page.locator('.ref-card').count();
 const sourceVersion=await page.evaluate(()=>window.SFPhysicsCatalog?.sources);
 const menu={};
 const site=await browser.newPage({viewport:{width:1440,height:900}});
 await site.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
 menu.desktop=await site.locator('#mega-research a[href="/research/interactive/physics/"]').count();
 menu.mobile=await site.locator('#mobile-research a[href="/research/interactive/physics/"]').count();
 const research=await browser.newPage({viewport:{width:1440,height:900}});
 await research.goto(BASE+'/research/',{waitUntil:'domcontentloaded',timeout:45000});
 menu.research=await research.locator('.research-tiles a[href="/research/interactive/physics/"]').count();
 const interactive=await browser.newPage({viewport:{width:1440,height:900}});
 await interactive.goto(BASE+'/research/interactive/',{waitUntil:'domcontentloaded',timeout:45000});
 menu.interactive=await interactive.locator('.physics-promo a[href="/research/interactive/physics/"]').count();
 menu.existingShowcase=await interactive.locator('.sample-card').count();
 for(const [category,ids] of groups){
  await page.locator('[data-physics-filters] button[data-category="'+category+'"]').click();
  await page.waitForFunction(()=>window.__SFPhysicsLab.stats().length===2);
  const actual=await page.locator('[data-physics-card]').count();
  for(const id of ids){
   const card=page.locator('[data-physics-card="'+id+'"]');
   await card.locator('canvas').scrollIntoViewIfNeeded();
   try{await page.waitForFunction(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k)?.steps>=4,id,{timeout:14000})}catch{}
   const before=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k),id);
   await page.waitForTimeout(600);
   const after=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k),id);
   const dynamic=after.steps>before.steps && JSON.stringify(after.metric)!==JSON.stringify(before.metric);
   await card.locator('[data-toggle]').click();
   const p1=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k).steps,id);
   await page.waitForTimeout(140);
   const p2=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k).steps,id);
   const paused=p1===p2;
   const slider=card.locator('input[type=range]');
   const max=Number(await slider.getAttribute('max')),min=Number(await slider.getAttribute('min')),step=Number(await slider.getAttribute('step'));
   const allowed=Number((min+Math.round((max-min)*.78/step)*step).toFixed(4));
   await slider.fill(String(allowed));
   const changed=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k).param,id);
   const paramChanged=changed!==before.param;
   await card.locator('[data-toggle]').click();
   const box=await card.locator('canvas').boundingBox();
   await page.mouse.click(box.x+box.width*.53,box.y+box.height*.45);
   const pointer=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k).interactions,id);
   await card.locator('[data-reset]').click();
   const state=await page.evaluate(k=>window.__SFPhysicsLab.stats().find(x=>x.id===k),id);
   const canvas=await card.locator('canvas').evaluate(c=>({w:c.width,h:c.height,pixel:Array.from(c.getContext('2d').getImageData(Math.floor(c.width*.5),Math.floor(c.height*.5),1,1).data)}));
   const passed=actual===2&&dynamic&&paused&&paramChanged&&pointer>0&&!state.paused&&canvas.w>150&&canvas.h>140;
   const result={id,group:category,passed,dynamic,paused,paramChanged,pointer,step:after.steps,metric:after.metric,canvas};
   results.push(result);
   console.log('SIM_QA',JSON.stringify({id,passed,dynamic,paused,paramChanged,pointer}));
  }
  await page.locator('#simulations').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(OUT,category+'-desktop.png'),fullPage:true,animations:'disabled'});
 }
 await page.locator('[data-physics-filters] button[data-category="all"]').click();
 await page.waitForFunction(()=>window.__SFPhysicsLab.stats().length===12);
 await page.locator('[data-physics-search]').fill('진자');
 const searched=await page.locator('[data-physics-card]').count();
 await page.locator('[data-physics-search]').fill('');
 await page.locator('[data-physics-card="collision"] [data-expand]').click();
 await page.waitForFunction(()=>document.querySelector('[data-physics-modal]')?.open===true);
 const modal=await page.evaluate(()=>({open:document.querySelector('[data-physics-modal]').open,canvas:document.querySelector('[data-physics-modal] canvas')?.width||0}));
 await page.locator('[data-physics-modal] [data-toggle]').click();
 const modalPaused=await page.locator('[data-physics-modal] [data-status]').textContent();
 await page.locator('[data-modal-close]').click();
 const modalClosed=await page.locator('[data-physics-modal]').evaluate(x=>!x.open);
 await page.locator('#simulations').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(OUT,'all-desktop.png'),fullPage:true,animations:'disabled'});
 const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push('mobile '+e.message));
 await mobile.goto(BASE+'/research/interactive/physics/',{waitUntil:'domcontentloaded',timeout:45000});
 await mobile.waitForFunction(()=>window.__SFPhysicsLab?.stats().length===12);
 const mobileInitial=await mobile.locator('[data-physics-card]').count();
 await mobile.locator('[data-physics-filters] button[data-category="soft"]').click();
 await mobile.waitForFunction(()=>window.__SFPhysicsLab.stats().length===2);
 await mobile.locator('[data-physics-card="cloth"] canvas').scrollIntoViewIfNeeded();
 try{await mobile.waitForFunction(()=>window.__SFPhysicsLab.stats().find(x=>x.id==='cloth')?.steps>1,null,{timeout:15000})}catch{}
 const mobileCanvas=await mobile.locator('[data-physics-card="cloth"] canvas').boundingBox();
 await mobile.locator('[data-physics-card="cloth"] input[type=range]').fill('0.8');
 const mParam=await mobile.evaluate(()=>window.__SFPhysicsLab.stats().find(x=>x.id==='cloth').param);
 const mobileOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 const currentNavVisible=await mobile.locator('.nav a[aria-current=page]').isVisible();
 await mobile.evaluate(()=>scrollTo(0,0));
 await mobile.screenshot({path:path.join(OUT,'soft-mobile.png'),fullPage:true,animations:'disabled'});
 await mobile.locator('[data-physics-filters] button[data-category="all"]').click();
 await mobile.screenshot({path:path.join(OUT,'all-mobile.png'),fullPage:true,animations:'disabled'});
 const pass=response.status()===200&&count===12&&sources===14&&sourceVersion===14&&results.length===12&&results.every(x=>x.passed)&&searched>=1&&modal.open&&modal.canvas>150&&modalPaused==='일시정지'&&modalClosed&&!desktopOverflow&&mobileInitial===12&&mParam===.8&&!mobileOverflow&&currentNavVisible&&Object.values(menu).every((x,i)=>i===4?x===12:x===1)&&errors.length===0;
 const report={pass,count,sources,menu,results,mobile:{initial:mobileInitial,clothParam:mParam,canvas:mobileCanvas,overflow:mobileOverflow,currentNavVisible},searched,modal,modalPaused,modalClosed,desktopOverflow,errors};
 fs.writeFileSync(path.join(OUT,'qa-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PHYSICS_LAB_QA',JSON.stringify({pass,count,sources,menu,modelsPassed:results.filter(x=>x.passed).length,modelsFailed:results.filter(x=>!x.passed).map(x=>x.id),searched,modal,modalPaused,modalClosed,mobile:report.mobile,desktopOverflow,errors}));
 if(!pass)process.exitCode=1;
}finally{await browser.close()}
})().catch(e=>{console.error('PHYSICS_LAB_QA_FATAL',e.stack||e);process.exitCode=1});
