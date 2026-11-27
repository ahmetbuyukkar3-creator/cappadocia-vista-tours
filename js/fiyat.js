/* Fiyatlar · Cappadocia Vista Tours (27 Kas 2026)
   Sayfaya fiyat GÖMÜLMEZ; fiyat yerleri ([data-fiyat="hizmet"]) boş ve gizli gelir, bu betik doldurur. Böylece eski bir
   rakam hiçbir zaman görünmez: rakam o an okunamıyorsa fiyat yeri gizli kalır (yanlış fiyat göstermektense hiç göstermeyiz).
   İki şey okur:
     1) sitenin kökündeki fiyat.json: hangi hizmetin fiyatı nereden gelir (panel yazar: ../vista_fiyat.py → site_verisi)
          {"k": "t26"}  → kardeş sitedeki (travel-cappadocia.com) o ürünün fiyatı, o an oradan okunur
          {"f": 60}     → Hüseyin Bey'in panelden yazdığı rakam
          listede yoksa → o hizmette fiyat görünmez
     2) kardeş sitenin herkese açık ürün listesi (fiyat.json içindeki "kaynak" adresi). 10 dakikada bir yeniden okunur;
        arada yalnız bu sekmenin oturum belleğinde durur (kişisel bilgi değil, herkese açık fiyat listesi).
   Yazılış o dilin sözleriyle (sayfadaki "veri" → tb): "49 €'dan başlayan" / "from €49" / "desde 49 €" / "€49起".
   DİKKAT: cozumle() sunucudaki vista_fiyat.py → cozumle() ile AYNI kuraldır: birini değiştiren diğerini de değiştirir.
   Hata verirse site etkilenmez. */
(function () {
'use strict';
try {
  var etiket = document.currentScript;
  var SIMGE = { EUR: '€', USD: '$', TRY: '₺' };
  var OMUR = 10 * 60 * 1000, EN_AZ_URUN = 10, BELLEK = 'vista-fiyat-1';

  // Kardeş sitenin ürün listesi → { t26: 49, t27: 75, t60: null, ... }. Fiyat yalnız "49 €" ya da "12.5 €" biçimindeyse alınır.
  function cozumle(metin) {
    var urun = {}, blok = String(metin || '').replace(/\r\n/g, '\n').split('\n### '), k, u, f, n;
    for (k = 1; k < blok.length; k++) {
      u = /^- URL: \[\S*?-(t[0-9]{1,9})\]/m.exec(blok[k]);
      if (!u) continue;
      f = /^- Price:[ \t]*([0-9]{1,6}(?:\.[0-9]{1,2})?)[ \t]*€[ \t]*$/m.exec(blok[k]);
      n = f ? parseFloat(f[1]) : null;
      if (n !== null && !(n > 0 && n <= 100000)) n = null;
      urun[u[1]] = n;
    }
    return urun;
  }
  function fiyatli(urun) { var n = 0, k; for (k in urun) if (urun.hasOwnProperty(k) && urun[k]) n++; return n; }
  window.vistaFiyat = { cozumle: cozumle };      // denemeler iki tarafın aynı sonucu verdiğini buradan ölçer

  var yerler = document.querySelectorAll('[data-fiyat]');
  if (!etiket || !yerler.length || !window.fetch || !window.JSON) return;
  var V = {};
  try { V = JSON.parse(document.getElementById('veri').textContent); } catch (e) {}
  var tb = V.tb;
  if (!tb || !tb.fiyat) return;
  var kok = etiket.src.replace(/js\/fiyat\.js.*$/, '');

  function rakam(n) { return n % 1 === 0 ? String(n) : n.toFixed(2).replace('.', tb.ond || '.'); }
  function yaz(el, n, para, h) {
    var ana = document.createElement('span'), b = document.createElement('b'), s;
    var kalip = (h.den && tb.den ? tb.den : '{f}').split('{f}'), birim = tb['b_' + (h.b || '')];
    el.textContent = '';
    ana.className = 'f-ana';
    b.textContent = tb.fiyat.replace('{v}', rakam(n)).replace('{s}', SIMGE[para] || para);
    if (kalip[0]) ana.appendChild(document.createTextNode(kalip[0]));
    ana.appendChild(b);
    if (kalip[1]) ana.appendChild(document.createTextNode(kalip[1]));
    el.appendChild(ana);
    if (birim) { s = document.createElement('small'); s.textContent = birim; el.appendChild(s); }
    el.removeAttribute('hidden');
  }
  function gecerli(n) { return typeof n === 'number' && n > 0 && n <= 100000; }
  function uygula(A, urun) {      // urun yoksa yalnız Hüseyin Bey'in kendi rakamları yazılır
    var k, kod, h, n;
    for (k = 0; k < yerler.length; k++) {
      kod = yerler[k].getAttribute('data-fiyat'); h = A.h[kod];
      if (!h) continue;
      if (gecerli(h.f)) yaz(yerler[k], h.f, A.para, h);
      else if (urun && h.k) { n = urun[h.k]; if (gecerli(n)) yaz(yerler[k], n, A.kaynak_para, h); }
    }
  }
  function bellekten() {
    try {
      var d = JSON.parse(sessionStorage.getItem(BELLEK));
      if (d && d.u && Date.now() - d.t >= 0 && Date.now() - d.t < OMUR) return d.u;
    } catch (e) {}
    return null;
  }
  function liste(A) {
    var u = bellekten();
    if (u) return uygula(A, u);
    if (!/^https:\/\//.test(A.kaynak || '')) return;
    fetch(A.kaynak, { credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (metin) {
        var urun = cozumle(metin);
        if (fiyatli(urun) < EN_AZ_URUN) return;             // liste beklenen biçimde değil: fiyat gösterilmez
        try { sessionStorage.setItem(BELLEK, JSON.stringify({ t: Date.now(), u: urun })); } catch (e) {}
        uygula(A, urun);
      }, function () {});
  }

  fetch(kok + 'fiyat.json', { credentials: 'omit', cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (A) {
      var kod, uzak = false;
      if (!A || !A.h || typeof A.h !== 'object') return;
      try {
        uygula(A, null);
        for (kod in A.h) if (A.h.hasOwnProperty(kod) && A.h[kod] && A.h[kod].k && !gecerli(A.h[kod].f)) uzak = true;
        if (uzak) liste(A);
      } catch (e) {}
    }, function () {});
} catch (e) {}
})();
