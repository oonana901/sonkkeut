const HEADERS = ['매장 ID','매장명','주소','전화번호','점자메뉴판 이용 방법','제공 메뉴 범위','카카오맵 길찾기 URL','네이버지도 길찾기 URL','층수','진입로 턱','진입로 계단','경사로','엘리베이터','한 줄 소개','매장 특징','목록용 지역'];
export function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false, afterQuote = false;
  const put = () => { row.push(field); field = ''; afterQuote = false; };
  const line = () => { put(); if (row.some(v => v.trim())) rows.push(row); row = []; };
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; afterQuote = true; }
      else field += c;
    } else if (c === ',' ) put();
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i+1] === '\n') i++; line(); }
    else if (c === '"' && !field && !afterQuote) quoted = true;
    else { if (afterQuote || c === '"') throw Error('Invalid CSV'); field += c; }
  }
  if (quoted) throw Error('Unclosed CSV field');
  if (field || row.length || afterQuote) line();
  return rows;
}
export function storesFromCSV(text) {
  const [header, ...rows] = parseCSV(text);
  if (!header || HEADERS.some((h,i) => header[i]?.trim() !== h) || header.length !== HEADERS.length) throw Error('Unexpected sheet headers');
  const seen = new Set();
  return rows.map(row => {
    if (row.length !== HEADERS.length) throw Error('Unexpected sheet row');
    const v = row.map(value => value.trim());
    const [id,name,address,phone,usage,scope,kakao,naver,floor,threshold,stairs,ramp,elevator,intro,features,area] = v;
    if (!/^[A-Za-z0-9_-]+$/.test(id) || !name || !address || seen.has(id)) throw Error('Invalid store');
    seen.add(id);
    const parts = [];
    if (threshold === '있음') parts.push('턱');
    if (stairs === '있음') parts.push('계단');
    if (ramp === '있음') parts.push('경사로');
    const entry = parts.length ? (id === 'store_007' ? '건물 진입로에 ' : '진입로 ') + parts.join('·') + ' 있음' : (threshold === '없음' && stairs === '없음' ? '진입로 턱·계단 없음' : '진입로 정보 미확인');
    return {id,name,address,phone,usage,scope,kakao,naver,floor,threshold,stairs,ramp,elevator,intro: intro === '미확인' ? '' : intro,features: features === '미확인' ? [] : features.split(/\s*\/\s*/).filter(Boolean),area,status:'비치 중',entry};
  });
}
export async function loadPublishedStores(url) {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'docs.google.com' || !endpoint.pathname.startsWith('/spreadsheets/d/e/') || !endpoint.pathname.endsWith('/pub') || endpoint.searchParams.get('output') !== 'csv') throw Error('Invalid published sheet URL');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint.href, {cache:'no-store', credentials:'omit', signal:controller.signal});
    if (!response.ok) throw Error('Sheet unavailable');
    const text = await response.text();
    if (text.length > 2000000) throw Error('Sheet too large');
    return storesFromCSV(text);
  } finally { clearTimeout(timer); }
}
