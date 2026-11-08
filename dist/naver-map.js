// Keep HTTPS URLs in the sheet. Only construct app URLs from validated coordinates.
export function getNaverMapLinks(store, context = {}) {
  let web;
  try {
    web = new URL(store.naver);
    if (web.protocol !== 'https:' ||
        !['map.naver.com', 'm.map.naver.com'].includes(web.hostname) ||
        web.username || web.password || web.port) throw Error('Invalid map URL');
  } catch {
    return { appUrl: null, webUrl: '#', reason: 'invalid-url' };
  }

  const webUrl = web.href;
  const rawLat = web.searchParams.get('elat');
  const rawLng = web.searchParams.get('elng');
  if (!rawLat?.trim() || !rawLng?.trim()) {
    return { appUrl: null, webUrl, reason: 'missing-coordinates' };
  }
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < 31.43 || lat > 44.35 || lng < 122.37 || lng > 132) {
    return { appUrl: null, webUrl, reason: 'invalid-coordinates' };
  }

  const userAgent = context.userAgent ?? globalThis.navigator?.userAgent ?? '';
  const platform = context.platform ?? globalThis.navigator?.platform ?? '';
  const touches = context.maxTouchPoints ?? globalThis.navigator?.maxTouchPoints ?? 0;
  const android = /Android/i.test(userAgent);
  const ios = /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === 'MacIntel' && touches > 1);
  if (!android && !ios) return { appUrl: null, webUrl, reason: 'desktop' };

  const params = new URLSearchParams({
    dlat: String(lat),
    dlng: String(lng),
    dname: String(store.name || web.searchParams.get('etext') || '도착지'),
    appname: context.pageUrl ?? globalThis.location?.origin ?? 'http://localhost'
  });
  // Omit the starting point so NAVER Maps uses the user's current location.
  // public = public transit. No location permission is requested by this site.
  const route = `route/public?${params.toString()}`;
  const appUrl = android
    ? `intent://${route}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
    : `nmap://${route}`;
  return { appUrl, webUrl, reason: android ? 'android' : 'ios' };
}
