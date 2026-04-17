/* ============================================================
   gsap.js — LUMINOUS MUSIC FES
   ・ナビゲーション（ハンバーガー + アンカースクロール）
   ・[data-animate] スクロールフェードイン
   ・Swiper 初期化
   ・YouTube モーダル
   ・アーティスト・タイムテーブルタブ切り替え
   ・アコーディオン
============================================================ */

function initGsap() {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  _initStickyNav();
  _initNav();
  _initScrollAnimations();
  _initSwiper();
  _initModalVideo();
  _initArtistTabs();
  _initTimetableTabs();
  _initAccordion();
}


/* ----------------------------------------------------------
   スティッキーナビ
   GSAP pin は Lenis のホイールイベントと競合するため使用しない。
   Lenis の scroll イベントで自前 sticky を実装する。
---------------------------------------------------------- */
function _initStickyNav() {
  const nav = document.querySelector('.sticky-nav-wrap');
  if (!nav) return;
  if (window.innerWidth <= 768) return; // SPは.sticky-navがdisplay:none済み

  const threshold = nav.offsetTop; // FV直下の位置（≈720px）

  // navが固定化したときに高さを保持するプレースホルダー
  const ph = document.createElement('div');
  ph.setAttribute('aria-hidden', 'true');
  ph.style.height = nav.offsetHeight + 'px';
  ph.hidden = true;
  nav.parentNode.insertBefore(ph, nav.nextSibling);

  window.addEventListener('scroll', () => {
    const shouldStick = window.scrollY >= threshold;
    if (shouldStick === nav.classList.contains('is-stuck')) return;

    nav.classList.toggle('is-stuck', shouldStick);
    ph.hidden = !shouldStick;
  }, { passive: true });
}


/* ----------------------------------------------------------
   ナビゲーション
   ・ハンバーガー開閉
   ・アンカーリンクのスムーズスクロール
   ・ESCキーで閉じる
---------------------------------------------------------- */
function _initNav() {
  const menuBtn   = document.getElementById('menuBtn');
  const globalNav = document.getElementById('globalNav');
  if (!menuBtn || !globalNav) return;

  function closeNav() {
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'メニューを開く');
    globalNav.dataset.open = 'false';
    globalNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ハンバーガー開閉
  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    const next   = !isOpen;
    menuBtn.setAttribute('aria-expanded', String(next));
    menuBtn.setAttribute('aria-label', next ? 'メニューを閉じる' : 'メニューを開く');
    globalNav.dataset.open = String(next);
    globalNav.setAttribute('aria-hidden', String(!next));
    document.body.style.overflow = next ? 'hidden' : '';
  });

  // ESCキーで閉じる
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') closeNav();
  });

  // アンカーリンク → スムーズスクロール + ナビを閉じる
  document.addEventListener('click', e => {
    const link = e.target.closest('a.nav-link, a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '#x') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const stickyNav = document.querySelector('.sticky-nav-wrap');
    const offset    = stickyNav ? -stickyNav.offsetHeight : 0;

    target.scrollIntoView({ behavior: 'smooth' });

    closeNav();
  });
}


