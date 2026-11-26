/* Cappadocia Vista Tours · site v3
   Film motoru (kaydırmaya bağlı kareler), menü, giriş hareketleri, galeri, iletişim formu.
   Eski telefon tarayıcıları için sade yazıldı (ok işlevi, let/const, şablon dizgisi yok).
   Her parça ayrı korumada: biri hata verirse diğerleri çalışır; film hata verirse site düz açılır. */
(function () {
'use strict';
var kok = document.documentElement, DIL = document.body.getAttribute('data-dil');
function el(id) { return document.getElementById(id); }
function hepsi(s, k) { return [].slice.call((k || document).querySelectorAll(s)); }
function sinirla(v, a, b) { return v < a ? a : v > b ? b : v; }
function konum() { return window.pageYOffset || kok.scrollTop || 0; }
function dene(ad, f) { try { f(); } catch (e) { try { console.error(ad, e); } catch (x) {} } }
function durdur(o) { o.preventDefault(); }

var V = {};
try { V = JSON.parse(el('veri').textContent); } catch (e) {}
var ince = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);
var cerceve = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
var dongu = [];            // her ekran yenilemesinde çağrılanlar: f(kaydırma konumu, zaman)
var filmGit = null;        // film kurulunca: uzak atlamada kısa karartmalı sıçrama
var menuKapa = null;

// ölçüm: dil ve WhatsApp tıklamaları veri katmanına (GTM / GA4 bağlanınca okunur)
window.dataLayer = window.dataLayer || [];
try { localStorage.setItem('dil', DIL); } catch (e) {}
dataLayer.push({ event: 'dil_sayfasi', dil: DIL });
dene('olcum', function () {
  hepsi('a.wa').forEach(function (a) { a.addEventListener('click', function () {
    dataLayer.push({ event: 'whatsapp_tik', dil: DIL, yer: a.getAttribute('data-olay') }); }); });
  hepsi('a[data-olay="instagram"]').forEach(function (a) { a.addEventListener('click', function () {
    dataLayer.push({ event: 'instagram_tik', dil: DIL }); }); });
});

function git(y) {
  if (Math.abs(y - konum()) > window.innerHeight * 1.6 && filmGit) filmGit(y);
  else { try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); } }
}

/* ---------- telefon menüsü ---------- */
dene('menu', function () {
  var menu = el('menu'), ac = el('menuAc'), kapat = el('menuKapat');
  if (!menu || !ac || !kapat) return;
  function durum(acik) {
    ac.setAttribute('aria-expanded', acik ? 'true' : 'false');
    if (acik) { menu.hidden = false; setTimeout(function () { menu.className = 'menu acik'; }, 20); }
    else { menu.className = 'menu'; setTimeout(function () { menu.hidden = true; }, 300); }
  }
  ac.addEventListener('click', function () { durum(true); });
  kapat.addEventListener('click', function () { durum(false); });
  menu.addEventListener('touchmove', durdur, { passive: false });
  menuKapa = function () { if (!menu.hidden) durum(false); };
});

/* ---------- film ---------- */
function duz(hata) {      // film atlanır, site düz gösterilir (hiçbir şey gizli kalmaz)
  try { console.error('film atlandi', hata); } catch (e) {}
  kok.className = 'js duz';
  var y = el('yukle'); if (y) y.className = 'gitti';
}

