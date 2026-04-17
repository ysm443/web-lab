/* ============================================================
   gsap.js — GSAPアニメーション
   ・Lenis スムーズスクロール（ScrollTriggerと同期）
   ・Hero 入場
   ・[data-animate]   スクロール連動フェードイン（下から）
   ・[data-animate-x] スクロール連動スライドイン（左右）
   ・[data-stagger]   子要素のスタガー入場
   ・[data-count]     数値カウントアップ
   ・_initParallax    Story写真のパララックス
   ・_initMenuTabs    メニューカテゴリ切替
   ・_initReserveFloat フローティング予約ボタン
============================================================ */

function initGsap() {
  if (typeof gsap === 'undefined') return;

  const plugins = [ScrollTrigger];
  if (typeof SplitText          !== 'undefined') plugins.push(SplitText);
  if (typeof DrawSVGPlugin      !== 'undefined') plugins.push(DrawSVGPlugin);
  if (typeof MotionPathPlugin   !== 'undefined') plugins.push(MotionPathPlugin);
  if (typeof Flip               !== 'undefined') plugins.push(Flip);
  if (typeof ScrambleTextPlugin !== 'undefined') plugins.push(ScrambleTextPlugin);
  if (typeof CustomEase         !== 'undefined') plugins.push(CustomEase);
  gsap.registerPlugin(...plugins);

  _initLenis();
  _initHeroAnimation();
  _initScrollAnimations();
  _initSlideAnimations();
  _initStaggerAnimations();
  _initCountUp();
  _initParallax();
  _initMenuTabs();
  _initReserveFloat();
}


/* ----------------------------------------------------------
   Lenis スムーズスクロール
---------------------------------------------------------- */
function _initLenis() {
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration:        1.1,
    easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation:     'vertical',
    smoothWheel:     true,
    touchMultiplier: 1.5
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // history.scrollRestoration = 'manual' のため、スクロール位置を手動で復元する
  const savedY = sessionStorage.getItem('scrollY');
  if (savedY) {
    lenis.scrollTo(parseFloat(savedY), { immediate: true });
    sessionStorage.removeItem('scrollY');
  }
  // フラッシュ防止で非表示にしていた場合は復元後に表示
  document.documentElement.style.visibility = '';

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollY', lenis.actualScroll);
  });

  window._lenis = lenis;
}


/* ----------------------------------------------------------
   Hero 入場アニメーション
   fromTo で opacity:1 を明示（[data-animate]{opacity:0} との競合回避）
---------------------------------------------------------- */
function _initHeroAnimation() {
  const eyebrow = document.querySelector('.hero__eyebrow');
  const title   = document.querySelector('.hero__title');
  const lead    = document.querySelector('.hero__lead');
  const cta     = document.querySelector('.hero__cta');
  if (!title) return;

  const tl = gsap.timeline({ delay: 0.15 });

  // Group 1: eyebrow
  tl.fromTo(eyebrow,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
    0
  );

  // Group 2: title
  tl.fromTo(title,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' },
    0.4
  );

  // Group 3: lead + cta — 同時
  tl.fromTo(
    [lead, cta].filter(Boolean),
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' },
    0.9
  );

  // スクロールインジケーター: ヒーロー半分過ぎたらフェードアウト
  const indicator = document.querySelector('.hero__scroll-indicator');
  if (indicator) {
    ScrollTrigger.create({
      trigger:     '.hero--food',
      start:       'center top',
      onEnter:     () => gsap.to(indicator, { opacity: 0, duration: 0.4 }),
      onLeaveBack: () => gsap.to(indicator, { opacity: 1, duration: 0.4 })
    });
  }
}


