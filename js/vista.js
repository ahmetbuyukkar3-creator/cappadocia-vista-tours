/* VISTA kodu · Cappadocia Vista Tours
   Siteye tek satırla eklenir:  <script src="../js/vista.js" data-uc="https://VISTA-ADRESI" defer></script>
   Ziyareti VISTA paneline bildirir: hangi dil, nereden geldi, hangi cihaz, filmin neresinde, kaç saniyedir sitede,
   WhatsApp'a tıkladı mı, form gönderdi mi.
   Ayrıca tur bilgilerinin (saat, süre, grup, fiyat) güncel halini VISTA'dan alır ve sayfadaki yazıyı değiştirir:
   Hüseyin Bey panelden bir kez değiştirir, sitenin bütün dillerinde aynı anda görünür.
   Ziyaretçinin cihazında HİÇBİR ŞEY saklamaz (çerez yok, localStorage yok) ve kişisel bilgi göndermez.
   Adres boşsa (data-uc yok) hiçbir şey yapmaz. Hata verirse site etkilenmez. */
(function () {
'use strict';
try {
  var etiket = document.currentScript;
  if (!etiket || !window.JSON) return;
  var yerelde = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var taban = (yerelde && etiket.getAttribute('data-yerel')) || etiket.getAttribute('data-uc') || '';
  taban = taban.replace(/\/+$/, '');
  if (!taban) return;
  var UC = taban + '/api/vista/z';

  // sayfa kimliği: yalnız bu sayfa açıkken bellekte durur
  var kimlik = '', harf = 'abcdefghijklmnopqrstuvwxyz0123456789', i;
  for (i = 0; i < 16; i++) kimlik += harf.charAt(Math.floor(Math.random() * harf.length));
  window.vista = { id: kimlik, uc: taban };

  var DIL = (document.body && document.body.getAttribute('data-dil')) || 'kapi';
  var SAYFA = (document.body && document.body.getAttribute('data-sayfa')) || '';   // alt sayfa (ör. tur-balon); ana sayfada boş
  var V = {};
  try { V = JSON.parse(document.getElementById('veri').textContent); } catch (e) {}
  var F = V.film || null, TOP = F ? (F.kare - 1 + (V.kuyruk || 0)) : 0;
  var filmEl = document.getElementById('ust');
  // sitenin durakları, yukarıdan aşağı (sunucudaki DURAK listesiyle aynı sıra)
  var SAHNE_DURAK = [0, 1, 2, 3, 3, 4];                    // film sahnesi → durak (4. sahne kapı geçişi: at turuna sayılır)
  var BOLUM = ['turlar', 'galeri', 'biz', 'otel', 'iletisim'];   // durak 5..9

  var aktif = 0, sonAn = Date.now(), gorunur = !document.hidden;
  var enFilm = 0, durak = 0, enDurak = 0, wa = 0, form = 0;

  function konum() { return window.pageYOffset || document.documentElement.scrollTop || 0; }
  function olc() {
    var y = konum(), h = window.innerHeight, pay, kare, k, e, yuzde;
    durak = 0;
    if (F && filmEl) {
      pay = Math.max(1, filmEl.offsetHeight - h);
      kare = Math.min(F.kare - 1, Math.max(0, y / pay) * TOP);
      yuzde = Math.round(kare / (F.kare - 1) * 100);
      if (yuzde > enFilm) enFilm = yuzde;
      for (k = 0; k < F.sahne.length; k++) if (kare >= F.sahne[k] - 20) durak = SAHNE_DURAK[k] || 0;
    }
    for (k = 0; k < BOLUM.length; k++) {
      e = document.getElementById(BOLUM[k]);
      if (e && e.getBoundingClientRect().top < h * 0.55) durak = 5 + k;
    }
    if (durak > enDurak) enDurak = durak;
  }
  function say() {                                          // yalnız sekme görünürken geçen süre sayılır
    var s = Date.now();
    if (gorunur) aktif += s - sonAn;
    sonAn = s;
  }
  function kaynak() {                                       // adresteki işaret: ?k=instagram, utm_source, reklam tıklaması
    var m = /[?&](?:k|utm_source)=([^&#]{1,40})/.exec(location.search);
    if (m) { try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
    if (/[?&]gclid=/.test(location.search)) return 'gclid';
    return '';
  }
  function yonlendiren() {
    var r = document.referrer || '', a;
    if (!r) return '';
    a = document.createElement('a'); a.href = r;
    return a.host === location.host ? '=' : a.hostname;     // yalnız sitenin adı gider, tam adres gitmez
  }
  function cihaz() {
    var kaba = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    var kisa = Math.min(screen.width || 0, screen.height || 0);
    return !kaba ? 'pc' : (kisa >= 600 ? 'tab' : 'tel');
  }
  function gonder(tip, ek) {
    var v = { i: kimlik, t: tip, d: DIL, f: enFilm, y: durak, dr: enDurak, s: Math.round(aktif / 1000), wa: wa, fm: form }, k, govde;
    if (tip === 'g') {
      v.r = yonlendiren(); v.k = kaynak(); v.c = cihaz();
      if (SAYFA) v.sf = SAYFA;
      try { v.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { v.tz = ''; }
      k = /[?&]utm_campaign=([^&#]{1,60})/.exec(location.search);
      if (k) v.ka = k[1];
    }
    if (ek) for (k in ek) if (ek.hasOwnProperty(k)) v[k] = ek[k];
    govde = JSON.stringify(v);
    try { if (navigator.sendBeacon && navigator.sendBeacon(UC, govde)) return; } catch (e) {}
    try { fetch(UC, { method: 'POST', body: govde, keepalive: true, mode: 'cors', credentials: 'omit' }).then(function () {}, function () {}); } catch (e) {}
  }
  function nabiz(tip) { say(); olc(); gonder(tip || 'n'); }

  // giriş
  olc(); gonder('g');

  // tur bilgileri (saat, süre, grup, fiyat): sayfadaki değerler sayfanın üretildiği andaki değerlerdir, güncel olanı VISTA'dan gelir.
  // Biçim kuralı sunucudaki vista_tur.py → bicim() ile AYNIDIR: birini değiştiren diğerini de değiştirir.
  var SIMGE = { EUR: '€', USD: '$', TRY: '₺' };
  function tbYaz(alan, t, para) {
    var tb = V.tb, s, v = [], k, saatli, b;
    if (alan === 'saat') return (t.saat || []).join(' · ');
    if (alan === 'sure') {
      s = t.sure || [];
      if (!s.length) return '';
      saatli = s.length > 1 || s[0] >= 120;                 // 60 → "60 dk", 120 → "2 saat"
      for (k = 0; k < s.length; k++) if (s[k] % 60) saatli = false;
      for (k = 0; k < s.length; k++) v.push(saatli ? s[k] / 60 : s[k]);
      return (saatli ? tb.sa : tb.dk).replace('{v}', v.join(tb.ya));
    }
    if (alan === 'kisi') return t.kisi ? tb.kisi.replace('{v}', String(t.kisi)) : '';
    if (alan === 'fiyat') {
      if (!t.fiyat) return '';
      b = tb['b_' + (t.birim || '')] || '';
      return tb.fiyat.replace('{v}', String(t.fiyat)).replace('{s}', SIMGE[para] || para) + (b ? ' · ' + b : '');
    }
    return '';
  }
  function tbUygula(d) {
    var e = document.querySelectorAll('[data-tb]'), k, p, t, y, b;
    if (!d || !d.turlar || !V.tb) return;
    for (k = 0; k < e.length; k++) {
      p = e[k].getAttribute('data-tb').split('.'); t = d.turlar[p[0]];
      if (!t) continue;
      y = tbYaz(p[1], t, d.para) || e[k].getAttribute('data-yedek') || '';     // değer boşsa yedek yazı, o da yoksa satır gizlenir
      b = e[k].querySelector('b');
      if (b && y && b.textContent !== y) b.textContent = y;
      if (y) e[k].removeAttribute('hidden'); else e[k].setAttribute('hidden', '');
    }
  }
  if (window.fetch && document.querySelector('[data-tb]')) {
    try {
      fetch(taban + '/api/vista/tur', { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { try { tbUygula(d); } catch (e) {} }, function () {});
    } catch (e) {}
  }
  // nabız: sekme görünürken 10 saniyede bir
  setInterval(function () { if (gorunur) nabiz(); }, 10000);
  // konum değişince ara nabız (en çok 3 saniyede bir): panel "filmin neresinde"yi gecikmesiz görsün
  var bekleyen = null, sonDurak = 0;
  window.addEventListener('scroll', function () {
    if (bekleyen) return;
    bekleyen = setTimeout(function () { bekleyen = null; olc(); if (durak !== sonDurak) { sonDurak = durak; nabiz(); } }, 3000);
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    say(); gorunur = !document.hidden; sonAn = Date.now();
    olc(); gonder(gorunur ? 'n' : 'k');                     // sekme gizlendi: "sitede değil"; geri gelince yeniden canlı
  });
  window.addEventListener('pagehide', function () { say(); olc(); gonder('k'); });

  // sitenin kendi olayları (WhatsApp tıklaması, form, tur sorma, galeri): veri katmanından dinlenir
  var katman = window.dataLayer = window.dataLayer || [], it = katman.push;
  katman.push = function (o) {
    try {
      if (o && o.event) {
        if (o.event === 'whatsapp_tik') wa = 1;
        if (o.event === 'form_gonder') { form = 1; wa = 1; }  // form WhatsApp'ı açar
        if (o.event !== 'dil_sayfasi') { say(); olc(); gonder('o', { o: o.event, ov: o.yer || o.dil || '' }); }
      }
    } catch (e) {}
    return it.apply(katman, arguments);
  };
} catch (e) {}
})();