function filmKur() {
  var F = V.film;
  if (!F || !F.kare) throw new Error('film verisi yok');
  var TOPLAM = F.kare, BAS = F.sahne, N = BAS.length, SON = TOPLAM - 1, KUYRUK = V.kuyruk || 0, TOP = SON + KUYRUK;
  var sahne = el('sahne'), tuval = el('tuval'), ctx = tuval.getContext('2d', { alpha: false });
  var filmEl = el('ust'), karart = el('karart'), gecis = el('gecis'), bar = el('bar'), yaz = el('yaz');
  var ipucu = el('ipucu'), iletisim = el('iletisim');
  var dik = tuval.clientWidth / tuval.clientHeight < 0.66;          // telefon dik: dik kırpılmış kareler
  // geniş tuvalde (büyük ekran) 1920 piksellik takım; küçük ekranlı bilgisayar hafif takımla yetinir
  var genis = !dik && F.buyuk && tuval.clientWidth * Math.min(window.devicePixelRatio || 1, 2) >= 1400;
  var KLASOR = dik ? '../film_d/' : (genis ? '../film_b/' : '../film/');
  var ILERI = ince ? 140 : 90, GERI = 30, SIL = 240, TAU = ince ? 0.09 : 0.05;
  var GIR0 = 30, GIR1 = 12, CIK0 = 20, CIK1 = 36;                   // sahne yazısı: kareye göre giriş başı/sonu, çıkış başı/sonu
  var kareler = new Array(TOPLAM);
  var yazilar = hepsi('.yazi', sahne).map(function (e) {
    return { el: e, c: [].slice.call(e.children), s: +e.getAttribute('data-sahne'), son: '', tip: -1 }; });
  var p = 0, hedefP = 0, kare = 0, acildi = false, sonCizim = -1, sonMerkez = -999, sonW = 0, sonH = 0;
  var pay = 1, filmBoy = 1, onceki = 0, sahneAcik = true, sonKarart = -1, barDolu = false, yazAcik = false, sonIpucu = -1, kirli = false;

  function hazir(im) { return im && im.complete && im.naturalWidth > 0; }
  function cozuk(im) { return hazir(im) && im.cozuk; }
  function kapla(im) {
    var W = tuval.width, H = tuval.height;
    var s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }
  function boyutla() {
    var w = tuval.clientWidth, h = tuval.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, ince ? 2 : 1.5);
    sonW = w; sonH = h; filmBoy = filmEl.offsetHeight; pay = Math.max(1, filmBoy - window.innerHeight);
    tuval.width = Math.round(w * dpr); tuval.height = Math.round(h * dpr);
    sonCizim = -1; ciz();
  }
  function kareIste(i, uzaklik) {
    if (i < 0 || i >= TOPLAM || kareler[i]) return;
    var im = new Image(); im.decoding = 'async';
    try { im.fetchPriority = uzaklik < 10 ? 'high' : 'low'; } catch (e) {}
    im.onload = function () {
      if (im.decode) im.decode().then(function () { im.cozuk = 1; }, function () {});   // çizim anında çözme beklemesi olmasın
      if (!acildi) ilkYukleme(); else if (Math.abs(i - kare) < 6) ciz();
    };
    im.onerror = function () { kareler[i] = null; };
    im.src = KLASOR + ('000' + (i + 1)).slice(-4) + '.webp';
    kareler[i] = im;
  }
  function birak(i) { var im = kareler[i]; im.onload = im.onerror = null; im.src = ''; kareler[i] = null; }
  // Yalnız bulunulan yerin çevresindeki kareler bellekte tutulur (uzun film telefonu yormasın).
  function pencere(zorla) {
    var k = Math.round(kare), yon = k >= sonMerkez ? 1 : -1, d, i;
    if (!zorla && Math.abs(k - sonMerkez) < 4) return;
    sonMerkez = k;
    for (d = 0; d <= ILERI; d++) { kareIste(k + yon * d, d); if (d > 0 && d <= GERI) kareIste(k - yon * d, d); }
    for (i = 0; i < TOPLAM; i++) if (kareler[i] && (i < k - SIL || i > k + SIL)) birak(i);
  }
  function ciz() {
    var i = sinirla(Math.round(kare), 0, SON), im = null, d;
    for (d = 0; d <= 4 && !im; d++) {                // önce çözülmüş (çizime hazır) en yakın kare
      if (cozuk(kareler[i - d])) { im = kareler[i - d]; i -= d; }
      else if (cozuk(kareler[i + d])) { im = kareler[i + d]; i += d; }
    }
    for (d = 0; d <= 10 && !im; d++) {
      if (hazir(kareler[i - d])) { im = kareler[i - d]; i -= d; }
      else if (hazir(kareler[i + d])) { im = kareler[i + d]; i += d; }
    }
    if (!im || i === sonCizim) return;               // kare gelmediyse ekrandaki kare kalır (boş ekran olmaz)
    sonCizim = i; kapla(im);
  }

  // sahne yazısı: 0 gizli · 1 giriyor (c 0..1, satırlar sırayla) · 2 tam · 3 çıkıyor (c 0..1)
  function yazi(j, tip, c) {
    var y = yazilar[j], an, k, n, ck, e, g = 0.24;
    an = tip + ':' + (tip === 1 || tip === 3 ? c.toFixed(3) : '');
    if (y.son === an) return;
    y.son = an;
    if (tip === 0) { y.el.style.opacity = 0; y.el.style.visibility = 'hidden'; y.tip = 0; return; }
    y.el.style.visibility = 'visible';
    n = y.c.length;
    if (tip === 1) {
      y.el.style.opacity = Math.min(1, c * 2.4); y.el.style.transform = '';
      for (k = 0; k < n; k++) {
        ck = sinirla(c * (1 + g * (n - 1)) - k * g, 0, 1); e = 1 - Math.pow(1 - ck, 3);
        y.c[k].style.opacity = e; y.c[k].style.transform = 'translate3d(0,' + ((1 - e) * 30).toFixed(1) + 'px,0)';
      }
    } else {
      if (y.tip !== 2 && y.tip !== 3) for (k = 0; k < n; k++) { y.c[k].style.opacity = ''; y.c[k].style.transform = ''; }
      if (tip === 2) { y.el.style.opacity = 1; y.el.style.transform = ''; }
      else { y.el.style.opacity = 1 - c; y.el.style.transform = 'translate3d(0,' + (-40 * c).toFixed(1) + 'px,0)'; }
    }
    y.tip = tip;
  }

  // Kaydırma → film: düz ve kesintisiz. Film hiçbir yerde donmaz; yazılar film akarken girer ve çıkar.
  function guncelle() {
    var ham = p * TOP, j, y, d, o;
    kare = Math.min(SON, ham);
    for (j = 0; j < yazilar.length; j++) {
      y = yazilar[j];
      if (y.s === N - 1) {                           // son sahne: film bitince girer, içerik gelene dek kalır
        d = ham - TOP;
        if (d < -GIR0) yazi(j, 0, 0); else if (d < -GIR1) yazi(j, 1, (d + GIR0) / (GIR0 - GIR1)); else yazi(j, 2, 0);
      } else {
        d = kare - BAS[y.s];
        if (d < -GIR0 || d > CIK1) yazi(j, 0, 0);
        else if (d < -GIR1) yazi(j, 1, (d + GIR0) / (GIR0 - GIR1));
        else if (d <= CIK0) yazi(j, 2, 0);
        else yazi(j, 3, (d - CIK0) / (CIK1 - CIK0));
      }
    }
    o = Math.round(sinirla(0.85 - kare / 14, 0, 0.85) * 100);
    if (o !== sonIpucu) { sonIpucu = o; ipucu.style.opacity = o / 100; }
    pencere(); ciz();
  }

  // sahnenin içerikle ilişkisi: içerik üstüne çıkarken sahne kararır, tamamen örtülünce gizlenir
  function ustKatman(y) {
    var k = Math.round(sinirla((y - pay) / Math.max(1, window.innerHeight), 0, 1) * 62), a, goster;
    if (k !== sonKarart) { sonKarart = k; karart.style.opacity = (k / 100).toFixed(2); }
    a = y < filmBoy + 4;
    if (a !== sahneAcik) { sahneAcik = a; sahne.style.visibility = a ? 'visible' : 'hidden'; }
    a = y > filmBoy - 70;
    if (a !== barDolu) { barDolu = a; bar.className = a ? 'bar dolu' : 'bar'; }
    if (yaz) {
      goster = kare > 36 && !(iletisim && y > filmBoy && iletisim.getBoundingClientRect().top < window.innerHeight * 0.55);
      if (goster !== yazAcik) { yazAcik = goster; yaz.className = goster ? 'yaz wa acik' : 'yaz wa'; }
    }
  }

  // Her ekran yenilemesinde kaydırma konumu okunur; film ona tek ve kısa bir yumuşatmayla (TAU sn) yaklaşır.
  function tik(y, t) {
    var dt = sinirla((t - onceki) / 1000, 0.001, 0.1), eski = p, fark;
    onceki = t;
    hedefP = sinirla(y / pay, 0, 1);
    fark = hedefP - p;
    if (Math.abs(fark) * TOP < 0.02 || Math.abs(fark) * TOP > 240) p = hedefP;     // yerinde ya da uzak atlama: doğrudan
    else p += fark * (1 - Math.exp(-dt / TAU));
    if (p !== eski) kirli = true;
    ustKatman(y);
    if (kirli && sahneAcik) { kirli = false; guncelle(); }      // sahne içeriğin altındayken çizilmez; görününce güncellenir
  }

  function ilkYukleme() {
    if (acildi) return;
    var n = 0, i;
    for (i = 0; i < 16; i++) if (hazir(kareler[i])) n++;
    el('yuzde').style.transform = 'scaleX(' + Math.min(1, n / 12) + ')';
    if (n >= 12) ac();
  }

  function ac() {
    if (acildi) return;
    acildi = true; boyutla();
    hedefP = sinirla(konum() / pay, 0, 1); p = hedefP;
    guncelle(); ustKatman(konum());
    dongu.push(tik);
    el('yukle').className = 'gitti';
    if (yazilar[0]) yazilar[0].el.className += ' giris';
  }

  // sahneler arası uzak atlama: kısa karartma, anında konum, açılma (yüklenmemiş karelerin içinden geçmez)
  filmGit = function (y) {
    gecis.className = 'gecis acik';
    setTimeout(function () {
      window.scrollTo(0, y);
      hedefP = sinirla(y / pay, 0, 1); p = hedefP; guncelle(); pencere(true); sonCizim = -1; ciz(); ustKatman(y);
      setTimeout(function () { gecis.className = 'gecis'; }, 160);
    }, 300);
  };

  pencere(true);
  setTimeout(function () { if (!acildi) ac(); }, 6500);            // yavaş bağlantıda bekletme: gelen kadarıyla aç
  window.addEventListener('resize', function () {
    var w = tuval.clientWidth, h = tuval.clientHeight;
    if (w === sonW && Math.abs(h - sonH) < 90) return;             // telefonda adres çubuğu oynaması: dokunma
    if ((w / h < 0.66) !== dik) { location.reload(); return; }     // telefon yan çevrildi: doğru kare takımı
    boyutla();
  });
  window.addEventListener('load', function () { if (acildi) boyutla(); });
}
// Tur sayfalarında film yok: üst çubuk kapak görselinin üstünde saydam başlar, kaydırınca dolar; telefonda WhatsApp düğmesi belirir.
function altSayfaKur() {
  var bar = el('bar'), yaz = el('yaz'), dolu = null;
  dongu.push(function (y) {
    var a = y > 80;
    if (a === dolu) return;
    dolu = a;
    if (bar) bar.className = a ? 'bar dolu' : 'bar';
    if (yaz) yaz.className = a ? 'yaz wa acik' : 'yaz wa';
  });
}
dene('film', function () {
  if (!el('tuval')) { altSayfaKur(); return; }       // film yalnız ana sayfada
  try { filmKur(); } catch (e) { duz(e); }
});

