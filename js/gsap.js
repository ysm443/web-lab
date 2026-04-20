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

// DOMContentLoaded で呼ぶ（ScrollTrigger 非依存の即時処理）
function initGsap() {
  _initTypewriter(); // GSAP 非依存

  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  _initWorksReel();
  _setInitialStates(); // opacity: 0 で FOUC 防止
  _initHeroAnimation(); // ScrollTrigger 不使用
}

// window.load で呼ぶ（全画像読込後に正確な高さで ScrollTrigger を作成）
function initGsapScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  _initSectionHeads();
  _initWorksAnimation();
  _initOpacityFades();
  _initContactAnimation();
  _initWorkSectionsAnimation();
  _initBannerGallery();
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

  const GAP = 28; // CSS gap と一致（px）
  const INTERVAL = 3200; // 自動送り間隔（ms）

  // origSlides は <a>.works-reel__link（直接の子要素）を対象にする
  // → cloneNode(true) で <a> ごとクローンしリンクを保持させるため
  const origSlides = [...track.children];
  if (!origSlides.length) return;
  origSlides.forEach((link, i) => {
    const slide = link.querySelector('.works-reel__slide');
    if (slide) slide.style.setProperty('--slide-rot', i % 2 === 0 ? '2deg' : '-2deg');
  });

  // CSS の width を DOM から読み取る（SP 180px / PC 280px のレスポンシブ対応）
  const SLIDE_W = (origSlides[0]?.getBoundingClientRect().width ?? 280) + GAP;
  const SET_W = origSlides.length * SLIDE_W; // 1セット幅

  // 後ろにクローン追加
  origSlides.forEach((slide) => {
    const c = slide.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    track.appendChild(c);
  });
  // 前にクローン追加（逆順 insertBefore → 正順に並ぶ）
  [...origSlides].reverse().forEach((slide) => {
    const c = slide.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    track.insertBefore(c, track.firstChild);
  });
  // 結果: [pre-clone1..N][orig1..N][post-clone1..N]

  let offset = SET_W; // 中央オリジナルセットの先頭
  let rafId = null;
  let isDragging = false;
  let isPaused = false;
  let dragStartX = 0;
  let dragStartOff = 0;
  let prevDragX = 0;
  let prevDragTime = 0;
  let velX = 0; // px/ms（正 = 指が右方向 = offset 減少方向）
  let intervalId = null;
  let pointerDownX = 0; // ドラッグ判定用
  let didDrag = false;

  function applyTransform(o) {
    track.style.transform = `translateX(${-o}px)`;
  }

  // offset を orig 帯 [SET_W, 2×SET_W) に維持（瞬間テレポート）
  // N が偶数のとき 2.5×SET_W がスライド境界に重なり > 条件を素通りするため
  // post-clone ゾーン（≥ 2×SET_W）に入ったら即テレポートする方式に変更
  function rebalance() {
    if (offset < SET_W) {
      offset += SET_W;
      applyTransform(offset);
    } else if (offset >= 2 * SET_W) {
      offset -= SET_W;
      applyTransform(offset);
    }
  }

  // RAF ease-out アニメーション
  function animateTo(target, duration) {
    cancelAnimationFrame(rafId);
    const from = offset;
    const delta = target - from;
    if (Math.abs(delta) < 0.5) {
      rebalance();
      return;
    }
    const t0 = performance.now();

    function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
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
    const vel = now - prevDragTime < 100 ? velX : 0;
    const momentum = -vel * 100; // velX 正 = 右移動 = offset 減少
    const raw = offset + momentum;
    const snapped = Math.round(raw / SLIDE_W) * SLIDE_W;
    const dist = Math.abs(snapped - offset);
    const dur = Math.max(280, Math.min(600, dist * 1.2));
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
  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartOff = offset;
    prevDragX = e.clientX;
    prevDragTime = performance.now();
    velX = 0;
    pointerDownX = e.clientX;
    didDrag = false;
    cancelAnimationFrame(rafId);
    rafId = null;
    stopInterval();
    track.classList.add('is-dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = now - prevDragTime;
    if (dt > 0) velX = (e.clientX - prevDragX) / dt;
    prevDragX = e.clientX;
    prevDragTime = now;
    offset = dragStartOff + (dragStartX - e.clientX);
    applyTransform(offset);
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    didDrag = Math.abs(e.clientX - pointerDownX) > 5;
    isDragging = false;
    track.classList.remove('is-dragging');
    snapRelease();
    startInterval();
  });

  // ドラッグ後の click によるリンク誤発火を抑制
  track.addEventListener('click', (e) => {
    if (didDrag) {
      e.preventDefault();
      didDrag = false;
    }
  });

  // ── タッチ ──────────────────────────────────
  track.addEventListener(
    'touchstart',
    (e) => {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartOff = offset;
      prevDragX = e.touches[0].clientX;
      prevDragTime = performance.now();
      velX = 0;
      cancelAnimationFrame(rafId);
      rafId = null;
      stopInterval();
    },
    { passive: true }
  );

  track.addEventListener(
    'touchmove',
    (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = now - prevDragTime;
      if (dt > 0) velX = (e.touches[0].clientX - prevDragX) / dt;
      prevDragX = e.touches[0].clientX;
      prevDragTime = now;
      offset = dragStartOff + (dragStartX - e.touches[0].clientX);
      applyTransform(offset);
    },
    { passive: true }
  );

  track.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    snapRelease();
    startInterval();
  });

  // ── 横スクロール（トラックパッド水平スワイプ）──────────
  let wheelSnap = null;
  track.addEventListener(
    'wheel',
    (e) => {
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
    },
    { passive: false }
  );

  // ── ホバーで一時停止 ────────────────────────
  track.addEventListener('mouseenter', () => {
    isPaused = true;
  });
  track.addEventListener('mouseleave', () => {
    isPaused = false;
  });

  applyTransform(offset);
  startInterval();
}

