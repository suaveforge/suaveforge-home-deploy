"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const KEY="suaveforge:career:specialties:v1";
 let data=null,stages={},firms={},seeds={},tab="active",selected="",message="";
 const stageOf=item=>stages[item.id]||item.stage;
 const key=(field,company)=>field+"|"+company;
 const getFirm=(field,company)=>Object.assign({status:"unknown",note:"",start:"",end:""},seeds[key(field,company)]||{},firms[key(field,company)]||{});
 const label=status=>status==="yes"?"수행 확인":status==="no"?"해당 X":"미확인";
 function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,stages,companies:firms}));return true}catch(e){message="브라우저 저장 실패";console.error(e);return false}}
 function totals(item){
  const out={yes:0,no:0,unknown:0,dated:0};
  for(const company of data.companies){
   const f=getFirm(item.id,company.id);
   if(f.status==="yes"){
    out.yes++;
    if(/^\d{4}-(0[1-9]|1[0-2])$/.test(f.start)&&/^\d{4}-(0[1-9]|1[0-2])$/.test(f.end)&&f.start<=f.end&&f.note.trim())out.dated++;
   }else if(f.status==="no")out.no++;else out.unknown++;
  }return out;
 }
 function render(){
  if(!data)return;
  const counts={active:0,done:0,queue:0,registered:0};
  for(const item of data.items)counts[stageOf(item)]++;
  for(const name of Object.keys(counts))$("cr-count-"+name).textContent=String(counts[name]);
  for(const b of $("cr-tabs").querySelectorAll("[data-tab]"))b.setAttribute("aria-selected",String(tab===b.dataset.tab));
  const search=$("cr-search").value.trim().toLowerCase();
  const visible=data.items.filter(x=>stageOf(x)===tab&&(!search||x.name.toLowerCase().includes(search)||x.group.toLowerCase().includes(search)));
  if(!visible.some(x=>x.id===selected))selected=visible[0]?.id||"";
  $("cr-list").innerHTML=visible.length?visible.map(item=>{
   const stat=totals(item);
   const subtitle=tab==="registered"?"기존 등록":(stat.yes+"개 수행 확인");
   return '<button type="button" data-select="'+esc(item.id)+'" aria-current="'+String(item.id===selected)+'"><span><strong>'+esc(item.name)+'</strong><small>'+esc(item.group)+'</small></span><em>'+esc(subtitle)+'</em></button>';
  }).join(""):'<div class="cr-empty">해당 분야 없음</div>';
  renderDetail();
 }
 function renderDetail(){
  const item=data?.items.find(x=>x.id===selected);
  if(!item){$("cr-detail").innerHTML='<div class="cr-empty">분야를 선택하세요.</div>';return}
  const t=totals(item);
  let html='<h3>'+esc(item.name)+'</h3><div class="cr-meta"><span>'+esc(item.origin)+'</span><span>수행 '+t.yes+' · 미확인 '+t.unknown+' · 해당 X '+t.no+'</span><span>기간 기록 '+t.dated+'곳</span></div>';
  if(stageOf(item)==="registered"){$("cr-detail").innerHTML=html+'<p style="font-size:13px;color:#75869a">기존 경력 게이지에 등록된 분야입니다.</p><a href="#careerFields">기존 현황 보기</a>';return}
  html+='<p class="cr-error" id="cr-message" aria-live="polite">'+esc(message)+'</p>';
  html+=data.companies.map(company=>{
   const f=getFirm(item.id,company.id),k=key(item.id,company.id);
   return '<details class="cr-company" data-firm-detail="'+esc(k)+'"'+(f.status==="yes"?" open":"")+'>'+
   '<summary><strong>'+esc(company.name)+'</strong><span class="'+(f.status==="yes"?"cr-yes":"")+'">'+label(f.status)+'　▾</span></summary>'+
   '<div class="cr-company-body"><label>수행 여부</label><select data-field="'+esc(item.id)+'" data-company="'+esc(company.id)+'" data-value="status">'+
   '<option value="unknown"'+(f.status==="unknown"?" selected":"")+'>미확인</option>'+
   '<option value="yes"'+(f.status==="yes"?" selected":"")+'>수행 확인</option>'+
   '<option value="no"'+(f.status==="no"?" selected":"")+'>해당 X</option></select>'+
   '<div class="cr-dates"><div><label>시작월</label><input type="month" data-field="'+esc(item.id)+'" data-company="'+esc(company.id)+'" data-value="start" value="'+esc(f.start)+'"></div>'+
   '<div><label>종료월</label><input type="month" data-field="'+esc(item.id)+'" data-company="'+esc(company.id)+'" data-value="end" value="'+esc(f.end)+'"></div></div>'+
   '<label>수행업무·증빙</label><input class="cr-note" maxlength="500" type="text" placeholder="수행한 업무·근거" data-field="'+esc(item.id)+'" data-company="'+esc(company.id)+'" data-value="note" value="'+esc(f.note)+'"></div></details>';
  }).join("");
  html+='<div class="cr-actions">';
  const s=stageOf(item);
  if(s!=="active")html+='<button class="cr-main" data-move="active">복원 중으로</button>';
  if(s!=="queue")html+='<button data-move="queue">대기로</button>';
  if(s!=="done")html+='<button data-move="done">수행 확인 완료</button>';
  html+='</div>';
  $("cr-detail").innerHTML=html;
 }
 function validAndLoad(raw){
  const ids=new Set(data.items.map(x=>x.id)),companyIds=new Set(data.companies.map(x=>x.id)),ns={},nf={};
  if(!raw||raw.version!==1||!raw.stages||!raw.companies||typeof raw.stages!=="object"||typeof raw.companies!=="object")throw Error("백업 파일 형식 오류");
  for(const [id,s] of Object.entries(raw.stages))if(ids.has(id)&&!["F001","F002","F003","F004","F005","F006","F007","F008","F009"].includes(id)&&["active","queue","done"].includes(s))ns[id]=s;
  for(const [k,c] of Object.entries(raw.companies)){
   const parts=k.split("|");
   if(parts.length!==2||!ids.has(parts[0])||!companyIds.has(parts[1])||!c||!["yes","no","unknown"].includes(c.status))continue;
   nf[k]={status:c.status,note:String(c.note||"").slice(0,500),start:String(c.start||"").slice(0,7),end:String(c.end||"").slice(0,7)};
  }
  return {stages:ns,companies:nf};
 }
 function initialize(){
  for(const s of data.seeds||[])seeds[key(s.field,s.company)]=s;
  try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved){const state=validAndLoad(saved);stages=state.stages;firms=state.companies}}catch(e){console.warn("기존 세부경력 임시저장 자료 불러오기 실패",e)}
  $("cr-tabs").addEventListener("click",e=>{
   const btn=e.target.closest("[data-tab]");if(!btn)return;
   tab=btn.dataset.tab;message="";render();
  });
  $("cr-list").addEventListener("click",e=>{
   const btn=e.target.closest("[data-select]");if(!btn)return;
   selected=btn.dataset.select;message="";render();
  });
  $("cr-detail").addEventListener("click",e=>{
   const btn=e.target.closest("[data-move]");if(!btn)return;
   const item=data.items.find(x=>x.id===selected);if(!item)return;
   if(btn.dataset.move==="done"&&totals(item).unknown){
    message="미확인 회사 "+totals(item).unknown+"곳을 먼저 확인하세요.";renderDetail();return;
   }
   stages[item.id]=btn.dataset.move;save();tab=btn.dataset.move;message="";render();
  });
  $("cr-detail").addEventListener("change",e=>{
   const input=e.target.closest("[data-value]");if(!input)return;
   const field=input.dataset.field,company=input.dataset.company,k=key(field,company),f=getFirm(field,company);
   f[input.dataset.value]=input.value;firms[k]={status:f.status,note:String(f.note||"").slice(0,500),start:String(f.start||"").slice(0,7),end:String(f.end||"").slice(0,7)};
   save();message="";render();
   const reopened=Array.from($("cr-detail").querySelectorAll("[data-firm-detail]")).find(x=>x.dataset.firmDetail===k);
   if(reopened)reopened.open=true;
  });
  $("cr-search").addEventListener("input",render);
  $("cr-backup").addEventListener("click",()=>{
   const blob=new Blob([JSON.stringify({version:1,stages,companies:firms},null,2)],{type:"application/json"});
   const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="career-specialty-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  $("cr-import").addEventListener("click",()=>$("cr-file").click());
  $("cr-file").addEventListener("change",async e=>{
   const file=e.target.files?.[0];if(!file)return;
   try{const state=validAndLoad(JSON.parse(await file.text()));
    if(!confirm("현재 브라우저의 세부경력 기록을 백업 내용으로 바꿀까요?"))return;
    stages=state.stages;firms=state.companies;save();message="백업 반영 완료";render();
   }catch(err){message="불러오기 실패: "+err.message;renderDetail()}finally{e.target.value=""}
  });
  render();
 }
 async function boot(){
  const destination=$("careerFields");if(!destination)return;
  const root=document.createElement("section");root.className="cr";root.id="careerSpecialties";root.setAttribute("aria-label","세부경력 복원");
  root.innerHTML='<div class="cr-header"><h2>세부경력 복원</h2><small>63개 분야 · 재직회사 9곳</small></div>'+
   '<div class="cr-tabs" id="cr-tabs" role="tablist" aria-label="경력 복원 단계">'+
   '<button type="button" data-tab="active" role="tab" aria-selected="true">복원 중 <strong id="cr-count-active">9</strong></button>'+
   '<button type="button" data-tab="done" role="tab" aria-selected="false">확인 완료 <strong id="cr-count-done">0</strong></button>'+
   '<button type="button" data-tab="queue" role="tab" aria-selected="false">대기 <strong id="cr-count-queue">45</strong></button>'+
   '<button type="button" data-tab="registered" role="tab" aria-selected="false">기존 등록 <strong id="cr-count-registered">9</strong></button></div>'+
   '<div class="cr-columns"><div class="cr-left"><input type="search" id="cr-search" placeholder="분야 검색" aria-label="분야 검색"><div class="cr-list" id="cr-list"></div></div>'+
   '<div class="cr-right" id="cr-detail"></div></div>'+
   '<div class="cr-footer"><span>이 브라우저에 저장</span><div><button type="button" id="cr-backup">백업</button><button type="button" id="cr-import">불러오기</button><input type="file" id="cr-file" accept=".json,application/json" hidden></div></div>';
  destination.parentNode.insertBefore(root,destination);
  try{
   const r=await fetch("./specialties.json",{cache:"no-store"});if(!r.ok)throw Error("분야 데이터 HTTP "+r.status);
   data=await r.json();
   if(!Array.isArray(data.items)||data.items.length!==63||!Array.isArray(data.companies)||data.companies.length!==9)throw Error("분야 데이터 불일치");
   initialize();
  }catch(e){$("cr-list").innerHTML='<div class="cr-empty">세부경력 목록을 불러오지 못했습니다.</div>';console.error(e)}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();