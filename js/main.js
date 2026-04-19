/* ============================================================
   main.js — エントリーポイント

   読み込み順序:
   lenis.min.js → gsap.min.js → ScrollTrigger.min.js →
   gsap.js → main.js
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ScrollTrigger 非依存の即時処理（typewriter / reel / hero / 初期状態）
  if (typeof initGsap === 'function') initGsap();

  _initHeader();
  _initMobileNav();
  _initAnchorLinks();
  _initBackToTop();

  // フッター年号
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

// 全画像読込後に ScrollTrigger を初期化
// → DOMContentLoaded 時点でのページ高さ不足による誤発火を防ぐ
window.addEventListener('load', () => {
  if (typeof initGsapScroll === 'function') initGsapScroll();
});

/* ============================================================
   Header — スクロールで背景追加
============================================================ */
function _initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ============================================================
   Mobile Nav
============================================================ */
function _initMobileNav() {
  const btn = document.querySelector('.header__menu-btn');
  const nav = document.querySelector('.header__nav');
  if (!btn || !nav) return;

  const open = () => {
    nav.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'メニューを閉じる');
  };
  const close = () => {
    nav.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'メニューを開く');
  };

  btn.addEventListener('click', () => {
    nav.classList.contains('is-open') ? close() : open();
  });

  // オーバーレイ背景をタップして閉じる
  nav.addEventListener('click', e => {
    if (e.target === nav) close();
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
  });
}

/* ============================================================
   アンカーリンク
============================================================ */
function _initAnchorLinks() {
  const HEADER_H = 64; // --header-h と一致

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   Back to Top
============================================================ */
function _initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      start: '300px top',
      onEnter:     () => btn.classList.add('is-visible'),
      onLeaveBack: () => btn.classList.remove('is-visible')
    });
  }

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
