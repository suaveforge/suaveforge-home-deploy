/* 16 actual WebGL GPU fragment shaders: Chromium compile, render, interaction, mobile and nav QA. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const OUT=path.resolve(__dirname,'qa-artifacts');fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:8181';
const GROUPS=[['material',['chrome','iridescent']],['glass',['fluted','frosted']],['distort',['ripple','liquidwarp']],['transition',['dissolve','datamosh']],['particles',['starfield','smoke']],['procedural',['sdf','fractal']],['light',['aurora','godrays']],['retro',['halftone','crt']]];
async function stat(page,id){return page.evaluate(k=>window.__SFShaderQA.getStats().views.find(v=>v.id===k&&!v.compare&&!v.modal),id)}
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const errors=[],results=[],report={};
try{
 const page=await browser.newPage({viewport:{width:1440,height:930},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('desktop JS '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('desktop console '+m.text())});
 const response=await page.goto(BASE+'/research/interactive/shaders/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__SFShaderQA?.getStats().shown===16,{timeout:12000});
 const initial=await page.evaluate(()=>window.__SFShaderQA.getStats());
 report.http=response.status();report.initial={shown:initial.shown,refs:initial.refs,gpu:initial.gpu,compare:initial.compare};
 const srcPage=await browser.newPage({viewport:{width:1440,height:900}});
 await srcPage.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
 report.menu={desktop:await srcPage.locator('#mega-research a[href="/research/interactive/shaders/"]').count(),mobile:await srcPage.locator('#mobile-research a[href="/research/interactive/shaders/"]').count()};
 await srcPage.close();
 const research=await browser.newPage({viewport:{width:1440,height:900}});
 await research.goto(BASE+'/research/',{waitUntil:'domcontentloaded',timeout:45000});
 report.menu.research=await research.locator('.research-tiles a[href="/research/interactive/shaders/"]').count();
 await research.close();
 const interact=await browser.newPage({viewport:{width:1440,height:900}});
 await interact.goto(BASE+'/research/interactive/',{waitUntil:'domcontentloaded',timeout:45000});
 report.menu.interactive=await interact.locator('.shader-promo a[href="/research/interactive/shaders/"]').count();
 report.menu.preservedInteractive=await interact.locator('.sample-card').count();
 await interact.close();
 for(const [g,ids] of GROUPS){
  await page.locator('[data-shader-filters] button[data-category="'+g+'"]').click();
  await page.waitForFunction(()=>window.__SFShaderQA.getStats().shown===2);
  for(const id of ids){
   const card=page.locator('[data-shader-card="'+id+'"]');
   await card.locator('canvas').scrollIntoViewIfNeeded();
   let renderTimedOut=false;
   try{await page.waitForFunction(k=>{const q=window.__SFShaderQA.getStats();return q.views.some(v=>v.id===k&&!v.compare&&!v.modal&&v.frames>=2)},id,{timeout:20000})}catch{renderTimedOut=true}
   const a=await stat(page,id),checksum=await page.evaluate(k=>window.__SFShaderQA.getPixel(k),id),compiled=await card.getAttribute('data-compiled');
   const palette0=await page.evaluate(k=>window.__SFShaderQA.getPalette(k),id);
   await card.locator('[data-palette]').click();
   const palette1=await page.evaluate(k=>window.__SFShaderQA.getPalette(k),id);
   await card.locator('[data-intensity]').fill('1.7');
   await card.locator('[data-speed]').fill('1.8');
   const params=await page.evaluate(k=>window.__SFShaderQA.getParams(k),id);
   await card.locator('[data-pause]').click();const pause=await page.evaluate(k=>window.__SFShaderQA.getParams(k).paused,id);
   await card.locator('[data-pause]').click();const resumed=await page.evaluate(k=>window.__SFShaderQA.getParams(k).paused,id);
   const result={id,group:g,pass:!renderTimedOut&&a.frames>=2&&checksum>2000&&compiled==='true'&&palette1!==palette0&&params.intensity===1.7&&params.speed===1.8&&pause===true&&resumed===false,frames:a.frames,checksum,compiled,paletteChanged:palette1!==palette0,params,pause,resumed};
   results.push(result);console.log('SHADER_EFFECT_QA '+JSON.stringify({id,pass:result.pass,frames:a.frames,checksum,compiled}));
  }
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(OUT,g+'-desktop.png'),fullPage:true,animations:'disabled'});
 }
 await page.locator('[data-shader-filters] button[data-category="all"]').click();
 await page.waitForFunction(()=>window.__SFShaderQA.getStats().shown===16);
 report.all=await page.locator('.shader-card[data-shader-card]').count();
 await page.locator('[data-shader-search]').fill('glass');
 report.searched=await page.locator('.shader-card[data-shader-card]').count();
 await page.locator('[data-shader-search]').fill('');
 const first=page.locator('[data-shader-card=chrome]');
 await first.locator('[data-pin]').click();
 report.afterUnpin=await page.evaluate(()=>window.__SFShaderQA.getStats().compare);
 await page.locator('[data-shader-filters] button[data-category=procedural]').click();
 await page.locator('[data-shader-card=sdf] [data-pin]').click();
 report.afterPin=await page.evaluate(()=>window.__SFShaderQA.getStats().compare);
 await page.locator('[data-compare-intensity]').fill('1.5');
 await page.locator('[data-compare-speed]').fill('1.4');
 await page.locator('#compare').scrollIntoViewIfNeeded();
 try{await page.waitForFunction(()=>window.__SFShaderQA.getStats().views.filter(v=>v.compare&&v.frames>=1).length===3,{timeout:20000})}catch{}
 report.compare=await page.evaluate(()=>window.__SFShaderQA.getStats().views.filter(v=>v.compare).map(v=>({id:v.id,frames:v.frames})));
 await page.screenshot({path:path.join(OUT,'comparison-desktop.png'),fullPage:true,animations:'disabled'});
 await page.locator('[data-shader-card=sdf] [data-expand]').click();
 await page.waitForFunction(()=>document.querySelector('[data-shader-modal]')?.open===true);
 try{await page.waitForFunction(()=>window.__SFShaderQA.getStats().views.some(v=>v.modal&&v.id==='sdf'&&v.frames>=1),{timeout:20000})}catch{}
 report.modal=await page.evaluate(()=>({active:document.querySelector('[data-shader-modal]').dataset.active,open:document.querySelector('[data-shader-modal]').open,frames:window.__SFShaderQA.getStats().views.find(v=>v.modal)?.frames||0}));
 await page.locator('[data-modal-close]').click();
 report.modal.closed=await page.locator('[data-shader-modal]').evaluate(x=>!x.open);
 report.desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 await page.locator('[data-shader-filters] button[data-category=all]').click();
 for(const id of ['chrome','fluted','ripple','dissolve','starfield','sdf','aurora','crt']){
   const card=page.locator('[data-shader-card="'+id+'"]');
   await card.locator('canvas').scrollIntoViewIfNeeded();
   try{await page.waitForFunction(k=>window.__SFShaderQA.getStats().views.some(v=>v.id===k&&!v.compare&&v.frames>0),id,{timeout:10000})}catch{}
 }
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:path.join(OUT,'all-desktop.png'),fullPage:true,animations:'disabled'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 mobile.on('pageerror',e=>errors.push('mobile JS '+e.message));
 await mobile.goto(BASE+'/research/interactive/shaders/',{waitUntil:'domcontentloaded',timeout:45000});
 await mobile.waitForFunction(()=>window.__SFShaderQA?.getStats().shown===16,{timeout:13000});
 report.mobile={initial:await mobile.locator('[data-shader-card]').count()};
 await mobile.locator('[data-shader-filters] button[data-category=glass]').click();
 report.mobile.filtered=await mobile.locator('[data-shader-card]').count();
 await mobile.locator('[data-shader-card=fluted] canvas').scrollIntoViewIfNeeded();
 try{await mobile.waitForFunction(()=>window.__SFShaderQA.getStats().views.some(v=>v.id==='fluted'&&!v.compare&&v.frames>=1),{timeout:20000})}catch{}
 report.mobile.rendered=await mobile.locator('[data-shader-card=fluted]').getAttribute('data-rendered');
 await mobile.locator('[data-shader-card=fluted] [data-intensity]').fill('1.7');
 report.mobile.param=await mobile.evaluate(()=>window.__SFShaderQA.getParams('fluted').intensity);
 report.mobile.overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 report.mobile.activeLink=await mobile.locator('.nav [aria-current=page]').isVisible();
 await mobile.evaluate(()=>window.scrollTo(0,0));
 await mobile.screenshot({path:path.join(OUT,'glass-mobile.png'),fullPage:true,animations:'disabled'});
 await mobile.locator('[data-shader-filters] button[data-category=all]').click();
 await mobile.locator('#gallery').scrollIntoViewIfNeeded();
 await mobile.screenshot({path:path.join(OUT,'all-mobile.png'),fullPage:true,animations:'disabled'});
 const stats=await page.evaluate(()=>window.__SFShaderQA.getStats());
 report.gpuCompiled=stats.programs;report.compilerErrors=stats.errors;
 const passed=report.http===200&&report.initial.gpu===true&&report.initial.refs===16&&report.initial.compare===3&&results.length===16&&results.every(x=>x.pass)&&stats.programs.length===16&&stats.errors.length===0&&report.all===16&&report.searched>=1&&report.afterUnpin===2&&report.afterPin===3&&report.compare.length===3&&report.compare.every(v=>v.frames>0)&&report.modal.open&&report.modal.frames>0&&report.modal.closed&&!report.desktopOverflow&&report.mobile.initial===16&&report.mobile.filtered===2&&report.mobile.rendered==='true'&&report.mobile.param===1.7&&!report.mobile.overflow&&report.mobile.activeLink&&report.menu.desktop===1&&report.menu.mobile===1&&report.menu.research===1&&report.menu.interactive===1&&report.menu.preservedInteractive===12&&errors.length===0;
 const result={passed,summary:report,individual:results,errors};fs.writeFileSync(path.join(OUT,'qa-results.json'),JSON.stringify(result,null,2)+'\n');
 console.log('SHADER_LAB_QA '+JSON.stringify({passed,rendered:results.filter(x=>x.pass).length,total:results.length,failed:results.filter(x=>!x.pass).map(x=>x.id),compiler:stats.errors,compiled:stats.programs.length,comparison:report.compare,modal:report.modal,mobile:report.mobile,menu:report.menu,errors}));
 if(!passed)process.exitCode=1;
}finally{await browser.close()}
})().catch(e=>{console.error('SHADER_LAB_QA_FATAL '+(e.stack||e));process.exitCode=1});
