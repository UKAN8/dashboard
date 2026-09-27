/* 수학은유강 방문 기록 — https://ukan8.github.io/dashboard/track.js  (0928)
 *
 * 페이지에 한 줄:  <script src="/dashboard/track.js" data-page="me" defer></script>
 *   data-page: me(포털) · eval(자평) · set(학습루프) · survey · step · lib(자료실)
 *
 * 두 갈래로 센다.
 *  ① GoatCounter(ukan8.goatcounter.com) — 페이지별 방문 수만. 토큰(?t=)·루프 난수(-9c394bcf)·
 *     학생 이름(루프 <title>)은 **절대 밖으로 안 나간다**: path·title·referrer 를 전부 여기서 깎아 보낸다.
 *  ② DB page_visit (RPC visit_log, schema_v29) — 학생별·학생/학부모별.
 *     누구인지는 서버가 토큰(portal_token)·루프ID(loop_status)로 판정한다. 브라우저가 학생ID를 주장하지 않는다.
 *
 * 학생/학부모: 팀톡에 링크 하나를 둘이 같이 쓴다(학부모 토큰 폐기, 0902). 그래서 포털(me)에서
 *   기기마다 한 번 "이 기기로 보시는 분은?" 을 묻고 localStorage mt_who 에 둔다. 안 고르면 '미확인'.
 *
 * 실패는 전부 삼킨다 — 기록 때문에 학습 화면이 깨지면 안 된다. 로컬 미리보기(file:, localhost)는 안 센다.
 */
(function () {
  try {
    if (location.protocol === 'file:' || /^(localhost|127\.)/.test(location.hostname)) return;
    var S = document.currentScript || document.querySelector('script[src*="track.js"]');
    var PAGE = (S && S.getAttribute('data-page')) || 'etc';
    var SB = 'https://bkgerndnwukvuuqdgnxt.supabase.co';
    var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZ2VybmRud3VrdnV1cWRnbnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjA3MzgsImV4cCI6MjEwMTgzNjczOH0.VcfcTc9QkecKWFPUiYVXKGEXLxmVp8ugfiF6EV5_kjk';
    var TITLE = { me: '포털', eval: '자기평가', set: '학습루프', survey: '설문', step: '단계 해설', lib: '자료실' };
    var HASH = /-[0-9a-f]{8}(\.html)?$/;

    function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
    function clean(p) { return (p || '/').replace(/\/index\.html$/, '/').replace(HASH, ''); }

    var dev = ls('mt_dev');
    if (!dev) { dev = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 16); ls('mt_dev', dev); }

    var q = new URLSearchParams(location.search);
    var tok = q.get('t') || '';
    var lid = '';
    if (PAGE === 'set') { var m = location.pathname.match(/([^\/]+)\.html$/); lid = m ? decodeURIComponent(m[1]) : ''; }
    var detail = PAGE === 'set' ? lid.replace(HASH, '') : PAGE === 'eval' ? (q.get('d') || '') : PAGE === 'survey' ? (q.get('s') || '') : '';

    /* ① GoatCounter */
    window.goatcounter = {
      path: function () { return clean(location.pathname); },
      title: function () { return TITLE[PAGE] || PAGE; },
      referrer: function (r) {
        try { if (!r) return ''; var u = new URL(r); return u.host === location.host ? u.origin + clean(u.pathname) : u.origin; }
        catch (e) { return ''; }
      }
    };
    var g = document.createElement('script');
    g.async = true; g.src = '//gc.zgo.at/count.js';
    g.setAttribute('data-goatcounter', 'https://ukan8.goatcounter.com/count');
    (document.head || document.documentElement).appendChild(g);

    /* ② DB */
    function rpc(fn, body) {
      try {
        fetch(SB + '/rest/v1/rpc/' + fn, {
          method: 'POST', keepalive: true,
          headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).catch(function () {});
      } catch (e) {}
    }
    var ua = navigator.userAgent || '';
    var br = /KAKAOTALK/i.test(ua) ? 'kakao' : /NAVER\(inapp/i.test(ua) ? 'naver' : /SamsungBrowser/i.test(ua) ? 'samsung'
           : /CriOS|Chrome/i.test(ua) ? 'chrome' : /Safari/i.test(ua) ? 'safari' : 'etc';
    br += /Mobi|Android|iPhone|iPad/i.test(ua) ? '/m' : '/pc';
    function log(page, det) {
      rpc('visit_log', { p_page: page, p_detail: String(det || '').slice(0, 120), p_tok: tok, p_lid: lid,
                         p_who: ls('mt_who') || '', p_dev: dev, p_ua: br });
    }
    log(PAGE, detail);

    /* 자료실: PDF·영상 클릭 */
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return;
        var h = a.href, kind = /mathis-lib\/.*\.pdf/i.test(h) ? 'lib-pdf' : /youtu\.?be/i.test(h) ? 'lib-video' : '';
        if (!kind) return;
        var name = kind === 'lib-pdf' ? decodeURIComponent(h.split('?')[0].split('/').pop())
                                      : ((a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'video');
        if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: '/' + kind + '/' + name, title: kind, event: true });
        log(kind, name);
      } catch (_) {}
    }, true);

    /* 학생/학부모 묻기 — 포털에서, 토큰이 있을 때, 기기당 한 번 (✕ 는 7일 뒤 다시) */
    var skip = +(ls('mt_who_skip') || 0);
    if (PAGE === 'me' && tok && !ls('mt_who') && Date.now() - skip > 7 * 864e5) {
      var show = function () {
        var d = document.createElement('div');
        d.id = 'mt-who';
        d.setAttribute('style', 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;' +
          'max-width:420px;margin:0 auto;background:#fff;color:#222;border:1px solid #ddd;border-radius:14px;' +
          'box-shadow:0 6px 24px rgba(0,0,0,.15);padding:12px 14px;font:14px/1.4 inherit;display:flex;gap:8px;align-items:center;flex-wrap:wrap');
        var b = 'style="border:1px solid #ccc;background:#f6f6f6;color:#222;border-radius:10px;padding:7px 12px;font:inherit;cursor:pointer"';
        d.innerHTML = '<span style="flex:1 1 100%">이 기기로 보시는 분은 누구인가요?</span>' +
          '<button data-w="학생" ' + b + '>학생 본인</button><button data-w="학부모" ' + b + '>학부모님</button>' +
          '<button data-w="" aria-label="닫기" style="margin-left:auto;border:0;background:none;color:#999;font:inherit;cursor:pointer">✕</button>';
        d.addEventListener('click', function (e) {
          var w = e.target && e.target.getAttribute && e.target.getAttribute('data-w');
          if (w === null || w === undefined) return;
          if (w) { ls('mt_who', w); rpc('visit_who', { p_dev: dev, p_who: w }); } else ls('mt_who_skip', String(Date.now()));
          d.remove();
        });
        document.body.appendChild(d);
      };
      var later = function () { setTimeout(show, 1500); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', later); else later();
    }
  } catch (e) {}
})();
