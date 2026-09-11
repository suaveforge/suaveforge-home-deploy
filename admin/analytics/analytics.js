(()=>{
  'use strict';
  const API='https://api-suaveforge.suaveforge.com:18454';
  const auth=document.getElementById('auth');
  const setupPanel=document.getElementById('setupPanel');
  const loginPanel=document.getElementById('loginPanel');
  const bootStatus=document.getElementById('bootStatus');
  const dash=document.getElementById('dashboard');
  const range=document.getElementById('range');
  const searchRefresh=document.getElementById('refreshSearchIndex');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString();
  const pct=(a,b)=>b?Math.round(Number(a||0)/Number(b)*1000)/10:0;
  const date=v=>v?new Date(v).toLocaleString('ko-KR'):'-';
  const seconds=v=>v?`${Math.round(Number(v)/100)/10}초`:'-';
  const empty=(cols,text='데이터 없음')=>`<tr><td colspan="${cols}" class="empty">${text}</td></tr>`;
  const state=x=>[x.consultation?'상담':'',x.pilot?'선개발':'',x.contract?'계약':''].filter(Boolean).map(v=>`<span class="tag ${v==='계약'?'tag-contract':''}">${v}</span>`).join(' ')||'<span class="muted">-</span>';

  function showSetup(){
    auth.hidden=false;dash.hidden=true;bootStatus.hidden=true;loginPanel.hidden=true;setupPanel.hidden=false;
    document.getElementById('setupPassword').focus();
  }
  function showLogin(){
    auth.hidden=false;dash.hidden=true;bootStatus.hidden=true;setupPanel.hidden=true;loginPanel.hidden=false;
  }
  function showDashboard(){auth.hidden=true;dash.hidden=false;}

  document.getElementById('setupForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.currentTarget,s=f.querySelector('.status');
    s.textContent='';
    if(f.password.value.length<8){s.textContent='비밀번호는 8자 이상으로 설정해 주세요.';return;}
    if(f.password.value!==f.confirm.value){s.textContent='비밀번호 확인이 일치하지 않습니다.';return;}
    try{
      const r=await fetch(API+'/api/v1/admin/setup',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({password:f.password.value})});
      if(r.status===409){s.textContent='이미 관리자 비밀번호가 설정되어 있습니다. 로그인 화면으로 전환합니다.';setTimeout(showLogin,800);return;}
      if(!r.ok){const x=await r.json().catch(()=>({}));s.textContent=x?.minLength?`비밀번호는 ${x.minLength}자 이상이어야 합니다.`:'비밀번호를 설정하지 못했습니다.';return;}
      f.reset();showDashboard();await load();
    }catch{s.textContent='관리자 API에 연결할 수 없습니다.';}
  });

  document.getElementById('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.currentTarget,s=f.querySelector('.status');
    s.textContent='';
    try{
      const r=await fetch(API+'/api/v1/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({password:f.password.value})});
      if(!r.ok){s.textContent='로그인 정보를 확인해 주세요.';return;}
      f.reset();showDashboard();await load();
    }catch{s.textContent='관리자 API에 연결할 수 없습니다.';}
  });

  range.addEventListener('change',()=>load().catch(showLogin));
  searchRefresh.addEventListener('click',()=>refreshSearchIndex());

  async function load(){
    const r=await fetch(API+'/api/v1/admin/analytics?days='+encodeURIComponent(range.value),{credentials:'include'});
    if(r.status===401){showLogin();return;}
    if(!r.ok)throw new Error('analytics request failed');
    const d=await r.json();
    showDashboard();render(d);
    loadSearchIndex().catch(()=>setSearchStatus('검색 색인 상태를 불러오지 못했습니다.','error'));
  }

  async function boot(){
    bootStatus.hidden=false;setupPanel.hidden=true;loginPanel.hidden=true;
    try{
      const r=await fetch(API+'/api/v1/admin/setup/status',{credentials:'include'});
      if(!r.ok)throw new Error('setup status failed');
      const d=await r.json();
      if(d.needsSetup){showSetup();return;}
      await load();
    }catch{
      auth.hidden=false;dash.hidden=true;setupPanel.hidden=true;loginPanel.hidden=true;bootStatus.hidden=false;
      bootStatus.textContent='관리자 API에 연결할 수 없습니다.';
      bootStatus.classList.add('error');
    }
  }

  function conversionRows(rows,labelKey){
    const list=(rows||[]).slice(0,10);
    if(!list.length)return '<p class="empty-block">데이터 없음</p>';
    const max=Math.max(1,...list.map(x=>Number(x.diagnoses||0)));
    return `<div class="conversion-chart">${list.map(x=>{
      const diagnoses=Number(x.diagnoses||0);
      const width=Math.max(diagnoses?5:0,diagnoses/max*100);
      return `<div class="conversion-row">
        <div class="conversion-meta"><b title="${esc(x[labelKey])}">${esc(x[labelKey])}</b><span>진단 <strong>${num(diagnoses)}</strong> · 완료 ${num(x.completed)} · 상담 ${num(x.consultations)} · 계약 ${num(x.contracts)}</span></div>
        <div class="bar-track"><i style="width:${width}%"></i></div>
      </div>`;
    }).join('')}</div>`;
  }

  function render(d){
    const m=d.topMetrics||{};
    const primary=[
      ['개편 후 방문자','purchaseVisitors','구매 퍼널 기준 방문자'],
      ['OfferLab','offerlab_view',`${pct(m.offerlab_view,m.purchaseVisitors)}% 방문→혜택`],
      ['상담 시작','contact_form_start',`${pct(m.contact_form_start,m.purchaseVisitors)}% 방문→상담 시작`],
      ['상담 제출','contact_submit_success',`${pct(m.contact_submit_success,m.purchaseVisitors)}% 방문→제출`]
    ];
    const secondary=[
      ['페이지뷰','pageviews'],['프로젝트 열기','project_open'],['Offer CTA','offerlab_cta_click'],['진단 시작','diagnosis_started'],['진단 상담','consultation_submitted'],['계약','contract']
    ];
    document.getElementById('topMetrics').innerHTML=
      primary.map(([label,key,note])=>`<article class="metric-primary"><span>${label}</span><b>${num(m[key])}</b><small>${note}</small></article>`).join('')+
      secondary.map(([label,key])=>`<article class="metric-secondary"><span>${label}</span><b>${num(m[key])}</b></article>`).join('');

    const labels={visitor:'방문자',diagnosis_started:'진단 시작',diagnosis_completed:'진단 완료',result_viewed:'결과 확인',email_report_submitted:'이메일',consultation_submitted:'상담',pilot_started:'선개발',contract:'계약'};
    const purchaseLabels={visitor:'방문자',offerlab_view:'OfferLab 도달',offerlab_cta_click:'가능 여부 확인',contact_form_start:'상담 시작',contact_submit_success:'상담 제출'};
    const visual=window.SF_ADMIN_VISUALS;
    document.getElementById('purchaseFunnel').innerHTML=visual?visual.funnel(d.purchaseStages||[],purchaseLabels):'<p class="empty-block">차트 로더 없음</p>';
    const purchaseBaselineNote=document.getElementById('purchaseBaselineNote');
    if(purchaseBaselineNote){
      const baseline=d.purchaseBaselineAt?new Date(d.purchaseBaselineAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'-';
      purchaseBaselineNote.textContent=`개편 측정 기준: ${baseline} 이후 데이터만 집계`;
    }
    document.getElementById('funnel').innerHTML=visual?visual.funnel(d.stages||[],labels):'<p class="empty-block">차트 로더 없음</p>';
    document.getElementById('channels').innerHTML=conversionRows(d.channels||[],'source');
    document.getElementById('campaigns').innerHTML=conversionRows(d.campaigns||[],'campaign');
    document.getElementById('devices').innerHTML=visual?visual.bars((d.devices||[]).map(x=>({...x,label:x.device,value:x.sessions})),'label','value'):'<p class="empty-block">차트 로더 없음</p>';
    document.getElementById('timing').innerHTML=`<article><span>평균</span><b>${seconds(d.timing?.avg_ms)}</b></article><article><span>P95</span><b>${seconds(d.timing?.p95_ms)}</b></article>`;

    document.getElementById('landings').innerHTML=(d.landingPages||[]).length?(d.landingPages||[]).map(x=>`<tr><td class="path">${esc(x.landing)}</td><td>${num(x.diagnoses)}</td><td>${num(x.completed)}</td><td><b>${pct(x.completed,x.diagnoses)}%</b></td></tr>`).join(''):empty(4);

    const adminIp=String(d.adminClientIp||'');
    document.getElementById('visitors').innerHTML=(d.recentVisitors||[]).length?(d.recentVisitors||[]).map(x=>{
      const sameIp=adminIp&&x.ip_address&&String(x.ip_address)===adminIp;
      const geo=[x.country,x.city].filter(Boolean).join(' / ');
      const env=[x.device_type,x.browser,x.os].filter(Boolean).join(' · ');
      const display=[x.screen_width,x.screen_height].every(Boolean)?`${x.screen_width}×${x.screen_height}`:'';
      const source=x.referrer||x.utm_source||'직접 유입';
      const last=x.last_page||x.landing_page||'-';
      return `<tr class="${sameIp?'same-ip-row':''}">
        <td>${date(x.last_seen_at)}<small>${x.last_event?esc(x.last_event):''}</small></td>
        <td><b class="mono" title="${esc(x.visitor_id)}">${esc(String(x.visitor_id||'').slice(0,8))}</b>${sameIp?'<span class="self-ip">현재 관리자와 동일 IP</span>':''}<small>첫 방문 ${date(x.first_seen_at)}</small></td>
        <td><b class="mono">${esc(x.ip_address)||'-'}</b><small>${esc(geo)||'위치 헤더 없음'}</small></td>
        <td><b>${esc(env)||'-'}</b><small>${esc([display,x.language,x.timezone].filter(Boolean).join(' · '))||'-'}</small></td>
        <td><b class="path">${esc(x.landing_page)||'/'}</b><small>${esc(source)}</small><small>최근 ${esc(last)}</small></td>
        <td><b>세션 ${num(x.sessions)} · PV ${num(x.pageviews)} · 진단 ${num(x.diagnoses)}</b><small>세션 최근 ${date(x.session_last_seen_at)}</small></td>
      </tr>`;
    }).join(''):empty(6);

    document.getElementById('recent').innerHTML=(d.recent||[]).length?(d.recent||[]).map(x=>`<tr><td>${date(x.created_at)}</td><td><b>${esc(x.hostname)}</b></td><td><span class="pill ${x.status==='failed'?'pill-fail':''}">${esc(x.status)}</span></td><td>${seconds(x.processing_time_ms)}</td><td>${state(x)}</td><td><div class="actions"><button data-pilot="${esc(x.diagnosis_id)}" ${x.pilot?'disabled':''}>${x.pilot?'선개발 완료':'선개발'}</button><button class="contract" data-contract="${esc(x.diagnosis_id)}" ${x.contract?'disabled':''}>${x.contract?'계약 완료':'계약'}</button></div></td></tr>`).join(''):empty(6);

    document.getElementById('consultations').innerHTML=(d.consultations||[]).length?(d.consultations||[]).map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.name)||'-'}</td><td>${esc(x.email)||'-'}</td><td>${esc(x.phone)||'-'}</td><td class="message">${esc(x.message)||'-'}</td></tr>`).join(''):empty(5);
    document.getElementById('contractOrigins').innerHTML=(d.contractOrigins||[]).length?(d.contractOrigins||[]).map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.hostname)||'-'}</td><td>${esc(x.source)}</td><td>${esc(x.campaign)}</td><td class="path">${esc(x.landing)}</td></tr>`).join(''):empty(5);
    document.getElementById('failed').innerHTML=(d.failed||[]).length?(d.failed||[]).map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.hostname)}</td><td><span class="pill pill-fail">${esc(x.error_stage)||'-'}</span></td><td class="mono">${esc(x.error_code)||'-'}</td><td class="message"><b>${esc(x.error_message)||'-'}</b>${x.error_debug?`<details class="debug"><summary>디버그 상세</summary><pre>${esc(x.error_debug)}</pre></details>`:''}</td></tr>`).join(''):empty(5);

    document.querySelectorAll('[data-pilot]:not([disabled])').forEach(b=>b.addEventListener('click',()=>mark(b.dataset.pilot,'pilot')));
    document.querySelectorAll('[data-contract]:not([disabled])').forEach(b=>b.addEventListener('click',()=>mark(b.dataset.contract,'contract')));
  }

  function setSearchStatus(text,type=''){
    const el=document.getElementById('searchIndexStatus');
    el.textContent=text||'';el.className='search-index-status'+(type?' '+type:'');
  }

  function indexBadge(x){
    const labels={indexed:'색인됨',discovered:'발견됨 · 미색인',unknown:'Google 미인지',other:x.coverageState||'기타'};
    return `<span class="index-badge index-${esc(x.state)}">${esc(labels[x.state]||labels.other)}</span>`;
  }

  function renderSearchIndex(snapshot){
    const s=snapshot?.summary||{};
    const p=snapshot?.performance||{};
    document.getElementById('searchIndexUpdated').textContent=`최근 갱신 ${date(snapshot?.generatedAt)}`;
    document.getElementById('searchIndexMetrics').innerHTML=[
      ['색인',s.indexed||0,`/ ${s.total||25}`,'good'],
      ['미크롤링',s.neverCrawled||0,'URL','warn'],
      ['발견 · 미색인',s.discovered||0,'URL',''],
      ['Google 미인지',s.unknown||0,'URL','bad'],
      ['28일 노출',p.impressions||0,'회',''],
      ['28일 클릭',p.clicks||0,'회','']
    ].map(([label,value,note,kind])=>`<article class="${kind}"><span>${label}</span><b>${num(value)}</b><small>${note}</small></article>`).join('');

    const rows=snapshot?.pages||[];
    document.getElementById('searchIndexRows').innerHTML=rows.length?rows.map(x=>`<tr>
      <td><b>${esc(x.slug)}</b><small>${x.group==='buyer-intent'?'신규 의도':'핵심 랜딩'}</small></td>
      <td>${indexBadge(x)}${x.neverCrawled?'<small class="crawl-none">아직 크롤링 없음</small>':''}</td>
      <td>${date(x.lastCrawlTime)}</td>
      <td>${num(x.referrerCount)}</td>
      <td>${num(x.impressions)}</td>
      <td>${num(x.clicks)}</td>
      <td>${(Number(x.ctr||0)*100).toFixed(1)}%</td>
      <td>${x.position==null?'-':Number(x.position).toFixed(1)}</td>
    </tr>`).join(''):empty(8,'아직 저장된 GSC 스냅샷이 없습니다.');
    const w=snapshot?.performanceWindow;
    setSearchStatus(w?`검색 성과 기간: ${w.startDate} ~ ${w.endDate} · 색인 상태는 위 최근 갱신 시각 기준입니다.`:'');
  }

  async function loadSearchIndex(){
    const r=await fetch(API+'/api/v1/admin/search-index-status',{credentials:'include'});
    if(r.status===401){showLogin();return;}
    if(!r.ok)throw new Error('search index request failed');
    const d=await r.json();
    if(!d.configured){setSearchStatus('GSC 서버 인증이 아직 연결되지 않았습니다.','error');return;}
    if(d.snapshot)renderSearchIndex(d.snapshot);
    else setSearchStatus('첫 GSC 자동 수집 전입니다. 지금 갱신을 누르면 즉시 조회합니다.');
  }

  async function refreshSearchIndex(){
    searchRefresh.disabled=true;searchRefresh.textContent='Google 조회 중…';
    setSearchStatus('25개 검색 랜딩을 Google Search Console에서 다시 확인하는 중입니다.');
    try{
      const r=await fetch(API+'/api/v1/admin/search-index-status/refresh',{method:'POST',credentials:'include'});
      if(r.status===401){showLogin();return;}
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'refresh failed');
      renderSearchIndex(d.snapshot);
      setSearchStatus(`갱신 완료 · 색인 ${d.snapshot?.summary?.indexed||0}/${d.snapshot?.summary?.total||25} · 미크롤링 ${d.snapshot?.summary?.neverCrawled||0}`,'success');
    }catch{
      setSearchStatus('Google Search Console 갱신에 실패했습니다. 서버 로그에서 원인을 확인해야 합니다.','error');
    }finally{
      searchRefresh.disabled=false;searchRefresh.textContent='지금 갱신';
    }
  }

  async function mark(id,type){
    if(!confirm(type==='pilot'?'이 진단을 선개발 단계로 표시할까요?':'이 진단을 계약 전환으로 표시할까요?'))return;
    const r=await fetch(`${API}/api/v1/admin/diagnoses/${encodeURIComponent(id)}/${type}`,{method:'POST',credentials:'include'});
    if(r.ok)await load();
    else alert('상태를 저장하지 못했습니다.');
  }

  boot();
})();
