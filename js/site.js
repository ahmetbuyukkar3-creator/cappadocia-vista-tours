/* Cappadocia Vista Tours · site v4 (27 Kas 2026)
   Kaydırma filmi yok. Hareket yalnız giriş videosu alanında: video oynar, yazılar sahneye göre değişir.
   Sıra: ölçüm · üst çubuk ve menüler · giriş videosu · yana kayan şeritler · tur süzgeci · görünürken giriş ·
   galeri ve büyütme · iletişim formu · tur sayfasındaki küçük rezervasyon kutusu.
   Her parça kendi içinde korunur: biri hata verirse diğerleri çalışmaya devam eder. */
(function () {
'use strict';

var kok = document.documentElement;
function el(id) { return document.getElementById(id); }
function hepsi(s, k) { return [].slice.call((k || document).querySelectorAll(s)); }
function dene(ad, f) { try { f(); } catch (e) { try { console.error(ad, e); } catch (x) {} } }
function durdur(o) { o.preventDefault(); }

var V = {};
try { V = JSON.parse(el('veri').textContent); } catch (e) {}
var DIL = V.dil || document.body.getAttribute('data-dil') || 'en';
var az = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- ölçüm ---------- */
window.dataLayer = window.dataLayer || [];
try { localStorage.setItem('dil', DIL); } catch (e) {}
dataLayer.push({ event: 'dil_sayfasi', dil: DIL });
dene('olcum', function () {
  hepsi('a.wa').forEach(function (a) { a.addEventListener('click', function () {
    dataLayer.push({ event: 'whatsapp_tik', dil: DIL, yer: a.getAttribute('data-olay') }); }); });
  hepsi('a[data-olay="instagram"]').forEach(function (a) { a.addEventListener('click', function () {
    dataLayer.push({ event: 'instagram_tik', dil: DIL }); }); });
});

/* ---------- üst çubuk, açılır listeler, telefon menüsü ---------- */
var menuKapa = null;
dene('ust', function () {
  var bar = el('bar'), yaz = el('yaz'), iletisim = el('iletisim'), bekle = false;
  function bak() {
    bekle = false;
    var y = window.pageYOffset || kok.scrollTop || 0, r;
    if (bar) bar.classList.toggle('kaydi', y > 6);
    if (yaz && iletisim) {                              // iletişim bölümünde zaten büyük WhatsApp düğmesi var
      r = iletisim.getBoundingClientRect();
      yaz.classList.toggle('gizli', r.top < window.innerHeight * 0.7 && r.bottom > 80);
    }
  }
  window.addEventListener('scroll', function () { if (!bekle) { bekle = true; (window.requestAnimationFrame || setTimeout)(bak); } }, { passive: true });
  bak();

  var acilirlar = hepsi('.acilir');
  function kapat(haric) { acilirlar.forEach(function (a) {
    if (a !== haric) { a.classList.remove('acik'); a.querySelector('button').setAttribute('aria-expanded', 'false'); } }); }
  acilirlar.forEach(function (a) {
    var d = a.querySelector('button');
    d.addEventListener('click', function (o) {
      o.stopPropagation();
      var acik = !a.classList.contains('acik');
      kapat(a); a.classList.toggle('acik', acik); d.setAttribute('aria-expanded', acik ? 'true' : 'false');
    });
    hepsi('a', a).forEach(function (b) { b.addEventListener('click', function () { kapat(); }); });
  });
  document.addEventListener('click', function () { kapat(); });
  document.addEventListener('keydown', function (o) { if (o.key === 'Escape' || o.keyCode === 27) { kapat(); if (menuKapa) menuKapa(); } });

  var menu = el('menu'), ac = el('menuAc'), kapa = el('menuKapat');
  if (!menu || !ac) return;
  function durum(acik) {
    ac.setAttribute('aria-expanded', acik ? 'true' : 'false');
    document.body.style.overflow = acik ? 'hidden' : '';
    if (acik) { menu.hidden = false; setTimeout(function () { menu.className = 'cekmece acik'; }, 20); }
    else { menu.className = 'cekmece'; setTimeout(function () { menu.hidden = true; }, 260); }
  }
  ac.addEventListener('click', function () { durum(true); });
  if (kapa) kapa.addEventListener('click', function () { durum(false); });
  hepsi('a', menu).forEach(function (a) { a.addEventListener('click', function () { durum(false); }); });
  menuKapa = function () { if (!menu.hidden) durum(false); };
});

/* ---------- giriş videosu: sahneye göre yazı, sekmeler, ilerleme çizgisi ---------- */
dene('giris', function () {
  var v = el('gVideo'), cerceve = el('gCerceve');
  if (!v || !cerceve) return;
  var anlar = V.giris || [0], yazilar = hepsi('.g-yazi', cerceve), sekmeler = hepsi('#gSekme button'), dur = el('gDur');
  var cizgiler = sekmeler.map(function (s) { return s.querySelector('u'); });
  var aktif = 0, elle = false, gorunur = true, bozuk = false, donen = null, cizim = false;
  var cince = DIL === 'zh' || DIL === 'ja';

  // başlıklar kelime kelime (Çincede harf harf) yükselsin diye parçalanır
  hepsi('.g-h', cerceve).forEach(function (h) {
    var n = 0, yazi = h.textContent, parcalar = cince ? yazi.split('') : yazi.split(/(\s+)/);
    h.setAttribute('aria-label', yazi);
    h.textContent = '';
    parcalar.forEach(function (p) {
      if (!p) return;
      if (/^\s+$/.test(p)) { h.appendChild(document.createTextNode(' ')); return; }
      var k = document.createElement('span'), i = document.createElement('i');
      k.className = 'k'; k.setAttribute('aria-hidden', 'true'); i.textContent = p; i.style.setProperty('--k', n++);
      k.appendChild(i); h.appendChild(k);
    });
  });

  function goster(i) {
    if (i === aktif) return;
    aktif = i;
    yazilar.forEach(function (y, j) {
      y.classList.toggle('secili', j === i);
      if (j === i) y.removeAttribute('aria-hidden'); else y.setAttribute('aria-hidden', 'true');
    });
    sekmeler.forEach(function (s, j) { s.classList.toggle('secili', j === i); });
  }
  function sahne(t) { var i = 0, k; for (k = 0; k < anlar.length; k++) if (t >= anlar[k] - 0.05) i = k; return i; }
  function cizgi(i, oran) {
    cizgiler.forEach(function (c, j) { if (c) c.style.width = (j < i ? 100 : j > i ? 0 : Math.round(oran * 1000) / 10) + '%'; });
  }
  function ciz() {
    cizim = false;
    if (bozuk) return;
    var t = v.currentTime || 0, i = sahne(t), bas = anlar[i], son = anlar[i + 1] || v.duration || bas + 7;
    goster(i);
    cizgi(i, Math.max(0, Math.min(1, (t - bas) / Math.max(0.1, son - bas))));
    if (!v.paused) iste();
  }
  function iste() { if (!cizim) { cizim = true; (window.requestAnimationFrame || setTimeout)(ciz); } }
  function dugme() {
    if (!dur) return;
    var durdu = bozuk ? !donen : v.paused;
    dur.classList.toggle('durdu', durdu);
    dur.setAttribute('aria-label', dur.getAttribute(durdu ? 'data-oynat' : 'data-dur'));
  }
  function oynat() { var s = v.play(); if (s && s.then) s.then(dugme, dugme); }

  // video açılamazsa (çok eski cihaz, kopuk bağlantı): kapak fotoğrafı kalır, yazılar kendi kendine döner
  function don(ac) {
    clearInterval(donen); donen = null;
    if (ac) donen = setInterval(function () { var i = (aktif + 1) % yazilar.length; goster(i); cizgi(i, 1); }, 5200);
    dugme();
  }
  v.addEventListener('error', function () { if (!bozuk) { bozuk = true; if (!az) don(true); } });

  v.addEventListener('play', function () { dugme(); iste(); });
  v.addEventListener('pause', dugme);
  v.addEventListener('timeupdate', iste);
  v.addEventListener('seeked', iste);

  sekmeler.forEach(function (s, i) { s.addEventListener('click', function () {
    dataLayer.push({ event: 'giris_sahne', dil: DIL, yer: 'sahne-' + (i + 1) });
    if (bozuk) { goster(i); cizgi(i, 1); return; }
    try { v.currentTime = anlar[i] + 0.06; } catch (e) {}
    goster(i); cizgi(i, 0);
    if (v.paused && !elle) oynat();
  }); });
  if (dur) dur.addEventListener('click', function () {
    if (bozuk) { don(!donen); return; }
    if (v.paused) { elle = false; oynat(); } else { elle = true; v.pause(); }
  });

  var dar = window.innerWidth < 700 || !!(navigator.connection && navigator.connection.saveData);
  v.src = v.getAttribute(dar ? 'data-dar' : 'data-genis');
  if (az) { elle = true; dugme(); } else oynat();

  // alan ekranda değilken ve sekme gizliyken video durur (pil ve veri harcamasın)
  if ('IntersectionObserver' in window) new IntersectionObserver(function (k) {
    gorunur = k[0].isIntersecting;
    if (bozuk) return;
    if (!gorunur && !v.paused) v.pause(); else if (gorunur && v.paused && !elle) oynat();
  }, { threshold: 0.2 }).observe(cerceve);
  document.addEventListener('visibilitychange', function () {
    if (bozuk) return;
    if (document.hidden) { if (!v.paused) v.pause(); } else if (gorunur && !elle) oynat();
  });
});

/* ---------- yana kayan şeritler: ok bir sayfa (3-4 kart) birden kaydırır ---------- */
dene('serit', function () {
  hepsi('.serit').forEach(function (s) {
    var oklar = hepsi('[data-kay="' + s.id + '"]'), bekle = false;
    if (!oklar.length) return;
    function bak() {
      bekle = false;
      var son = s.scrollWidth - s.clientWidth - 4;
      oklar.forEach(function (o) { o.disabled = +o.getAttribute('data-yon') < 0 ? s.scrollLeft < 4 : s.scrollLeft > son; });
    }
    oklar.forEach(function (o) { o.addEventListener('click', function () {
      var kart = s.firstElementChild, bosluk = parseFloat(getComputedStyle(s).columnGap) || 0;
      var adim = kart ? kart.getBoundingClientRect().width + bosluk : s.clientWidth;
      var sayi = Math.max(1, Math.round(s.clientWidth / adim));           // ekranda kaç kart varsa o kadar kayar
      var x = s.scrollLeft + (+o.getAttribute('data-yon')) * adim * sayi;
      if (s.scrollTo && !az) s.scrollTo({ left: x, behavior: 'smooth' }); else s.scrollLeft = x;
    }); });
    s.addEventListener('scroll', function () { if (!bekle) { bekle = true; setTimeout(bak, 80); } }, { passive: true });
    window.addEventListener('resize', bak);
    bak();
  });
});

/* ---------- tur ızgarası: kategori süzgeci ---------- */
var turSuz = null;
dene('turlar', function () {
  var izgara = el('turIzgara'), suz = el('turSuz');
  if (!izgara || !suz) return;
  var kartlar = hepsi('.tk', izgara), dugmeler = hepsi('button', suz), secili = 'hepsi';
  turSuz = function (g, sessiz) {
    if (!dugmeler.some(function (d) { return d.getAttribute('data-grup') === g; })) g = 'hepsi';
    if (g === secili) return;
    secili = g;
    dugmeler.forEach(function (d) {
      var s = d.getAttribute('data-grup') === g;
      d.className = s ? 'secili' : ''; d.setAttribute('aria-pressed', s ? 'true' : 'false');
      if (s && d.scrollIntoView && suz.scrollWidth > suz.clientWidth) suz.scrollLeft = d.offsetLeft - 16;
    });
    kartlar.forEach(function (k) {
      k.hidden = g !== 'hepsi' && k.getAttribute('data-g') !== g;
      k.classList.add('gir');
    });
    if (!sessiz) dataLayer.push({ event: 'tur_suzgec', dil: DIL, yer: g });
  };
  dugmeler.forEach(function (d) { d.addEventListener('click', function () {
    turSuz(d.getAttribute('data-grup'));
    var ust = izgara.getBoundingClientRect().top;                        // süzünce liste başı görünür kalsın
    if (ust < 0) window.scrollTo(0, (window.pageYOffset || 0) + suz.getBoundingClientRect().top - (el('bar') ? el('bar').offsetHeight : 0));
  }); });
  // üst menü, kategori şeridi ve alt menüdeki kategori bağlantıları: aynı sayfadaysa süzer, sonra bölüme iner
  hepsi('a[data-grup][href^="#"]').forEach(function (a) { a.addEventListener('click', function () {
    turSuz(a.getAttribute('data-grup'));
  }); });
  // tur sayfasından gelen: ?g=macera
  var gelen = /[?&]g=([a-z0-9]{2,12})/.exec(location.search);
  if (gelen) turSuz(gelen[1], true);
});

/* ---------- görünürken giriş ---------- */
dene('gir', function () {
  var hedefler = hepsi('[data-gir]');
  if (az || !('IntersectionObserver' in window)) { hedefler.forEach(function (e) { e.classList.add('gir'); }); return; }
  var g = new IntersectionObserver(function (kayitlar) {
    kayitlar.forEach(function (k) { if (k.isIntersecting) { k.target.classList.add('gir'); g.unobserve(k.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  hedefler.forEach(function (e) { g.observe(e); });
});

/* ---------- galeri: süzgeç + büyütme ---------- */
dene('galeri', function () {
  var izgara = el('izgara'), suz = el('suz'), kutu = el('buyut');
  if (!izgara || !kutu) return;                       // süzgeç yalnız ana sayfada; tur sayfasında o turun kareleri var
  var kareler = hepsi('.kare', izgara), dugmeler = suz ? hepsi('button', suz) : [], secili = 'hepsi', gorunen = kareler.slice();
  var resim = el('bResim'), bKat = el('bKat'), bSayi = el('bSayi'), acik = -1, sonOdak = null, x0 = null;

  function suzgec(kat) {
    if (kat === secili) return;
    secili = kat; gorunen = [];
    dugmeler.forEach(function (d) {
      var s = d.getAttribute('data-kat') === kat;
      d.className = s ? 'secili' : ''; d.setAttribute('aria-pressed', s ? 'true' : 'false');
    });
    kareler.forEach(function (k) {
      var g = kat === 'hepsi' || k.getAttribute('data-kat') === kat;
      k.hidden = !g;
      if (g) gorunen.push(k);
    });
    dataLayer.push({ event: 'galeri_suzgec', dil: DIL, kategori: kat });
  }
  dugmeler.forEach(function (d) { d.addEventListener('click', function () { suzgec(d.getAttribute('data-kat')); }); });

  function goster(i) {
    var n = gorunen.length, k, yeni;
    if (!n) return;
    acik = (i + n) % n; k = gorunen[acik];
    resim.className = 'soluk';
    yeni = new Image();
    yeni.onload = yeni.onerror = function () {
      if (gorunen[acik] !== k) return;
      resim.src = yeni.src; resim.alt = k.querySelector('img').alt; resim.className = '';
    };
    yeni.src = k.href;
    bKat.textContent = (V.kat || {})[k.getAttribute('data-kat')] || '';
    bSayi.textContent = (acik + 1) + ' / ' + n;
    if (n > 1) new Image().src = gorunen[(acik + 1) % n].href;      // sıradaki önden gelsin
  }
  function ac(i) {
    kutu.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { kutu.className = 'buyut acik'; }, 20);
    goster(i);
    try { el('bKapat').focus(); } catch (e) {}
  }
  function kapat() {
    kutu.className = 'buyut'; acik = -1;
    document.body.style.overflow = '';
    setTimeout(function () { kutu.hidden = true; resim.removeAttribute('src'); }, 300);
    try { if (sonOdak) sonOdak.focus(); } catch (e) {}
  }
  kareler.forEach(function (k) { k.addEventListener('click', function (o) {
    o.preventDefault(); sonOdak = k; ac(gorunen.indexOf(k));
    dataLayer.push({ event: 'galeri_ac', dil: DIL, kategori: k.getAttribute('data-kat') });
  }); });
  // tur sayfasının başındaki fotoğraf düzeni: küçük kareler ve "Tüm fotoğraflar" aynı büyütme penceresini açar
  hepsi('[data-kare]').forEach(function (a) { a.addEventListener('click', function (o) {
    var k = kareler[+a.getAttribute('data-kare')];
    if (!k) return;
    o.preventDefault(); sonOdak = a; ac(gorunen.indexOf(k));
    dataLayer.push({ event: 'galeri_ac', dil: DIL, kategori: k.getAttribute('data-kat') });
  }); });
  el('bKapat').addEventListener('click', kapat);
  el('bGeri').addEventListener('click', function () { goster(acik - 1); });
  el('bIleri').addEventListener('click', function () { goster(acik + 1); });
  kutu.addEventListener('click', function (o) { if (o.target === kutu) kapat(); });
  kutu.addEventListener('touchmove', durdur, { passive: false });
  kutu.addEventListener('touchstart', function (o) { x0 = o.touches[0].clientX; }, { passive: true });
  kutu.addEventListener('touchend', function (o) {
    if (x0 === null) return;
    var dx = o.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 48) goster(acik + (dx < 0 ? 1 : -1));
  });
  document.addEventListener('keydown', function (o) {
    if (acik < 0) return;
    var t = o.key || o.keyCode;
    if (t === 'Escape' || t === 'Esc' || t === 27) kapat();
    else if (t === 'ArrowRight' || t === 39) goster(acik + 1);
    else if (t === 'ArrowLeft' || t === 37) goster(acik - 1);
  });
});

/* ---------- ortak: WhatsApp'ı açar, VISTA bağlıysa talebi panele de bildirir ---------- */
function iki(n) { return ('0' + n).slice(-2); }
function koy(sablon, v) { return String(sablon || '').replace('{v}', v); }
function bugun() { var b = new Date(); return b.getFullYear() + '-' + iki(b.getMonth() + 1) + '-' + iki(b.getDate()); }
function gunAyYil(tarih) { var b = tarih.split('-'); return b.length === 3 ? b[2] + '.' + b[1] + '.' + b[0] : tarih; }
function gonder(satirlar, talep) {
  var url = 'https://wa.me/' + V.wa_no + '?text=' + encodeURIComponent(satirlar.join('\n')), pencere;
  dataLayer.push({ event: 'form_gonder', dil: DIL, turlar: talep.turlar, kisi: talep.kisi || null, tarih_var: !!talep.tarih });
  // VISTA bağlıysa talep panele de düşer (adres: sitedeki VISTA kodundan; yoksa metinler.py FORM_UC)
  var uc = (window.vista && window.vista.uc) ? window.vista.uc + '/api/vista/talep' : V.form_uc;
  if (uc && window.fetch) {
    try {                                            // başlık eklenmez: tarayıcı ön sorgu yapmadan doğrudan gönderir
      talep.dil = DIL; talep.z = window.vista ? window.vista.id : '';
      fetch(uc, { method: 'POST', keepalive: true, credentials: 'omit', body: JSON.stringify(talep) }).then(function () {}, function () {});
    } catch (e) {}
  }
  pencere = window.open(url, '_blank');
  if (pencere) { try { pencere.opener = null; } catch (e) {} } else location.href = url;
}

/* ---------- iletişim formu ---------- */
// Formda yalnız beş ana turun kutusu var; diğer hizmetlerden biriyle gelinince kendi kutusu eklenir
function kutuEkle(tur, ad) {
  var alan = document.querySelector('#form .secenek'), l, k, i, s;
  if (!alan || !ad) return null;
  l = document.createElement('label'); l.className = 'tik';
  k = document.createElement('input'); k.type = 'checkbox'; k.name = 'tur'; k.value = ad; k.setAttribute('data-tur', tur);
  i = document.createElement('i'); s = document.createElement('span'); s.textContent = ad;
  l.appendChild(k); l.appendChild(i); l.appendChild(s); alan.appendChild(l);
  return k;
}
dene('form', function () {
  var form = el('form');
  if (!form) return;
  var alan = form.elements;
  try { alan.tarih.min = bugun(); } catch (e) {}
  try {                                               // tur sayfasındaki "Talep formu" buraya ?tur=balon ile gelir: o tur işaretli açılır
    var gelen = /[?&]tur=([a-z0-9]{2,12})/.exec(location.search), kutu = gelen && form.querySelector('input[data-tur="' + gelen[1] + '"]'), h;
    if (gelen && !kutu && (h = document.querySelector('#tur-' + gelen[1] + ' h3'))) kutu = kutuEkle(gelen[1], h.textContent);
    if (kutu) kutu.checked = true;
  } catch (e) {}
  form.addEventListener('submit', function (o) {
    o.preventDefault();
    var ad = alan.ad.value.replace(/\s+/g, ' ').replace(/^ | $/g, '');
    var tarih = alan.tarih.value, kisi = alan.kisi.value.replace(/\s/g, ''), not = alan.mesaj.value.replace(/^\s+|\s+$/g, '');
    var isaretli = hepsi('input[name="tur"]:checked', form);
    var adlar = isaretli.map(function (i) { return i.value; }), kodlar = isaretli.map(function (i) { return i.getAttribute('data-tur'); });
    var satir = [ad ? koy(V.m_selam, ad) : V.m_adsiz];
    if (tarih) satir.push(koy(V.m_tarih, gunAyYil(tarih)));
    if (kisi) satir.push(koy(V.m_kisi, kisi));
    if (adlar.length) satir.push(koy(V.m_turlar, adlar.join(V.ayrac)));
    if (not) satir.push(not);
    satir.push(V.etiket);
    gonder(satir, { ad: ad, tarih: tarih, kisi: kisi, turlar: kodlar, mesaj: not });
  });
});

/* ---------- tur sayfası: küçük rezervasyon kutusu (tarih + kişi → hazır WhatsApp mesajı) ---------- */
dene('mini', function () {
  var form = el('mini');
  if (!form) return;
  var alan = form.elements, ad = form.getAttribute('data-ad'), kod = form.getAttribute('data-kod');
  try { alan.tarih.min = bugun(); } catch (e) {}
  hepsi('.sayac button', form).forEach(function (d) { d.addEventListener('click', function () {
    var n = (parseInt(alan.kisi.value, 10) || 0) + (+d.getAttribute('data-d'));
    alan.kisi.value = Math.max(1, Math.min(60, n));
  }); });
  form.addEventListener('submit', function (o) {
    o.preventDefault();
    var tarih = alan.tarih.value, kisi = String(parseInt(alan.kisi.value, 10) || '');
    var ilk = koy(V.tur_wa, ad).replace(V.etiket, '').replace(/\s+$/, '');
    var satir = [ilk];
    if (tarih) satir.push(koy(V.m_tarih, gunAyYil(tarih)));
    if (kisi) satir.push(koy(V.m_kisi, kisi));
    satir.push(V.etiket);
    dataLayer.push({ event: 'whatsapp_tik', dil: DIL, yer: 'rez-' + kod });
    gonder(satir, { ad: '', tarih: tarih, kisi: kisi, turlar: [kod], mesaj: '' });
  });
});

})();
