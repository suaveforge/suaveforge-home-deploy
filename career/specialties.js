"use strict";
(()=>{
  const lookup=id=>document.getElementById(id);
  const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const LABELS={active:"복원 중",done:"확인 완료",queue:"대기",registered:"기존 등록"};
  const KEY="suaveforge:career:specialties:v1";
  let info=null,tab="active",stored={stages:{},companies:{}};

  function stage(item){return ["active","done","queue"].includes(stored.stages?.[item.id])&&item.stage!=="registered"?stored.stages[item.id]:item.stage}
  function confirmedCompanies(item){
    const result=[];
    for(const company of info.companies){
      const key=item.id+"|"+company.id;
      const original=(info.seeds||[]).find(x=>x.field===item.id&&x.company===company.id);
      const current=stored.companies?.[key];
      if((current?.status||original?.status)==="yes")result.push(company.name);
    }
    return result;
  }
  function render(){
    if(!info)return;
    const count={active:0,done:0,queue:0,registered:10};
    for(const item of info.items)if(stage(item)!=="registered")count[stage(item)]++;
    document.querySelectorAll("#careerSpecialtyTabs button[data-tab]").forEach(button=>{
      const choice=button.dataset.tab;button.setAttribute("aria-selected",String(choice===tab));
      button.querySelector("strong").textContent=count[choice];
    });
    const original=lookup("fields"),added=lookup("careerSpecialtyCards");
    original.hidden=tab!=="registered";
    added.hidden=tab==="registered";
    if(tab==="registered")return;
    const list=info.items.filter(item=>stage(item)===tab);
    added.innerHTML=list.length?list.map(item=>{
      const companies=confirmedCompanies(item);
      const source=companies.length?'<div class="specialty-sources">'+companies.map(name=>'<span class="specialty-company">'+escape(name)+'</span>').join("")+'</div>':"";
      return '<article class="field specialty-field"><div class="name">'+escape(item.name)+'</div>'+source+'</article>';
    }).join(""):'<p class="specialty-empty">확인 완료된 항목이 없습니다.</p>';
  }
  async function init(){
    const section=lookup("careerFields");
    if(!section)return;
    try{
      const r=await fetch("./specialties.json",{cache:"no-store"});
      if(!r.ok)throw Error("HTTP "+r.status);
      info=await r.json();
      if(info.items?.length!==63||info.companies?.length!==9)throw Error("목록 데이터 확인 실패");
      try{
        const saved=JSON.parse(localStorage.getItem(KEY)||"null");
        if(saved&&typeof saved==="object")stored={stages:saved.stages||{},companies:saved.companies||{}};
      }catch(e){console.warn("이전 브라우저 기록 불러오기 실패",e)}
      const tabs=document.createElement("div");
      tabs.id="careerSpecialtyTabs";
      tabs.className="specialty-tabs";
      tabs.setAttribute("role","tablist");
      tabs.setAttribute("aria-label","경력 단계");
      tabs.innerHTML=Object.entries(LABELS).map(([id,title])=>
        '<button type="button" role="tab" data-tab="'+id+'" aria-selected="'+String(id===tab)+'">'+title+' <strong>0</strong></button>'
      ).join("");
      const added=document.createElement("div");
      added.id="careerSpecialtyCards";
      added.className="grid";
      added.setAttribute("aria-live","polite");
      const fields=lookup("fields");
      section.insertBefore(tabs,fields);
      fields.insertAdjacentElement("afterend",added);
      tabs.addEventListener("click",e=>{
        const button=e.target.closest("button[data-tab]");
        if(!button)return;
        tab=button.dataset.tab;
        render();
      });
      render();
    }catch(e){console.error("경력 세부목록",e)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();