/* ============================================================
   初期状態設定（FOUC防止）
   ※ set した要素には必ず fromTo を使う（to は使わない）
============================================================ */
function _setInitialStates() {
  gsap.set(['.section__head', '.works-item:not(.works-item--placeholder)', '.contact-form', '.contact-index'], {
    opacity: 0
  });

  // opacity only フェード対象
  gsap.set(
    ['.works-reel', '.works__footer', '.feature__grid', '.cta-section', '.banner-gallery__heading'],
    {
      opacity: 0
    }
  );

  // Hero CTA ボタン
  gsap.set('.hero__cta', { opacity: 0 });

  // banner figures（双方向 ScrollTrigger で制御）
  gsap.set('.banner-gallery__row figure', { opacity: 0, y: 40 });

  // Works 個別ページ要素
  gsap.set(
    [
      '.work-hero .inner',
      '.work-hero__line',
      '.work-pc',
      '.work-overview__side',
      '.work-screens__row',
      '.work-section__image',
      '.work-section__text'
    ],
    { opacity: 0 }
  );
}

/* ============================================================
   Hero 入場
============================================================ */
function _initHeroAnimation() {
  const heroEls = ['.hero__label', '.hero__name', '.hero__title', '.hero__copy', '.hero__cta'];
  const existing = heroEls.filter((s) => document.querySelector(s));
  if (!existing.length) return;

  const tl = gsap.timeline();

  // hero テキスト: t=0 開始、stagger 0.15 × 3 + 1.0 = 1.45s で最後の要素が完了
  tl.fromTo(
    existing,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 1.0, ease: 'back.out(1.2)', stagger: 0.15 },
    0
  );

  // Works Reel: 確認用 delay:2 + duration:4（動作確認済み）
  const reel = document.querySelector('.works-reel');
  if (reel) {
    tl.fromTo(reel, { opacity: 0 }, { opacity: 1, duration: 3, delay: 0.8, ease: 'power2.out' }, 0);
  }
}

