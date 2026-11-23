'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'../..');
const files={
 '/':{type:'text/html; charset=utf-8',text:fs.readFileSync(path.join(root,'career/index.html'),'utf8')},
 '/data.json':{type:'application/json; charset=utf-8',text:fs.readFileSync(path.join(root,'career/data.json'),'utf8')},
 '/specialties.json':{type:'application/json; charset=utf-8',text:fs.readFileSync(path.join(root,'career/specialties.json'),'utf8')},
 '/specialties.js':{type:'application/javascript; charset=utf-8',text:fs.readFileSync(path.join(root,'career/specialties.js'),'utf8')},
 '/specialties.css':{type:'text/css; charset=utf-8',text:fs.readFileSync(path.join(root,'career/specialties.css'),'utf8')}
};
const categories=JSON.parse(files['/specialties.json'].text);
assert.equal(categories.items.length,63);
assert.equal(categories.companies.length,9);
const counts=categories.items.reduce((a,x)=>(a[x.stage]=(a[x.stage]||0)+1,a),{});
assert.deepEqual(counts,{registered:9,active:9,queue:45});
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
 assert.ok(chrome,'Chrome required for visual QA');
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 try{
  for(const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
   const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://career.test/**',route=>{
    const url=new URL(route.request().url()),file=files[url.pathname];
    if(!file)return route.abort();
    return route.fulfill({status:200,contentType:file.type,body:file.text});
   });
   await page.goto('https://career.test/',{waitUntil:'load'});
   await page.locator('#careerSpecialties').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelectorAll('#careerSpecialties .cr-list button').length===9);
   assert.equal(await page.locator('#notice').count(),0,'no verbose banner');
   assert.equal(await page.locator('#careerFields .field').count(),10,'legacy career fields unchanged');
   for(const [k,v]of Object.entries({active:9,done:0,queue:45,registered:9})){
    assert.equal(await page.locator('#cr-count-'+k).textContent(),String(v));
   }
   await page.getByRole('tab',{name:/대기 45/}).click();
   assert.equal(await page.locator('#cr-list button').count(),45);
   await page.getByRole('tab',{name:/기존 등록 9/}).click();
   assert.equal(await page.locator('#cr-list button').count(),9);
   await page.getByRole('tab',{name:/복원 중 9/}).click();
   await page.locator('#cr-list [data-select="F010"]').click();
   assert.equal(await page.locator('#cr-detail details.cr-company').count(),9);
   assert.match(await page.locator('#cr-detail').textContent(),/엔투스튜디오/);
   assert.match(await page.locator('#cr-detail').textContent(),/버드레터/);
   await page.locator('#cr-detail [data-move="done"]').click();
   assert.match(await page.locator('#cr-message').textContent(),/미확인 회사 7곳/);
   await page.locator('#cr-detail details[data-firm-detail="F010|C01"] summary').click();
   await page.locator('#cr-detail select[data-field="F010"][data-company="C01"]').selectOption('no');
   assert.match(await page.locator('#cr-detail .cr-meta').textContent(),/미확인 6/);
   await page.reload({waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelectorAll('#careerSpecialties .cr-list button').length===9);
   await page.locator('#cr-list [data-select="F010"]').click();
   const firm=page.locator('#cr-detail details[data-firm-detail="F010|C01"]');
   assert.match(await firm.locator('summary').textContent(),/해당 X/,'saved employer decision survives refresh');
   const overflow=await page.evaluate(()=>({window:innerWidth,doc:document.documentElement.scrollWidth}));
   assert.ok(overflow.doc<=overflow.window+3,JSON.stringify({device:device.name,overflow}));
   const out=path.join(root,'artifacts','career-specialty-'+device.name+'.png');
   fs.mkdirSync(path.dirname(out),{recursive:true});
   await page.locator('#careerSpecialties').screenshot({path:out});
   assert.deepEqual(errors,[],JSON.stringify({device:device.name,errors}));
   console.log('CAREER_SPECIALTY_QA_PASS',device.name,JSON.stringify({counts,employers:9,storagePersisted:true,overflow}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
