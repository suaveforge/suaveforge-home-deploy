'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'../..');
const files={
 '/':{type:'text/html; charset=utf-8',body:fs.readFileSync(path.join(root,'career/index.html'),'utf8')},
 '/data.json':{type:'application/json; charset=utf-8',body:fs.readFileSync(path.join(root,'career/data.json'),'utf8')},
 '/specialties.json':{type:'application/json; charset=utf-8',body:fs.readFileSync(path.join(root,'career/specialties.json'),'utf8')},
 '/specialties.js':{type:'application/javascript; charset=utf-8',body:fs.readFileSync(path.join(root,'career/specialties.js'),'utf8')},
 '/specialties.css':{type:'text/css; charset=utf-8',body:fs.readFileSync(path.join(root,'career/specialties.css'),'utf8')}
};
const source=JSON.parse(files['/specialties.json'].body);
assert.equal(source.items.length,63);
assert.equal(source.companies.length,9);
const counts=source.items.reduce((a,x)=>(a[x.stage]=(a[x.stage]||0)+1,a),{});
assert.equal(counts.registered,9);assert.equal(counts.active,9);assert.equal(counts.queue,45);
(async()=>{
 const chrome=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
 assert.ok(chrome,'Chrome/Chromium required');
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 try{
  for(const device of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
   const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://career.test/**',route=>{
    const file=files[new URL(route.request().url()).pathname];
    if(!file)return route.abort();
    route.fulfill({status:200,contentType:file.type,body:file.body});
   });
   await page.goto('https://career.test/',{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelectorAll('#fields .field').length===10);
   await page.waitForFunction(()=>document.querySelectorAll('#careerSpecialtyTabs button').length===4);
   assert.equal(await page.locator('#careerSpecialties').count(),0,'no extra standalone panel');
   assert.equal(await page.locator('#notice').count(),0,'no long explanatory banner');
   assert.equal(await page.locator('#careerSpecialtyCards .field').count(),0,'no placeholder cards on original dashboard');
   assert.equal(await page.locator('#fields .field .name').first().textContent(),'웹 개발');
   assert.equal(await page.locator('#careerSpecialtyCards input').count(),0,'no new forms');
   const tabs=page.locator('#careerSpecialtyTabs');
   assert.deepEqual(await tabs.locator('button strong').allTextContents(),['10','0','54','10']);
   await tabs.getByRole('tab',{name:/대기 54/}).click();
   assert.equal(await page.locator('#careerSpecialtyCards .field').count(),54);
   await tabs.getByRole('tab',{name:/확인 완료 0/}).click();
   assert.match(await page.locator('#careerSpecialtyCards').textContent(),/확인 완료된 항목이 없습니다/);
   await tabs.getByRole('tab',{name:/기존 등록 10/}).click();
   assert.equal(await page.locator('#fields .field:visible').count(),10,'the original progress cards remain intact');
   assert.equal(await page.locator('#careerSpecialtyCards:visible').count(),0);
   await tabs.getByRole('tab',{name:/복원 중 10/}).click();
   assert.equal(await page.locator('#fields .field:visible').count(),10,'original ten rich progress cards must remain visible on active tab');
   const rich=page.locator('#fields .field');
   assert.equal(await rich.locator('.numbers').count(),10,'all field percentages/months preserved');
   assert.ok(await rich.locator('.track').count()>=9,'original progress bars preserved');
   assert.equal(await rich.locator('.field-sources').count(),10,'original company statuses and contribution UI preserved');
   assert.match(await rich.first().textContent(),/87 \/ 120개월/,'original insured months plus five paid user-confirmed months retained');
   assert.equal(await rich.locator('.field-paid-note').count(),0,'no intrusive administrative notice inside career cards');
   assert.equal(await page.locator('#careerSpecialtyCards .field').count(),0);
   assert.equal(await page.locator('#careerGantt').count(),1);
   assert.equal(await page.locator('#careerTimeline').count(),1);
   const widths=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(widths.scroll<=widths.viewport+3,'horizontal overflow: '+JSON.stringify(widths));
   const dest=path.join(root,'artifacts','career-specialty-'+device.name+'.png');
   fs.mkdirSync(path.dirname(dest),{recursive:true});
   await page.locator('#careerFields').screenshot({path:dest});
   assert.deepEqual(errors,[],'JS errors');
   console.log('CAREER_SIMPLE_TABS_PASS',device.name,JSON.stringify(widths));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
