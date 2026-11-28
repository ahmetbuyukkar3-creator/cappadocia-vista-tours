/* Çerez onayı + Google Analytics (site v4, 28 Kas 2026). Tek dosya, stilini kendi taşır (dil kapısı site.css yüklemez).
   KURAL: ziyaretçi "izin ver" demeden Google'a HİÇBİR istek gitmez, hiçbir çerez yazılmaz.
   Karar ziyaretçinin cihazında durur: localStorage 'cerez' = 'evet' | 'hayir'. Karar yoksa kutu çıkar.
   Alt bölümdeki [data-cerez] linki kutuyu yeniden açar; "istemiyorum" denirse Analytics çerezleri silinir.
   Sitenin kendi olayları (dataLayer.push({ event: ... })) izin varken GA4'e olay olarak aktarılır.
   Sayfaya uret/sayfa_uret.py koyar. GA kimliği (metinler.py GA_KIMLIK) boşken bu dosya sayfaya hiç eklenmez. */
(function () {
  var s = document.currentScript; if (!s) return;
  var GA = s.getAttribute('data-ga') || ''; if (!/^G-[A-Z0-9]+$/.test(GA)) return;
  var M = {}; try { M = JSON.parse(s.getAttribute('data-metin')) || {}; } catch (e) {}
  var dil = s.getAttribute('data-dil') || (navigator.language || '').slice(0, 2).toLowerCase();
  var m = M[dil] || M.en || M[Object.keys(M)[0]]; if (!m) return;

  function oku() { try { return localStorage.getItem('cerez'); } catch (e) { return null; } }
  function sakla(v) { try { localStorage.setItem('cerez', v); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  var acik = false, yuklendi = false;

  function olay(o) {                       // sitenin olayı → GA4 olayı (gtag'in kendi kayıtlarına dokunmaz)
    if (!acik || !o || typeof o.event !== 'string' || o.event.indexOf('gtm.') === 0) return;
    var p = {}, k; for (k in o) if (k !== 'event' && o[k] != null) p[k] = Array.isArray(o[k]) ? o[k].join(',') : o[k];   // GA4 liste almaz: "balon,atv"
    gtag('event', o.event, p);
  }
  var it = dataLayer.push;
  dataLayer.push = function () {
    var r = it.apply(dataLayer, arguments), i;
    for (i = 0; i < arguments.length; i++) olay(arguments[i]);
    return r;
  };

  function baslat() {
    if (acik) return; acik = true;
    if (yuklendi) { gtag('consent', 'update', { analytics_storage: 'granted' }); return; }
    yuklendi = true;
    var bekleyen = dataLayer.slice();      // izinden önce bu sayfada birikmiş olaylar
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    gtag('js', new Date()); gtag('config', GA);
    bekleyen.forEach(olay);
    var j = document.createElement('script'); j.async = true;
    j.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA; document.head.appendChild(j);
  }

  function durdur() {
    if (acik) gtag('consent', 'update', { analytics_storage: 'denied' });
    acik = false;
    var alan = location.hostname.split('.'), adlar = document.cookie.split(';'), i, j, ad;
    for (i = 0; i < adlar.length; i++) {
      ad = adlar[i].split('=')[0].replace(/^\s+/, ''); if (ad.indexOf('_ga') !== 0) continue;
      document.cookie = ad + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      for (j = 0; j < alan.length - 1; j++)
        document.cookie = ad + '=; path=/; domain=.' + alan.slice(j).join('.') + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  var STIL = '#cerez{position:fixed;left:18px;bottom:18px;z-index:90;width:calc(100% - 36px);max-width:400px;padding:18px 20px;background:#fff;color:#1d1a17;' +
    'border:1px solid #e6ddd0;border-radius:18px;box-shadow:0 22px 44px -26px rgba(29,26,23,.55);' +
    "font-family:'Montserrat','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif;font-size:14px;line-height:1.55;font-weight:400}" +
    '#cerez p{margin:0 0 14px}#cerez div{display:flex;gap:8px}#cerez a{color:inherit;text-decoration:underline;text-underline-offset:3px}' +
    '#cerez button{flex:1;min-height:42px;padding:8px 14px;border-radius:999px;border:1.5px solid #1d1a17;background:#fff;color:#1d1a17;' +
    'font-family:inherit;font-size:14px;font-weight:700;line-height:1.2;cursor:pointer;transition:background .2s,color .2s}' +
    '#cerez button:hover{background:#f3ece1}#cerez button[data-k=evet]{background:#1d1a17;color:#fff}#cerez button[data-k=evet]:hover{background:#3a342e}' +
    '#cerez button:focus-visible{outline:2px solid #c8491f;outline-offset:3px}' +
    '@media(max-width:600px){#cerez{left:12px;bottom:12px;width:calc(100% - 24px);max-width:none}#cerez.yz{bottom:80px}}';

  function kapat() { var k = document.getElementById('cerez'); if (k) k.parentNode.removeChild(k); }
  function kutu() {
    if (document.getElementById('cerez')) return;
    if (!document.getElementById('cerez-stil')) {
      var st = document.createElement('style'); st.id = 'cerez-stil'; st.textContent = STIL; document.head.appendChild(st);
    }
    var k = document.createElement('div'); k.id = 'cerez'; k.setAttribute('role', 'region'); k.setAttribute('aria-label', m.ad);
    if (document.getElementById('yaz')) k.className = 'yz';      // dar ekranda sabit WhatsApp düğmesinin üstünde dursun
    var p = document.createElement('p'); p.textContent = m.metin; k.appendChild(p);
    if (m.bag) {                                                 // gizlilik sayfası (sayfa_uret.py cerez_kod)
      var g = document.createElement('a'); g.href = m.bag; g.textContent = m.bag_ad;
      p.appendChild(document.createTextNode(' ')); p.appendChild(g);
    }
    var d = document.createElement('div');
    [['hayir', m.hayir], ['evet', m.evet]].forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-k', x[0]); b.textContent = x[1];
      b.addEventListener('click', function () { sakla(x[0]); kapat(); if (x[0] === 'evet') baslat(); else durdur(); });
      d.appendChild(b);
    });
    k.appendChild(d); document.body.appendChild(k);
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('[data-cerez]') : null;
    if (a) { e.preventDefault(); kutu(); }
  });

  var karar = oku();
  if (karar === 'evet') baslat(); else if (karar !== 'hayir') kutu();
})();
