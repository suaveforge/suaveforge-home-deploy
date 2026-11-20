const {chromium}=require('../gallery/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
const dir=path.join(__dirname,'qa-artifacts');fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const errors=[];
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8181/research/charts/advanced/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('.ref-card').length===35,{timeout:15000});
 const initial=await page.locator('.ref-card').count();
 const nav=await page.locator('.research-bar a').allTextContents();
 const categories={};
 for(const key of ['flow','hierarchy','density','multi','story','ops']){
  await page.locator('[data-research-category="'+key+'"]').click();
  categories[key]=await page.locator('.ref-card').count();
  if(categories[key]<1)errors.push('empty category: '+key)
 }
 await page.locator('[data-research-category="all"]').click();
 await page.locator('[data-research-search]').fill('sunburst');
 const searched=await page.locator('.ref-card').count();
 if(searched<2)errors.push('sunburst search count '+searched);
 await page.locator('[data-research-search]').fill('');
 await page.screenshot({path:path.join(dir,'advanced-desktop.png'),fullPage:true,animations:'disabled'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push('mobile: '+e.message));
 await mobile.goto('http://127.0.0.1:8181/research/charts/advanced/',{waitUntil:'domcontentloaded',timeout:30000});
 await mobile.waitForFunction(()=>document.querySelectorAll('.ref-card').length===35);
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 const visible=await mobile.locator('.ref-card').count();
 await mobile.screenshot({path:path.join(dir,'advanced-mobile.png'),fullPage:true,animations:'disabled'});
 const result={passed:errors.length===0&&initial===35&&searched>=2&&!overflow&&visible===35,initial,categories,nav,searched,mobile:{visible,overflow},errors};
 fs.writeFileSync(path.join(dir,'advanced-qa-results.json'),JSON.stringify(result,null,2)+'\n');console.log('ADVANCED_RESEARCH_QA',JSON.stringify(result));
 if(!result.passed)process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error('ADVANCED_RESEARCH_QA_FAILED',e.stack||e);process.exitCode=1});
