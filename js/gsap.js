/* ============================================================
   gsap.js — アニメーション（Lenis + GSAP ScrollTrigger）

   初期化順序:
   1. Lenis スムーズスクロール
   2. Works Reel（インターバル離散スライド）
   3. 初期状態設定（FOUC防止）
   4. Hero 入場アニメーション
   5. セクション見出し
   6. Works カード（スタガー）
   7. About（左右フェード）
   8. Works 個別ページ（左右交互フェード）
============================================================ */

function initGsap() {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  _initWorksReel();
  _setInitialStates();
  _initHeroAnimation();
  _initSectionHeads();
  _initWorksAnimation();
  _initContactAnimation();
  _initWorkSectionsAnimation();
}

/* ============================================================
   Works Reel — 前後クローン3セット構成 + RAF モーメンタムスナップ
   ・track: [pre-clones][orig][post-clones] の3セット
   ・offset = SET_W でスタート（中央オリジナルセットを表示）
   ・RAF でアニメーション、ease-out cubic
   ・ドラッグ: 速度計測 → 離し時にモーメンタム付きスナップ
   ・rebalance: アニメーション完了後に offset を中央帯に保つ
============================================================ */
function _initWorksReel() {
  const track = document.getElementById('worksReelTrack');
  if (!track) return;

  const GAP      = 28;        // CSS gap と一致（px）
  const SLIDE_W  = 280 + GAP; // .works-reel__slide の width + gap = 308px
  const INTERVAL = 3200;      // 自動送り間隔（ms）

  // origSlides は <a>.works-reel__link（直接の子要素）を対象にする
  // → cloneNode(true) で <a> ごとクローンしリンクを保持させるため
  const origSlides = [...track.children];
  if (!origSlides.length) return;
  origSlides.forEach((link, i) => {
    const slide = link.querySelector('.works-reel__slide');
    if (slide) slide.style.setProperty('--slide-rot', i % 2 === 0 ? '2deg' : '-2deg');
  });

  const SET_W = origSlides.length * SLIDE_W; // 1セット幅

  // 後ろにクローン追加
  origSlides.forEach(slide => {
    const c = slide.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    track.appendChild(c);
  });
  // 前にクローン追加（逆順 insertBefore → 正順に並ぶ）
  [...origSlides].reverse().forEach(slide => {
    const c = slide.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    track.insertBefore(c, track.firstChild);
  });
  // 結果: [pre-clone1..N][orig1..N][post-clone1..N]

  let offset       = SET_W;  // 中央オリジナルセットの先頭
  let rafId        = null;
  let isDragging   = false;
  let isPaused     = false;
  let dragStartX   = 0;
  let dragStartOff = 0;
  let prevDragX    = 0;
  let prevDragTime = 0;
  let velX         = 0;      // px/ms（正 = 指が右方向 = offset 減少方向）
  let intervalId   = null;
  let pointerDownX = 0;      // ドラッグ判定用
  let didDrag      = false;

  function applyTransform(o) {
    track.style.transform = `translateX(${-o}px)`;
  }

  // offset を中央帯 [0.5×SET_W, 2.5×SET_W] に維持（瞬間テレポート）
  function rebalance() {
    if (offset < SET_W * 0.5)  { offset += SET_W; applyTransform(offset); }
    if (offset > SET_W * 2.5)  { offset -= SET_W; applyTransform(offset); }
  }

  // RAF ease-out アニメーション
  function animateTo(target, duration) {
    cancelAnimationFrame(rafId);
    const from  = offset;
    const delta = target - from;
    if (Math.abs(delta) < 0.5) { rebalance(); return; }
    const t0 = performance.now();

    function tick(now) {
      const p    = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      offset = from + delta * ease;
      applyTransform(offset);
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        offset = target;
        applyTransform(target);
        rebalance();
        rafId = null;
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  // 1枚自動送り
  function advance() {
    animateTo(offset + SLIDE_W, 650);
  }

  // ドラッグ離し → モーメンタム付きスナップ
  function snapRelease() {
    const now = performance.now();
    // 直近 100ms 以内の速度のみ有効
    const vel     = (now - prevDragTime) < 100 ? velX : 0;
    const momentum = -vel * 100; // velX 正 = 右移動 = offset 減少
    const raw     = offset + momentum;
    const snapped = Math.round(raw / SLIDE_W) * SLIDE_W;
    const dist    = Math.abs(snapped - offset);
    const dur     = Math.max(280, Math.min(600, dist * 1.2));
    animateTo(snapped, dur);
  }

  // ── インターバル ────────────────────────────
  function startInterval() {
    stopInterval();
    intervalId = setInterval(() => {
      // アニメーション中・ドラッグ中・ホバー中は送らない
      if (!isDragging && !isPaused && rafId === null) advance();
    }, INTERVAL);
  }
  function stopInterval() {
    clearInterval(intervalId);
    intervalId = null;
  }

  // ── マウスドラッグ ──────────────────────────
  track.addEventListener('mousedown', e => {
    isDragging   = true;
    dragStartX   = e.clientX;
    dragStartOff = offset;
    prevDragX    = e.clientX;
    prevDragTime = performance.now();
    velX         = 0;
    pointerDownX = e.clientX;
    didDrag      = false;
    cancelAnimationFrame(rafId);
    rafId = null;
    stopInterval();
    track.classList.add('is-dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const now = performance.now();
    const dt  = now - prevDragTime;
    if (dt > 0) velX = (e.clientX - prevDragX) / dt;
    prevDragX    = e.clientX;
    prevDragTime = now;
    offset = dragStartOff + (dragStartX - e.clientX);
    applyTransform(offset);
  });

  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    didDrag    = Math.abs(e.clientX - pointerDownX) > 5;
    isDragging = false;
    track.classList.remove('is-dragging');
    snapRelease();
    startInterval();
  });

  // ドラッグ後の click によるリンク誤発火を抑制
  track.addEventListener('click', e => {
    if (didDrag) {
      e.preventDefault();
      didDrag = false;
    }
  });

  // ── タッチ ──────────────────────────────────
  track.addEventListener('touchstart', e => {
    isDragging   = true;
    dragStartX   = e.touches[0].clientX;
    dragStartOff = offset;
    prevDragX    = e.touches[0].clientX;
    prevDragTime = performance.now();
    velX         = 0;
    cancelAnimationFrame(rafId);
    rafId = null;
    stopInterval();
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const now = performance.now();
    const dt  = now - prevDragTime;
    if (dt > 0) velX = (e.touches[0].clientX - prevDragX) / dt;
    prevDragX    = e.touches[0].clientX;
    prevDragTime = now;
    offset = dragStartOff + (dragStartX - e.touches[0].clientX);
    applyTransform(offset);
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    snapRelease();
    startInterval();
  });

  // ── 横スクロール（トラックパッド水平スワイプ）──────────
  let wheelSnap = null;
  track.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // 縦スクロールは無視
    e.preventDefault();
    stopInterval();
    cancelAnimationFrame(rafId);
    rafId = null;
    offset += e.deltaX;
    rebalance();
    applyTransform(offset);
    clearTimeout(wheelSnap);
    wheelSnap = setTimeout(() => {
      const snapped = Math.round(offset / SLIDE_W) * SLIDE_W;
      animateTo(snapped, 350);
      startInterval();
    }, 150);
  }, { passive: false });

  // ── ホバーで一時停止 ────────────────────────
  track.addEventListener('mouseenter', () => { isPaused = true;  });
  track.addEventListener('mouseleave', () => { isPaused = false; });

  applyTransform(offset);
  startInterval();
}


