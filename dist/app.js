import {getNaverMapLinks} from './naver-map.js';
import {REPORT_EMAIL, reportMessage, reportMailURL} from './report-mail.js';
import {loadPublishedStores} from './sheet-feed.js';
const main=document.querySelector('#main');
// Reveal an ordinary web alternative before the browser attempts to open the app.
main.addEventListener('click',event=>{
  const link=event.target.closest?.('#naver-map-link');
  if(link && /^(intent|nmap):/.test(link.getAttribute('href')||'')){
    const fallback=document.querySelector('#naver-web-link');
    if(fallback)fallback.hidden=false;
  }
});
const icon=(name)=>{const p={pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>',menu:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',cup:'<path d="M4 7h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7ZM17 8h1a3 3 0 1 1 0 6h-1M7 3v1m4-1v1m4-1v1"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name]||p.info}</svg>`};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'#'}catch{return '#'}};
let stores=[],query='',lastStore=null;
let selectedProvince='',selectedCity='',selectedDistrict='';
const announce=s=>{document.querySelector('#announcement').textContent=s};
const badge=s=>`<span class="badge${s.status==='비치 중'?'':' absent'}">${esc(s.status==='비치 중'?'점자메뉴판 비치':'현재 미비치')}</span>`;
const back=(href='#',label='매장 목록으로')=>`<div class="page-back"><a class="back" href="${esc(href)}">${icon('back')} ${esc(label)}</a></div>`;
let backBarObserver;
function syncBackBar(){
  backBarObserver?.disconnect();
  const bar=main.querySelector('.page-back');
  const update=()=>document.documentElement.style.setProperty('--back-bar-offset',bar?`${Math.ceil(bar.getBoundingClientRect().height)+12}px`:'0px');
  update();
  if(bar){backBarObserver=new ResizeObserver(update);backBarObserver.observe(bar)}
}
const resetSearch=()=>{query='';selectedProvince='';selectedCity='';selectedDistrict='';renderList();document.querySelector('#search').focus();announce('검색 조건을 초기화했습니다.')};
const provinceNames={'경기도':'경기','서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'};
function listArea(s){const p=(s.area||s.address).trim().split(/\s+/);p[0]=provinceNames[p[0]]||p[0];return (s.area?p:p.slice(0,2)).join(' ')}
function floorLabel(s){const floor=String(s.floor||'').trim();return floor&&!floor.includes('미확인')?floor:''}
function entryLabel(s){return (s.entry||'미확인').replace(/^건물 진입로에 |^진입로 /,'').replaceAll('·','과 ')}
function storeCard(s){return `<li class="store-card"><div class="card-top"><h3><a id="store-${esc(s.id)}" href="#store/${esc(s.id)}">${esc(s.name)}</a></h3><p class="address">${esc(listArea(s))}${floorLabel(s)?` · ${esc(floorLabel(s))}`:''}</p></div><p class="entry-summary">${esc(s.entry||'미확인')}</p>${s.intro?`<p class="store-intro">${esc(s.intro.replace(/\.$/,''))}</p>`:''}<div class="card-bottom"><span class="scope">${esc(s.scope.replaceAll('/',' · '))} 메뉴가 표기됨</span><a class="detail-link" href="#store/${esc(s.id)}" aria-label="${esc(s.name)} 상세 보기">상세 보기 ${icon('arrow')}</a></div></li>`}
function regionFor(s){const p=listArea(s).trim().split(/\s+/);return {province:p[0]||'',city:p[1]||'',district:p[2]||''}}
function resultStores(){const q=query.trim().toLocaleLowerCase();return stores.filter(s=>{const r=regionFor(s);return s.status==='비치 중'&&(!selectedProvince||r.province===selectedProvince)&&(!selectedCity||r.city===selectedCity)&&(!selectedDistrict||r.district===selectedDistrict)&&(!q||[s.name,s.address,listArea(s),s.scope,s.intro||'',...(s.features||[])].join(' ').toLocaleLowerCase().includes(q))})}
function updateResults(speak=true){const list=resultStores();document.querySelector('#results').innerHTML=list.length?`<ul class="cards">${list.map(storeCard).join('')}</ul>`:`<div class="empty"><h3>${stores.length?'검색 결과가 없습니다':'현재 공개된 매장이 없습니다'}</h3>${stores.length?'<p>다른 매장명이나 지역을 입력하세요.</p>':''}<button id="reset" class="secondary">검색 초기화</button></div>`;document.querySelector('#result-count').textContent=`${query||selectedProvince||selectedCity||selectedDistrict?'검색 결과':'매장 목록'} ${list.length}곳`;document.querySelector('#reset')?.addEventListener('click',resetSearch);if(speak)announce(`검색 결과 ${list.length}곳`)}
function regionOptions(values,selected,allLabel){return `<option value="">${allLabel}</option>`+[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko')).map(v=>`<option value="${esc(v)}"${v===selected?' selected':''}>${esc(v)}</option>`).join('')}
function syncRegionSelects(){const all=stores.map(regionFor);const province=document.querySelector('#region-province'),city=document.querySelector('#region-city'),district=document.querySelector('#region-district');province.innerHTML=regionOptions(all.map(r=>r.province),selectedProvince,'전체');city.innerHTML=regionOptions(all.filter(r=>r.province===selectedProvince).map(r=>r.city),selectedCity,'전체');city.disabled=!selectedProvince;district.innerHTML=regionOptions(all.filter(r=>r.province===selectedProvince&&r.city===selectedCity).map(r=>r.district),selectedDistrict,'전체');district.disabled=!selectedCity}
function renderList(){document.title='손끝 — 점자메뉴판 보유 매장 찾기';main.innerHTML=`<section class="list-layout" aria-labelledby="page-title"><h1 id="page-title" class="sr-only">매장 찾기</h1><div class="search-panel"><form id="search-form" role="search"><label class="field-label" for="search">매장명 또는 지역 검색하기</label><div class="searchbox"><div class="search-input-wrap">${icon('search')}<input type="search" id="search" value="${esc(query)}" autocomplete="off"></div><button class="primary" type="submit">검색</button></div><fieldset class="region-fieldset" aria-labelledby="region-title"><legend class="region-label-line"><span id="region-title">지역 선택</span><span class="region-hint">등록 매장이 있는 지역만 표시됩니다.</span></legend><div class="region-selects"><div><label for="region-province">시·도</label><select id="region-province"></select></div><div><label for="region-city">시·군·구</label><select id="region-city"></select></div><div><label for="region-district">읍·면·동</label><select id="region-district"></select></div></div></fieldset><div class="search-tools"><button type="button" class="reset-conditions" id="reset-conditions">조건 초기화</button></div></form></div><div class="results-heading"><h2 id="result-count"></h2></div><div id="results"></div></section>`;syncRegionSelects();document.querySelector('#search-form').addEventListener('submit',e=>{e.preventDefault();query=document.querySelector('#search').value;updateResults()});document.querySelector('#region-province').addEventListener('change',e=>{selectedProvince=e.target.value;selectedCity='';selectedDistrict='';query=document.querySelector('#search').value;syncRegionSelects();updateResults()});document.querySelector('#region-city').addEventListener('change',e=>{selectedCity=e.target.value;selectedDistrict='';query=document.querySelector('#search').value;syncRegionSelects();updateResults()});document.querySelector('#region-district').addEventListener('change',e=>{selectedDistrict=e.target.value;query=document.querySelector('#search').value;updateResults()});document.querySelector('#reset-conditions').addEventListener('click',resetSearch);updateResults(false)}
function renderStore(id){const s=stores.find(s=>s.id===id);if(!s){renderMissing();return}lastStore=id;const naverLinks=getNaverMapLinks(s);document.title=`${s.name} — 손끝`;main.innerHTML=`<article class="detail-layout">${back()}<header class="detail-head"><h1 id="page-title">${esc(s.name)}</h1></header><section class="detail-box"><h2 id="visit-title">주소·연락처</h2><div class="contact-info"><p>${esc(s.address)}</p><p>${esc(s.phone)}</p></div><div class="actions">${/^0[\d-]+$/.test(s.phone)?`<a class="primary" href="tel:${s.phone.replaceAll('-','')}" aria-label="${esc(s.name)} 전화하기">전화하기</a>`:'<p class="small">등록된 전화번호가 없어요.</p>'}<a class="secondary" href="${esc(safeUrl(s.kakao))}">카카오맵에서 길찾기</a><a class="secondary" id="naver-map-link" href="${esc(naverLinks.appUrl||naverLinks.webUrl)}">네이버지도에서 길찾기</a>${naverLinks.appUrl?`<a class="secondary" id="naver-web-link" href="${esc(naverLinks.webUrl)}" hidden>네이버지도 웹에서 길찾기</a>`:''}<button class="secondary" id="copy-address">주소 복사</button></div><p class="small">길찾기는 건물 주소 기준입니다.</p></section><section class="detail-box" aria-labelledby="menu-title"><h2 id="menu-title">점자메뉴판 이용 안내</h2><p class="howto">${esc(s.usage)}</p><p class="small">${esc(s.scope.replaceAll('/',' · '))} 메뉴가 표기됨</p>${s.status!=='비치 중'?'<p class="small">현재 점자메뉴판이 없어요. 새로 비치되었는지 방문 전 매장에 확인해 주세요.</p>':''}</section><section class="detail-box"><h2 id="entry-title">매장 접근 정보</h2><div class="access-info">${floorLabel(s)?`<p>${esc(floorLabel(s))}</p>`:''}<p>${esc(s.entry||'진입로 정보 미확인')}</p></div></section>${s.features?.length?`<section class="detail-box"><h2 id="features-title">매장 특징</h2><div class="store-features">${s.features.map(f=>`<p>${esc(f)}</p>`).join('')}</div></section>`:''}<div class="report-link"><a class="secondary" href="#report/${esc(s.id)}">오류 제보 작성</a></div></article>`;document.querySelector('#copy-address').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(s.address);announce('주소를 복사했습니다.')}catch{announce('자동 복사를 할 수 없습니다. 주소 텍스트를 선택해 복사해 주세요.')}})}
function renderGuide(){document.title='이용 안내 — 손끝';main.innerHTML=`<div class="detail-layout">${back()}<h1 id="page-title">이용 안내</h1><div class="guide-grid"><section class="guide-step"><div><h2>매장 검색</h2><p>매장명이나 지역을 검색하세요. 지역 선택으로 범위를 좁힐 수 있습니다.</p></div></section><section class="guide-step"><div><h2>메뉴판 위치와 표기 메뉴 확인</h2><p>매장 상세에서 점자메뉴판 위치와 표기된 메뉴 종류를 확인하세요.</p></div></section><section class="guide-step"><div><h2>전화번호와 가는 길을 미리 확인해요</h2><p>매장 상세에서 전화번호를 확인하고 카카오맵·네이버지도 길찾기를 이용하세요.</p></div></section><section class="guide-step"><div><h2>화면 설정</h2><p>상단의 화면 보기 설정에서 글자 크기와 고대비 화면을 변경하세요.</p></div></section></div><p class="notice">검토용 버전입니다. 매장 정보는 페이지를 열거나 새로고침할 때 불러옵니다. 오류 제보는 메일 앱에서 전송할 수 있습니다.</p></div>`}
function renderReport(id){
  const s=stores.find(s=>s.id===id);if(!s){renderMissing();return}
  document.title=`${s.name} 오류 제보 — 손끝`;
  main.innerHTML=`<div class="detail-layout">${back(`#store/${s.id}`,'매장 상세로 돌아가기')}<h1 id="page-title">오류 제보 작성</h1><p class="address">${esc(s.name)}</p><div class="detail-box"><p class="small">메일로 제보하기를 누르면 메일 앱이 열립니다. 메일 앱에서 전송을 눌러야 제보가 발송됩니다.</p><p class="small">메일 앱이 열리지 않으면 제보 내용 복사를 눌러 ${REPORT_EMAIL}으로 보내세요.</p><form id="report-form"><div class="form-field"><label class="field-label" for="issue">어떤 정보가 다른가요? (필수)</label><select id="issue" required><option value="">선택해 주세요</option><option>점자메뉴판 비치 여부</option><option>메뉴판 위치 또는 이용 방법</option><option>점자메뉴판 수록 메뉴</option><option>주소·전화번호·길찾기</option><option>기타</option></select></div><div class="form-field"><label class="field-label" for="report-details">자세한 내용 (필수)</label><p id="report-details-example" class="field-example">예: 메뉴판 위치가 카운터 오른쪽으로 변경됨</p><textarea id="report-details" required maxlength="1500" aria-describedby="report-details-example"></textarea></div><div class="form-buttons"><button type="submit" class="primary">메일로 제보하기</button><button id="copy-report" type="button" class="secondary">제보 내용 복사</button></div><p id="report-status" class="confirmation" hidden role="status"></p></form></div></div>`;
  const form=document.querySelector('#report-form'),details=document.querySelector('#report-details'),status=document.querySelector('#report-status');
  const prepare=()=>{details.setCustomValidity(details.value.trim()?'':'자세한 내용을 입력하세요.');if(!form.reportValidity())return null;return reportMessage(s,document.querySelector('#issue').value,details.value)};
  form.addEventListener('input',()=>{details.setCustomValidity(details.value.trim()?'':'자세한 내용을 입력하세요.');status.hidden=true});
  form.addEventListener('submit',e=>{e.preventDefault();const body=prepare();if(body===null)return;status.hidden=false;status.textContent='메일 앱에서 전송을 눌러주세요.';window.location.href=reportMailURL(s,body)});
  document.querySelector('#copy-report').addEventListener('click',async()=>{const body=prepare();if(body===null)return;status.hidden=false;try{await navigator.clipboard.writeText(body);status.textContent='제보 내용을 복사했습니다.'}catch{status.textContent='자동 복사를 할 수 없습니다. 입력한 내용을 직접 복사해 메일로 보내세요.'}});
}
function renderMissing(){document.title='페이지를 찾을 수 없습니다 — 손끝';main.innerHTML=`<div class="empty"><h1 id="page-title">페이지를 찾을 수 없습니다</h1><p>매장 목록에서 다시 선택해 주세요.</p><a class="primary" href="#">매장 목록으로</a></div>`}
function route(initial=false){announce('');const [page,id]=location.hash.slice(1).split('/');document.querySelector('#nav-stores').removeAttribute('aria-current');document.querySelector('#nav-guide').removeAttribute('aria-current');if(page==='store')renderStore(id);else if(page==='report')renderReport(id);else if(page==='guide'){renderGuide();document.querySelector('#nav-guide').setAttribute('aria-current','page')}else if(!page){renderList();document.querySelector('#nav-stores').setAttribute('aria-current','page')}else renderMissing();syncBackBar();if(!initial){if(!page&&lastStore){document.querySelector(`#store-${CSS.escape(lastStore)}`)?.focus();lastStore=null}else{document.querySelector('#page-title')?.setAttribute('tabindex','-1');document.querySelector('#page-title')?.focus();window.scrollTo(0,0)}}}
document.querySelector('#settings').addEventListener('click',()=>{const panel=document.querySelector('#view-settings');panel.hidden=!panel.hidden;document.querySelector('#settings').setAttribute('aria-expanded',!panel.hidden)});
function applySettings(){const size=document.querySelector('#font-size').value;document.documentElement.style.fontSize=`${18*Number(size)/100}px`;document.body.classList.toggle('high-contrast',document.querySelector('#contrast').checked);try{localStorage.setItem('sonkkeut-view',JSON.stringify({size,contrast:document.querySelector('#contrast').checked}))}catch{}}
try{const v=JSON.parse(localStorage.getItem('sonkkeut-view')||'null');if(v){if(['100','125','150'].includes(v.size))document.querySelector('#font-size').value=v.size;document.querySelector('#contrast').checked=!!v.contrast;applySettings()}}catch{}
document.querySelector('#font-size').addEventListener('change',applySettings);document.querySelector('#contrast').addEventListener('change',applySettings);
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();main.focus();});
window.addEventListener('hashchange',()=>route());
async function init(){
  const retrying=document.activeElement?.id==='retry';
  stores=[];
  announce('');
  main.setAttribute('aria-busy','true');
  main.innerHTML='<p>매장 정보 로딩 중</p>';
  announce('매장 정보 로딩 중');
  try{
    const r=await fetch('public-feed.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error();
    const config=await r.json();
    stores=await loadPublishedStores(config.url);
    stores.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    main.removeAttribute('aria-busy');
    route(!retrying);
  }catch{
    main.removeAttribute('aria-busy');
    main.innerHTML='<div class="empty"><h1 id="load-error-title" tabindex="-1" aria-describedby="load-error-help">매장 정보를 불러오지 못했습니다</h1><p id="load-error-help">연결 상태를 확인하고 다시 시도해 주세요.</p><button class="primary" id="retry">다시 시도</button></div>';
    announce('');
    document.querySelector('#load-error-title').focus();
    document.querySelector('#retry').addEventListener('click',init);
  }
}
init();