/* ============================================================
   セクション見出し（共通）
============================================================ */
function _initSectionHeads() {
  gsap.utils.toArray('.section__head').forEach((el) => {
    gsap.fromTo(
      el,
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
   Opacity-only フェード
   .works-reel / .works__footer / .feature__grid / .cta-section
   banner-gallery > h2（sticky transform との競合回避で opacity のみ）
============================================================ */
function _initOpacityFades() {
  const selectors = ['.works__footer', '.feature__grid', '.cta-section'];

  selectors.forEach((selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 3,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // banner heading（transform: translateY(-50%) と y が競合するため opacity のみ）
  const heading = document.querySelector('.banner-gallery__heading');
  if (heading) {
    gsap.fromTo(
      heading,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}

/* ============================================================
   Works アイテム（TOP一覧 スタガー）
============================================================ */
function _initWorksAnimation() {
  const items = gsap.utils.toArray('.works-item:not(.works-item--placeholder)');
  if (!items.length) return;

  items.forEach((item, i) => {
    const isEven = i % 2 === 0;
    gsap.fromTo(
      item,
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
  if (form) {
    gsap.fromTo(
      form,
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

  const contactIndex = document.querySelector('.contact-index');
  if (contactIndex) {
    gsap.fromTo(
      contactIndex,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: contactIndex,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}

/* ============================================================
   Works 個別ページ — ヒーロー + 左右交互セクション
============================================================ */
function _initWorkSectionsAnimation() {
  // ページヒーロー（inner + 区切り線を同じタイミングで一括フェード）
  const workHeroInner = document.querySelector('.work-hero .inner');
  const heroLine = document.querySelector('.work-hero__line');
  const heroTargets = [workHeroInner, heroLine].filter(Boolean);
  if (heroTargets.length) {
    gsap.fromTo(
      heroTargets,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    );
  }

  // Work overview — PC画像 + 右カラム（同一トリガーで左右同時入場）
  const overviewGrid = document.querySelector('.work-overview__grid');
  if (overviewGrid) {
    const pc = document.querySelector('.work-pc');
    const side = document.querySelector('.work-overview__side');
    const screensRow = document.querySelector('.work-screens__row');

    if (pc) {
      gsap.fromTo(
        pc,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: overviewGrid,
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    if (side) {
      gsap.fromTo(
        side,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: overviewGrid,
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    if (screensRow) {
      gsap.fromTo(
        screensRow,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: screensRow,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  // 左右交互セクション
  gsap.utils.toArray('.work-section').forEach((section, i) => {
    const isEven = i % 2 === 0;
    const img = section.querySelector('.work-section__image');
    const text = section.querySelector('.work-section__text');

    if (img) {
      gsap.fromTo(
        img,
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
      gsap.fromTo(
        text,
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
      gsap.to(img, {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5
        }
      });
    }
  });
}

/* ============================================================
   Banner Gallery — スティッキー見出し + パララクス行 + フェードアップ
   ・figure: IntersectionObserver で .is-active 付与 → CSS フェードアップ
   ・row: Lenis scroll イベントで Y パララクス（PC のみ）
============================================================ */
function _initBannerGallery() {
  const section = document.querySelector('.banner-gallery');
  if (!section) return;

  // figure 双方向フェード（ScrollTrigger 4コールバック）
  // 上下どちらからスクロールしても出入りする
  const figures = section.querySelectorAll('.banner-gallery__row figure');
  figures.forEach((fig) => {
    ScrollTrigger.create({
      trigger: fig,
      start: 'top 90%',
      end: 'bottom 10%',
      onEnter: () =>
        gsap.fromTo(
          fig,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', overwrite: true }
        ),
      onLeave: () =>
        gsap.fromTo(
          fig,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -40, duration: 0.5, ease: 'power2.in', overwrite: true }
        ),
      onEnterBack: () =>
        gsap.fromTo(
          fig,
          { opacity: 0, y: -40 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', overwrite: true }
        ),
      onLeaveBack: () =>
        gsap.fromTo(
          fig,
          { opacity: 1, y: 0 },
          { opacity: 0, y: 40, duration: 0.5, ease: 'power2.in', overwrite: true }
        )
    });
  });

  // SP はパララクスなし
  if (window.innerWidth < 768) return;

  const rows = section.querySelectorAll('.banner-gallery__row[data-parallax]');
  if (!rows.length) return;

  // 各行の初期中心 Y を記録
  const rowData = Array.from(rows).map((row) => {
    const rect = row.getBoundingClientRect();
    return {
      el: row,
      speed: parseFloat(row.dataset.parallax),
      centerY: rect.top + window.scrollY + rect.height / 2
    };
  });

  function update(scrollY) {
    rowData.forEach(({ el, speed, centerY }) => {
      const delta = scrollY + window.innerHeight / 2 - centerY;
      gsap.set(el, { y: delta * speed });
    });
  }

  if (window._lenis) {
    window._lenis.on('scroll', ({ scroll }) => update(scroll));
  } else {
    window.addEventListener('scroll', () => update(window.scrollY), { passive: true });
  }

  update(window.scrollY);
}

/* ============================================================
   Header Typewriter
   walkal.one 準拠: typeSpeed:50 / backSpeed:20 / backDelay:2000 / loop
============================================================ */
function _initTypewriter() {
  const textEl = document.querySelector('.header__message__text');
  if (!textEl) return;

  const phrases = [
    'Web Designer',
    'Frontend Developer',
    'Composer',
    'AI-driven Developer',
    'UI Designer'
  ];
  const TYPE_SPEED = 50; // ms / char
  const BACK_SPEED = 20; // ms / char（削除）
  const BACK_DELAY = 2000; // ms（完全表示後の待機）
  const NEXT_DELAY = 300; // ms（全削除後の待機）

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (!isDeleting) {
      charIdx++;
      textEl.textContent = phrase.slice(0, charIdx);

      if (charIdx === phrase.length) {
        setTimeout(() => {
          isDeleting = true;
          tick();
        }, BACK_DELAY);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      charIdx--;
      textEl.textContent = phrase.slice(0, charIdx);

      if (charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, NEXT_DELAY);
        return;
      }
      setTimeout(tick, BACK_SPEED);
    }
  }

  tick();
}