/* ============================================================
   初期状態設定（FOUC防止）
   ※ set した要素には必ず fromTo を使う（to は使わない）
============================================================ */
function _setInitialStates() {
  gsap.set([
    '.section__head',
    '.works-item:not(.works-item--placeholder)',
    '.contact-form'
  ], { opacity: 0 });

  // Works 個別ページ要素
  gsap.set([
    '.work-hero__tags',
    '.work-hero__title',
    '.work-hero__sub',
    '.work-hero__link',
    '.work-section__image',
    '.work-section__text'
  ], { opacity: 0 });
}

/* ============================================================
   Hero 入場
============================================================ */
function _initHeroAnimation() {
  const heroEls = ['.hero__label', '.hero__name', '.hero__title', '.hero__copy'];
  const existing = heroEls.filter(s => document.querySelector(s));
  if (!existing.length) return;

  gsap.from(existing, {
    opacity: 0,
    y: 28,
    duration: 1.0,
    ease: 'back.out(1.2)',
    stagger: 0.15
  });
}

/* ============================================================
   セクション見出し（共通）
============================================================ */
function _initSectionHeads() {
  gsap.utils.toArray('.section__head').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}

/* ============================================================
   Works アイテム（TOP一覧 スタガー）
============================================================ */
function _initWorksAnimation() {
  const items = gsap.utils.toArray('.works-item:not(.works-item--placeholder)');
  if (!items.length) return;

  items.forEach((item, i) => {
    const isEven = i % 2 === 0;
    gsap.fromTo(item,
      { opacity: 0, x: isEven ? -24 : 24 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}


/* ============================================================
   Contact フォームフェードイン
============================================================ */
function _initContactAnimation() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  gsap.fromTo(form,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: form,
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    }
  );
}

/* ============================================================
   Works 個別ページ — ヒーロー + 左右交互セクション
============================================================ */
function _initWorkSectionsAnimation() {

  // ページヒーロー要素
  const workHeroEls = [
    '.work-hero__tags',
    '.work-hero__title',
    '.work-hero__sub',
    '.work-hero__link'
  ].filter(s => document.querySelector(s));

  if (workHeroEls.length) {
    gsap.fromTo(workHeroEls,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'back.out(1.2)',
        stagger: 0.12
      }
    );
  }

  // 左右交互セクション
  gsap.utils.toArray('.work-section').forEach((section, i) => {
    const isEven = i % 2 === 0;
    const img  = section.querySelector('.work-section__image');
    const text = section.querySelector('.work-section__text');

    if (img) {
      gsap.fromTo(img,
        { opacity: 0, x: isEven ? -24 : 24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
    if (text) {
      gsap.fromTo(text,
        { opacity: 0, x: isEven ? 24 : -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          delay: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // SS パララックス
    if (img) {
      gsap.to(img,
        {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5
          }
        }
      );
    }
  });
}
