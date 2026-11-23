/* (1123) 포털 서비스워커 — 안드로이드 '앱 설치' 조건을 맞추려는 것뿐. 아무것도 저장(캐시)하지 않는다:
 * 포털은 늘 최신 데이터를 봐야 하고, 캐시가 남으면 배포해도 옛 화면이 뜨는 사고가 난다.
 * 하는 일 = 페이지 열기가 인터넷 끊김으로 실패하면 안내 한 줄 보여 주기. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(function(){
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#0a0a0f;color:#f5f5fa;font:16px/1.6 sans-serif;padding:64px 24px;text-align:center"><b>인터넷 연결이 없어요</b><br><span style="color:#8a8a98;font-size:14px">연결을 확인한 뒤 다시 열어 주세요.</span></body>',
      {headers: {'Content-Type': 'text/html; charset=utf-8'}});
  }));
});