/* ----------------------------------------------------------
   スクロール連動フェードイン（[data-animate]）
   Hero内は除外
---------------------------------------------------------- */
function _initScrollAnimations() {
  gsap.utils.toArray('[data-animate]').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el,
      { opacity: 0, y: 32 },
      {
        opacity:  1,
        y:        0,
        duration: 0.9,
        ease:     'power2.out',
        scrollTrigger: {
          trigger:       el,
          start:         'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}


/* ----------------------------------------------------------
   左右スライドイン（[data-animate-x]）
   data-animate-x="-1": 左から / data-animate-x="1": 右から
---------------------------------------------------------- */
function _initSlideAnimations() {
  gsap.utils.toArray('[data-animate-x]').forEach(el => {
    const dir = parseFloat(el.dataset.animateX) || -1;
    gsap.fromTo(el,
      { opacity: 0, x: dir * 48 },
      {
        opacity:  1,
        x:        0,
        duration: 0.9,
        ease:     'power2.out',
        scrollTrigger: {
          trigger:       el,
          start:         'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}


/* ----------------------------------------------------------
   子要素スタガー入場（[data-stagger]）
   メニューカードなどのグリッドに使用
---------------------------------------------------------- */
function _initStaggerAnimations() {
  gsap.utils.toArray('[data-stagger]').forEach(container => {
    if (container.closest('.menu')) return; // メニューはタブ切替で制御
    const children = Array.from(container.children).filter(c => c.style.display !== 'none');
    if (!children.length) return;
    gsap.fromTo(children,
      { opacity: 0, y: 20 },
      {
        opacity:  1,
        y:        0,
        duration: 0.7,
        ease:     'power2.out',
        stagger:  0.08,
        scrollTrigger: {
          trigger:       container,
          start:         'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}


/* ----------------------------------------------------------
   数値カウントアップ（[data-count="数値"]）
---------------------------------------------------------- */
function _initCountUp() {
  gsap.utils.toArray('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    gsap.fromTo(el,
      { innerText: 0 },
      {
        innerText: target,
        duration:  1.8,
        ease:      'power1.out',
        snap:      { innerText: target < 10 ? 0.1 : 1 },
        scrollTrigger: {
          trigger:       el,
          start:         'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}


/* ----------------------------------------------------------
   Story 料理写真のパララックス
   CSS で [data-animate-x] が opacity:0 のため、
   パララックスは別要素（.story__photo-wrap）に適用する
---------------------------------------------------------- */
function _initParallax() {
  const photoWrap = document.querySelector('.story__photo-wrap');
  if (!photoWrap) return;

  gsap.to(photoWrap, {
    yPercent: -8,
    ease:     'none',
    scrollTrigger: {
      trigger: '.story',
      start:   'top bottom',
      end:     'bottom top',
      scrub:   0.5
    }
  });
}


/* ----------------------------------------------------------
   メニューカテゴリタブ切替
   WAI-ARIA tablist パターン準拠
   タブ切替時にスタガーアニメーションを再実行する
---------------------------------------------------------- */
function _initMenuTabs() {
  const tabs   = document.querySelectorAll('.menu__tab');
  const panels = document.querySelectorAll('.menu__panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');

      // タブの状態更新
      tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.classList.remove('is-active');
      });
      tab.setAttribute('aria-selected', 'true');
      tab.classList.add('is-active');

      // パネルの表示切替
      panels.forEach(panel => {
        if (panel.id === targetId) {
          panel.removeAttribute('hidden');
          panel.classList.add('is-active');

        } else {
          panel.setAttribute('hidden', '');
          panel.classList.remove('is-active');
        }
      });
    });
  });
}


/* ----------------------------------------------------------
   フローティング予約ボタン
   ヒーローが画面外に出たら表示
   Reserve セクションが見えたら非表示
---------------------------------------------------------- */
function _initReserveFloat() {
  const btn     = document.getElementById('reserveFloat');
  const reserve = document.getElementById('reserve');
  if (!btn) return;

  // ヒーロー後に表示
  ScrollTrigger.create({
    trigger:     '.hero--food',
    start:       'bottom 80%',
    onEnter:     () => btn.classList.add('is-visible'),
    onLeaveBack: () => btn.classList.remove('is-visible')
  });

  // Reserve セクションに入ったら隠す
  if (reserve) {
    ScrollTrigger.create({
      trigger:     reserve,
      start:       'top 80%',
      onEnter:     () => btn.classList.add('is-hidden'),
      onLeaveBack: () => btn.classList.remove('is-hidden')
    });
  }
}