/* ---------- sayfa içi bağlantılar ---------- */
// Formda yalnız beş ana turun kutusu var; diğer 22 hizmet sorulunca kendi kutusu eklenir (WhatsApp mesajına ve panele adıyla gider)
function kutuEkle(tur, ad) {
  var alan = document.querySelector('#form .secenek'), l, k, i, s;
  if (!alan || !ad) return null;
  l = document.createElement('label'); l.className = 'tik';
  k = document.createElement('input'); k.type = 'checkbox'; k.name = 'tur'; k.value = ad; k.setAttribute('data-tur', tur);
  i = document.createElement('i'); s = document.createElement('span'); s.textContent = ad;
  l.appendChild(k); l.appendChild(i); l.appendChild(s); alan.appendChild(l);
  return k;
}
dene('baglanti', function () {
  hepsi('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function (o) {
    var id = a.getAttribute('href').slice(1), hedef = el(id), tur = a.getAttribute('data-tur'), kutu, form;
    if (!hedef) return;
    o.preventDefault();
    if (menuKapa) menuKapa();
    if (tur) {                                       // "Bu turu sor": formda o tur işaretlenir
      kutu = document.querySelector('#form input[data-tur="' + tur + '"]');
      if (!kutu) kutu = kutuEkle(tur, a.getAttribute('data-ad'));    // formda kutusu olmayan hizmet: kutusu eklenir
      if (kutu) kutu.checked = true;
      dataLayer.push({ event: 'tur_sor', dil: DIL, tur: tur });
      form = el('form');
      if (form && window.innerWidth < 980) { git(form.getBoundingClientRect().top + konum() - 90); return; }
    }
    git(id === 'ust' ? 0 : hedef.getBoundingClientRect().top + konum());
  }); });
});

