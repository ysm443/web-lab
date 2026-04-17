/* ============================================================
   nav.js — ナビゲーション制御
   ・ハンバーガーメニュー開閉
   ・スクロール後のヘッダー背景切替
============================================================ */

function initNav() {
  const header    = document.getElementById('header');
  const menuBtn   = document.getElementById('menuBtn');
  const headerNav = document.getElementById('headerNav');

  if (!header || !menuBtn || !headerNav) return;

  // ハンバーガーメニュー開閉
  const closeNav = () => {
    menuBtn.setAttribute('aria-expanded', 'false');
    headerNav.dataset.open  = 'false';
    headerNav.setAttribute('aria-hidden', 'true');
  };

  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    const next   = !isOpen;
    menuBtn.setAttribute('aria-expanded', String(next));
    menuBtn.setAttribute('aria-label', next ? 'メニューを閉じる' : 'メニューを開く');
    headerNav.dataset.open = String(next);
    if (next) {
      headerNav.removeAttribute('aria-hidden');
    } else {
      headerNav.setAttribute('aria-hidden', 'true');
    }
  });

  // 初期状態（SP）は非表示として設定
  if (window.innerWidth < 600) {
    headerNav.setAttribute('aria-hidden', 'true');
  }

  // ナビリンクをクリックしたらメニューを閉じる
  headerNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // アンカーリンクのスムーズスクロール（固定ヘッダー高さ分オフセット）
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const hash = link.getAttribute('href');
      if (hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // スクロール検知: ヘッダー背景
  const onScroll = () => {
    header.dataset.scrolled = window.scrollY > 60 ? 'true' : 'false';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
