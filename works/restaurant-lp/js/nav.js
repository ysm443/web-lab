/* ============================================================
   nav.js — ナビゲーション制御
   ・ハンバーガーメニュー開閉
   ・スクロール後のヘッダー背景切替
   ・アンカーリンクのスムーズスクロール（Lenis連動）
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
    header.dataset.navOpen  = 'false';
  };

  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    const next   = !isOpen;
    menuBtn.setAttribute('aria-expanded', String(next));
    menuBtn.setAttribute('aria-label', next ? 'メニューを閉じる' : 'メニューを開く');
    headerNav.dataset.open = String(next);
    header.dataset.navOpen = String(next);
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

  // スクロール検知: ヒーロー下端がヘッダー下端を超えたら背景表示
  const heroEl   = document.getElementById('hero');
  const onScroll = () => {
    if (heroEl) {
      const heroBottom = heroEl.getBoundingClientRect().bottom;
      header.dataset.scrolled = heroBottom <= header.offsetHeight ? 'true' : 'false';
    } else {
      header.dataset.scrolled = window.scrollY > 60 ? 'true' : 'false';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // アンカーリンクのスムーズスクロール（ページ全体対象）
  // Lenis の scrollTo で遷移。未初期化時はブラウザデフォルトにフォールバック。
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash   = link.getAttribute('href');
    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();
    closeNav();

    if (window._lenis) {
      window._lenis.scrollTo(target, {
        offset:   -header.offsetHeight,
        duration: 1.2
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
