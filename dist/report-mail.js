export const REPORT_EMAIL = 'sonkkeutgp@gmail.com';
export function reportMessage(store, issue, details) {
  if (!issue.trim() || !details.trim()) throw new Error('오류 종류와 자세한 내용이 필요합니다.');
  return `[매장 정보 오류 제보]\r\n매장: ${store.name}\r\n매장 ID: ${store.id}\r\n오류 종류: ${issue}\r\n내용: ${details.trim()}`;
}
export function reportMailURL(store, body) {
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(`[매장 정보 오류 제보] ${store.name}`)}&body=${encodeURIComponent(body)}`;
}