/* ----------------------------------------------------------
   [data-animate] スクロールフェードイン
---------------------------------------------------------- */
function _initScrollAnimations() {
  gsap.utils.toArray('[data-animate]').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity:  1,
        y:        0,
        duration: 0.9,
        ease:     'power2.out',
        scrollTrigger: {
          trigger:       el,
          start:         'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}


/* ----------------------------------------------------------
   Swiper 初期化
---------------------------------------------------------- */
function _initSwiper() {
  if (typeof Swiper === 'undefined') return;

  // FV スライダー
  new Swiper('#swiper1', {
    slidesPerView:       1,
    spaceBetween:        0,
    centeredSlides:      true,
    loop:                true,
    loopAdditionalSlides: 1,
    speed:               1200,
    autoplay: {
      delay:                5000,
      disableOnInteraction: false,
      waitForTransition:    false,
    },
    pagination: {
      el:        '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });

  // 動画サムネイルスライダー
  new Swiper('#swiper2', {
    slidesPerView:  2.2,
    spaceBetween:   20,
    centeredSlides: true,
    loop:           true,
    grabCursor:     true,
    speed:          1200,
    autoplay: {
      delay:                5000,
      disableOnInteraction: false,
      waitForTransition:    false,
    },
    breakpoints: {
      0:    { slidesPerView: 1.4, spaceBetween: 5 },
      768:  { slidesPerView: 2.2, spaceBetween: 10 },
      1024: { slidesPerView: 2.2, spaceBetween: 20 },
    },
  });
}


/* ----------------------------------------------------------
   YouTube モーダル
---------------------------------------------------------- */
function _initModalVideo() {
  function openModal(videoId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-inner" role="dialog" aria-modal="true" aria-label="YouTube動画">
        <button class="modal-close" aria-label="動画を閉じる">&times;</button>
        <div class="modal-video-wrap">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
            allow="autoplay; encrypted-media"
            allowfullscreen
            title="YouTube動画"
          ></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    _trapFocus(overlay.querySelector('.modal-inner'));

    const close = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };

    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
  }

  // サムネ経由でモーダルを開く（.play-btn クリック）
  document.querySelectorAll('.play-btn').forEach(btn => {
    const modalTrigger = btn.closest('figure')?.querySelector('.js-modal-btn');
    if (modalTrigger) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        modalTrigger.click();
      });
    }
  });

  // .js-modal-btn 直クリック
  document.querySelectorAll('.js-modal-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const videoId = btn.dataset.videoId;
      if (videoId) openModal(videoId);
    });
  });
}


/* ----------------------------------------------------------
   アーティストタブ切り替え
---------------------------------------------------------- */
function _initArtistTabs() {
  document.querySelectorAll('.artist-tabs-ab a, .artist-tabs-cd a').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();

      // アクティブ切り替え
      tab.closest('.stage-tabs').querySelectorAll('a').forEach(a => a.classList.remove('is-active'));
      tab.classList.add('is-active');

      const targetId     = tab.dataset.target;
      const contentGroup = document.getElementById(targetId)?.closest('.artist-lists');
      if (!contentGroup) return;

      contentGroup.querySelectorAll('ol').forEach(ol => ol.classList.add('hide'));
      document.getElementById(targetId)?.classList.remove('hide');
    });
  });
}


/* ----------------------------------------------------------
   タイムテーブルタブ切り替え
---------------------------------------------------------- */
function _initTimetableTabs() {
  document.querySelectorAll('.tt-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();

      tab.closest('.tt-tabs').querySelectorAll('a').forEach(a => a.classList.remove('is-active'));
      tab.classList.add('is-active');

      const targetId     = tab.dataset.target;
      const contentGroup = document.getElementById(targetId)?.closest('.tt-lists');
      if (!contentGroup) return;

      Array.from(contentGroup.children).forEach(child => child.classList.add('hide'));
      document.getElementById(targetId)?.classList.remove('hide');
    });
  });
}


/* ----------------------------------------------------------
   アコーディオン
---------------------------------------------------------- */
function _initAccordion() {
  document.querySelectorAll('.accordion').forEach((acc, i) => {
    const panelId = `accordion-panel-${i}`;
    const panel   = acc.nextElementSibling;
    if (panel) panel.id = panelId;
    acc.setAttribute('aria-expanded', 'false');
    acc.setAttribute('aria-controls', panelId);

    acc.addEventListener('click', function () {
      const isOpen = this.classList.toggle('active');
      this.setAttribute('aria-expanded', String(isOpen));
      panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : null;

      if (isOpen) {
        // transition完了後、パネル下端がviewportに収まるぶんだけスクロール
        panel.addEventListener('transitionend', function handler(e) {
          if (e.propertyName !== 'max-height') return;
          panel.removeEventListener('transitionend', handler);

          const bottom   = panel.getBoundingClientRect().bottom;
          const overflow = bottom - (window.innerHeight - 40); // 40px余白
          if (overflow > 0) {
            window.scrollBy({ top: overflow, behavior: 'smooth' });
          }
        });
      }
    });
  });
}
