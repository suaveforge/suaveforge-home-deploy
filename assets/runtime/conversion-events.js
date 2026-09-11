(()=>{
  'use strict';
  if(window.SF_CONVERSION_EVENTS)return;

  const onceKeys=new Set();
  const onceSession=(key)=>{
    if(onceKeys.has(key))return false;
    onceKeys.add(key);
    try{
      const k='sf_conv_'+key;
      if(sessionStorage.getItem(k))return false;
      sessionStorage.setItem(k,'1');
    }catch{}
    return true;
  };
  const track=(eventType,metadata={})=>{
    const send=(analytics)=>analytics?.event?.(eventType,{metadata:{...metadata,capturedAt:new Date().toISOString()}});
    if(window.SF_ANALYTICS){void send(window.SF_ANALYTICS);return}
    const loader=window.SF_ANALYTICS_LOADER;
    if(loader?.load)void loader.load().then(send).catch(()=>{});
  };
  window.SF_TRACK_CONVERSION=track;

  document.addEventListener('click',event=>{
    const el=event.target instanceof Element?event.target:null;
    if(!el)return;

    const project=el.closest('[data-open-project]');
    if(project){
      track('project_open',{projectId:project.getAttribute('data-open-project')||'',source:'homepage'});
    }

    const offerCta=el.closest('#offerlab-benefits .offerlab-cta');
    if(offerCta){
      track('offerlab_cta_click',{label:(offerCta.textContent||'').trim().slice(0,80),target:offerCta.getAttribute('href')||''});
    }
  },true);

  document.addEventListener('focusin',event=>{
    const el=event.target instanceof Element?event.target:null;
    if(!el?.closest('[data-project-form]'))return;
    if(onceSession('contact_form_start'))track('contact_form_start',{source:'contact_form'});
  },true);

  const offer=document.getElementById('offerlab-benefits');
  if(offer&&'IntersectionObserver'in window){
    const io=new IntersectionObserver(entries=>{
      const hit=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=0.25);
      if(!hit)return;
      io.disconnect();
      if(onceSession('offerlab_view'))track('offerlab_view',{threshold:0.25});
    },{threshold:[0.25]});
    io.observe(offer);
  }

  const form=document.querySelector('[data-project-form]');
  if(form){
    form.addEventListener('submit',()=>{
      if(onceSession('contact_submit_attempt'))track('contact_submit_attempt',{source:'contact_form'});
    },true);
    const status=document.querySelector('[data-form-status]');
    if(status&&'MutationObserver'in window){
      const mo=new MutationObserver(()=>{
        const message=(status.textContent||'').trim();
        if(!/상담 (내용이|전송 요청이) 접수되었습니다/.test(message))return;
        if(onceSession('contact_submit_success'))track('contact_submit_success',{source:'contact_form'});
      });
      mo.observe(status,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-state']});
    }
  }

  window.SF_CONVERSION_EVENTS={track};
})();