/* ---------- görünürken giriş ---------- */
dene('giris', function () {
  var hedefler = hepsi('[data-gir],[data-sira],.cer,.kare');
  if (!('IntersectionObserver' in window)) { hedefler.forEach(function (e) { e.className += ' gir'; }); return; }
  var g = new IntersectionObserver(function (kayitlar) {
    var n = 0;
    kayitlar.forEach(function (k) {
      if (!k.isIntersecting) return;
      var e = k.target;
      if (e.className.indexOf('cer') < 0) e.style.transitionDelay = (Math.min(n, 7) * 70) + 'ms';
      n++;
      e.classList.add('gir');
      g.unobserve(e);
      setTimeout(function () { e.style.transitionDelay = ''; }, 1700);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.01 });
  hedefler.forEach(function (e) { g.observe(e); });
});

/* ---------- içerik hareketleri: büyük cümle kelime kelime açılır, görseller hafifçe kayar ---------- */
dene('hareket', function () {
  var dev = el('dev'), kelimeler = [], sonDev = -1, par = ince ? hepsi('img[data-par]') : [];
  if (dev) (function yuru(n) {
    [].slice.call(n.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var cince = /[㐀-鿿]/.test(c.nodeValue), f = document.createDocumentFragment();
        (cince ? c.nodeValue.split('') : c.nodeValue.split(/(\s+)/)).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
          var sp = document.createElement('span'); sp.className = 'k'; sp.textContent = p; f.appendChild(sp); kelimeler.push(sp);
        });
        n.replaceChild(f, c);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') yuru(c);
    });
  })(dev);
  dongu.push(function () {
    var vh = window.innerHeight, r, i, a, n = kelimeler.length, o, e, kutu;
    if (dev && n) {
      r = dev.getBoundingClientRect();
      if (r.bottom > -vh && r.top < vh * 2) {
        a = Math.round(sinirla((vh * 0.9 - r.top) / (vh * 0.48 + r.height), 0, 1) * 400);
        if (a !== sonDev) {
          sonDev = a;
          for (i = 0; i < n; i++) { o = sinirla(a / 400 * (n + 2) - i, 0, 1); kelimeler[i].style.opacity = (0.16 + 0.84 * o).toFixed(3); }
        }
      }
    }
    for (i = 0; i < par.length; i++) {
      e = par[i]; kutu = e.parentNode;
      r = kutu.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      a = sinirla((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      e.style.transform = 'translate3d(0,' + (a * +e.getAttribute('data-par')).toFixed(2) + '%,0)';
    }
  });
});

/* ---------- turlar: yana kaydırılan kartlar (26 Kas 2026, Hüseyin Bey'in isteği) ----------
   Kaydırma tarayıcının kendisi (parmak, trackpad, ok tuşları); fareyle sürükleme yalnız fareli cihazda.
   Görünen kartın düğmesi yanar, görünmeyen kart söner; fotoğraf kaydıkça hafifçe ters yöne kayar;
   arkadaki ortam ışığı görünen turun rengini alır. Fareli cihazda kart imlece doğru 3B eğilir, ışık imleci izler. */
dene('turlar', function () {
  var liste = el('tur-liste');
  if (!liste) return;
  var sahne = liste.parentNode, kartlar = hepsi('.kart', liste), secler = hepsi('#tur-sec [data-git]'), geri = el('tur-geri'),
      ileri = el('tur-ileri'), cubuk = el('tur-cubuk'), say = el('tur-say'), ortam = hepsi('#tur-ortam i'),
      az = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
      bekle = false, oynandi = false, acildi = false, ustte = -1, sonOrtam = -1, n = kartlar.length;
  if (!n) return;
  function iki(x) { return (x < 9 ? '0' : '') + (x + 1); }
  function adim() { return n > 1 ? kartlar[1].offsetLeft - kartlar[0].offsetLeft : liste.clientWidth; }
  function kay(x) {
    x = sinirla(x, 0, liste.scrollWidth - liste.clientWidth);
    if (liste.scrollTo && !az) { try { liste.scrollTo({ left: x, behavior: 'smooth' }); return; } catch (e) {} }
    liste.scrollLeft = x;
  }
  // telefonda kategori düğmeleri ekrana sığmaz: görünen kartın kategorisi değişince o düğme görünür yere kayar
  var secKutu = el('tur-sec'), sonGrup = -1;
  function seciliGoster(i) {
    var g = +kartlar[i].getAttribute('data-g'), b = secler[g], x;
    if (g === sonGrup) return;
    sonGrup = g;
    if (!b || !secKutu || secKutu.scrollWidth <= secKutu.clientWidth + 2) return;
    x = sinirla(b.offsetLeft - 16, 0, secKutu.scrollWidth - secKutu.clientWidth);
    if (secKutu.scrollTo && !az) { try { secKutu.scrollTo({ left: x, behavior: 'smooth' }); return; } catch (e) {} }
    secKutu.scrollLeft = x;
  }
  function ortamYak(i) {
    if (i === sonOrtam || !ortam[i]) return;
    sonOrtam = i;
    ortam.forEach(function (o, j) { o.classList.toggle('acik', j === i); });
  }
  function guncelle() {
    bekle = false;
    var sl = liste.scrollLeft, w = liste.clientWidth, sw = liste.scrollWidth, i, k, sol, en, gor, d, ilk = -1, son = -1, gruplar = {};
    for (i = 0; i < n; i++) {
      k = kartlar[i]; sol = k.offsetLeft - sl; en = k.offsetWidth;
      gor = (Math.min(sol + en, w) - Math.max(sol, 0)) / en > 0.6;           // kartın en az %60'ı görünüyor
      k.classList.toggle('gorunur', gor);
      if (gor) { if (ilk < 0) ilk = i; son = i; }
      if (gor) gruplar[k.getAttribute('data-g')] = 1;
      if (!az) {
        d = sinirla((sol + en / 2 - w / 2) / w, -1, 1);
        k.style.setProperty('--px', (d * -26).toFixed(1) + 'px');
      }
    }
    if (ilk < 0) ilk = son = 0;
    secler.forEach(function (b) {                                            // görünen kartın kategorisi yanar
      var acik = !!gruplar[b.getAttribute('data-g')];
      b.classList.toggle('secili', acik); b.setAttribute('aria-pressed', acik ? 'true' : 'false');
    });
    seciliGoster(ilk);
    if (say) say.innerHTML = iki(ilk) + (son > ilk ? ' – ' + iki(son) : '') + ' <small>/ ' + iki(n - 1) + '</small>';
    ortamYak(ustte >= 0 ? ustte : ilk);
    if (geri) geri.disabled = sl < 4;
    if (ileri) ileri.disabled = sl > sw - w - 4;
    if (cubuk && sw > 0) { cubuk.style.width = (w / sw * 100).toFixed(2) + '%'; cubuk.style.left = (sl / sw * 100).toFixed(2) + '%'; }
  }
  function iste() { if (!bekle) { bekle = true; cerceve(guncelle); } }
  liste.addEventListener('scroll', function () {
    iste();
    if (!oynandi && liste.scrollLeft > 12) { oynandi = true; sahne.classList.add('oynandi'); dataLayer.push({ event: 'tur_kaydir', dil: DIL }); }
  });
  window.addEventListener('resize', iste);
  // kategori satırı sığmıyorsa devamı olan kenar solar (sol: geride düğme var, sağ: ileride düğme var)
  function cipTasar() {
    if (!secKutu) return;
    var x = secKutu.scrollLeft, fazla = secKutu.scrollWidth - secKutu.clientWidth;
    secKutu.classList.toggle('sol', fazla > 2 && x > 4);
    secKutu.classList.toggle('sag', fazla > 2 && x < fazla - 4);
  }
  if (secKutu) secKutu.addEventListener('scroll', cipTasar);
  cipTasar(); window.addEventListener('resize', cipTasar);
  if (geri) geri.addEventListener('click', function () { kay(liste.scrollLeft - adim()); });
  if (ileri) ileri.addEventListener('click', function () { kay(liste.scrollLeft + adim()); });
  secler.forEach(function (b) { b.addEventListener('click', function () {
    var i = +b.getAttribute('data-git');
    if (kartlar[i]) kay(kartlar[i].offsetLeft - kartlar[0].offsetLeft);
  }); });

  // fareli cihaz: kart imlece doğru en çok 7° eğilir; ışık, kenar parlaması ve fotoğraftaki yansıma imleci izler
  if (ince && !az) kartlar.forEach(function (k, i) {
    var ic = k.querySelector('.kart-ic'), foto = k.querySelector('.kart-foto'), hedef = null, cizim = false;
    function ciz() {
      cizim = false;
      if (!hedef) return;
      var r = ic.getBoundingClientRect(), x = (hedef.x - r.left) / r.width, y = (hedef.y - r.top) / r.height, f = foto.getBoundingClientRect();
      ic.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
      ic.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
      ic.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      ic.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      foto.style.setProperty('--gx', ((hedef.x - f.left) / f.width * 100).toFixed(1) + '%');
      foto.style.setProperty('--gy', ((hedef.y - f.top) / f.height * 100).toFixed(1) + '%');
    }
    var tarama = 0;
    k.addEventListener('mouseenter', function () {
      k.classList.add('egik'); ustte = i; iste();
      if (liste.classList.contains('yerlesti')) {                              // tarama ışığı her girişte baştan
        k.classList.remove('tara'); void k.offsetWidth; k.classList.add('tara');
        clearTimeout(tarama); tarama = setTimeout(function () { k.classList.remove('tara'); }, 1450);
      }
    });
    k.addEventListener('mousemove', function (o) { hedef = { x: o.clientX, y: o.clientY }; if (!cizim) { cizim = true; cerceve(ciz); } });
    k.addEventListener('mouseleave', function () {
      hedef = null; k.classList.remove('egik'); ustte = -1; iste();
      ic.style.setProperty('--rx', '0deg'); ic.style.setProperty('--ry', '0deg');
    });
  });

  // fareyle tutup sürükleme; bırakınca en yakın karta oturur, sürüklerken tıklama sayılmaz
  if (ince && window.PointerEvent) (function () {
    var x0 = 0, s0 = 0, basili = false, oynak = false;
    liste.addEventListener('pointerdown', function (o) {
      if (o.pointerType !== 'mouse' || o.button !== 0) return;
      x0 = o.clientX; s0 = liste.scrollLeft; basili = true; oynak = false;
    });
    window.addEventListener('pointermove', function (o) {
      if (!basili) return;
      var dx = o.clientX - x0;
      if (!oynak && Math.abs(dx) > 6) { oynak = true; liste.classList.add('suruk'); }
      if (oynak) liste.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!basili) return;
      basili = false;
      if (!oynak) return;
      var a = adim();
      liste.classList.remove('suruk');
      kay(Math.round(liste.scrollLeft / a) * a);
      setTimeout(function () { oynak = false; }, 0);
    });
    liste.addEventListener('click', function (o) { if (oynak) { o.preventDefault(); o.stopPropagation(); } }, true);
    liste.addEventListener('dragstart', durdur);
  })();

  // giriş: şerit görününce kartlar sağdan sırayla gelir, fotoğraflar perde gibi açılır
  function ac() {
    if (acildi) return;
    acildi = true;
    liste.classList.add('acik');
    setTimeout(function () { liste.classList.add('yerlesti'); guncelle(); }, az ? 0 : 2800 + n * 100);   // tarama ışığı bitene kadar
    guncelle();
  }
  if (az || !('IntersectionObserver' in window)) ac();
  else {
    var g = new IntersectionObserver(function (kayitlar) {
      if (kayitlar[0].isIntersecting) { ac(); g.disconnect(); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    g.observe(liste);
  }
  guncelle();
});

/* ---------- galeri: süzgeç + büyütme ---------- */
dene('galeri', function () {
  var izgara = el('izgara'), suz = el('suz'), kutu = el('buyut');
  if (!izgara || !kutu) return;                       // süzgeç yalnız ana sayfada; tur sayfasında o turun kareleri var
  var kareler = hepsi('.kare', izgara), dugmeler = suz ? hepsi('button', suz) : [], secili = 'hepsi', gorunen = kareler.slice();
  var resim = el('bResim'), bKat = el('bKat'), bSayi = el('bSayi'), acik = -1, sonOdak = null, x0 = null;

  // Kareler sütunlara sırayla, her seferinde en kısa sütuna dizilir: listedeki ilk kareler en üstte kalır.
  var sutunSayisi = 0;
  function diz(zorla) {
    var n = window.innerWidth <= 1000 ? 2 : 3, sutunlar = [], boy = [], i, k, im, en;
    if (!zorla && n === sutunSayisi) return;
    sutunSayisi = n;
    kareler.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
    while (izgara.firstChild) izgara.removeChild(izgara.firstChild);
    for (i = 0; i < n; i++) { sutunlar[i] = document.createElement('div'); sutunlar[i].className = 'sutun'; boy[i] = 0; izgara.appendChild(sutunlar[i]); }
    for (i = 0; i < gorunen.length; i++) {
      im = gorunen[i].querySelector('img');
      en = 0;
      for (k = 1; k < n; k++) if (boy[k] < boy[en] - 0.02) en = k;
      sutunlar[en].appendChild(gorunen[i]);
      boy[en] += (+im.getAttribute('height') || 1) / (+im.getAttribute('width') || 1) + 0.03;
    }
  }
  function sinif(soluk) { izgara.className = 'izgara sutunlu' + (soluk ? ' soluk' : ''); }
  diz(true); sinif(false);
  window.addEventListener('resize', function () { diz(false); });

  function suzgec(kat) {
    if (kat === secili) return;
    secili = kat;
    dugmeler.forEach(function (d) {
      var s = d.getAttribute('data-kat') === kat;
      d.className = s ? 'secili' : ''; d.setAttribute('aria-pressed', s ? 'true' : 'false');
    });
    sinif(true);
    setTimeout(function () {
      gorunen = [];
      kareler.forEach(function (k) {
        var g = kat === 'hepsi' || k.getAttribute('data-kat') === kat;
        k.hidden = !g;
        if (g) { k.style.transitionDelay = ''; k.classList.add('gir'); gorunen.push(k); }
      });
      diz(true); sinif(false);
    }, 270);
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
    setTimeout(function () { kutu.className = 'buyut acik'; }, 20);
    goster(i);
    try { el('bKapat').focus(); } catch (e) {}
  }
  function kapat() {
    kutu.className = 'buyut'; acik = -1;
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
  kutu.addEventListener('wheel', durdur, { passive: false });
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

/* ---------- iletişim formu: mesajı hazırlar, WhatsApp'ı açar ---------- */
dene('form', function () {
  var form = el('form');
  if (!form) return;
  var alan = form.elements, bugun = new Date();
  function iki(n) { return ('0' + n).slice(-2); }
  function koy(sablon, v) { return sablon.replace('{v}', v); }
  try { alan.tarih.min = bugun.getFullYear() + '-' + iki(bugun.getMonth() + 1) + '-' + iki(bugun.getDate()); } catch (e) {}
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
    var satir = [ad ? koy(V.m_selam, ad) : V.m_adsiz], b = tarih.split('-'), url, pencere;
    if (tarih) satir.push(koy(V.m_tarih, b.length === 3 ? b[2] + '.' + b[1] + '.' + b[0] : tarih));
    if (kisi) satir.push(koy(V.m_kisi, kisi));
    if (adlar.length) satir.push(koy(V.m_turlar, adlar.join(V.ayrac)));
    if (not) satir.push(not);
    satir.push(V.etiket);
    url = 'https://wa.me/' + V.wa_no + '?text=' + encodeURIComponent(satir.join('\n'));
    dataLayer.push({ event: 'form_gonder', dil: DIL, turlar: kodlar, kisi: kisi || null, tarih_var: !!tarih });
    // VISTA bağlıysa talep panele de düşer (adres: sitedeki VISTA kodundan; yoksa metinler.py FORM_UC)
    var uc = (window.vista && window.vista.uc) ? window.vista.uc + '/api/vista/talep' : V.form_uc;
    if (uc && window.fetch) {
      try {                                            // başlık eklenmez: tarayıcı ön sorgu yapmadan doğrudan gönderir
        fetch(uc, { method: 'POST', keepalive: true, credentials: 'omit',
          body: JSON.stringify({ ad: ad, tarih: tarih, kisi: kisi, turlar: kodlar, mesaj: not, dil: DIL,
            z: window.vista ? window.vista.id : '' }) })
          .then(function () {}, function () {});
      } catch (e) {}
    }
    pencere = window.open(url, '_blank');
    if (pencere) { try { pencere.opener = null; } catch (e) {} } else location.href = url;
  });
});

/* ---------- tek döngü ---------- */
(function calis(t) {
  var y = konum(), i;
  for (i = 0; i < dongu.length; i++) { try { dongu[i](y, t || 0); } catch (e) {} }
  cerceve(calis);
})(0);
})();
