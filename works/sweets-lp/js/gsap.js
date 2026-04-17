/* ============================================================
   gsap.js — GSAPアニメーション
   ・Lenis スムーズスクロール（ScrollTriggerと同期）
   ・Hero 入場
   ・[data-animate]      スクロール連動フェードイン（下から）
   ・[data-animate-x]    スクロール連動スライドイン（左右）
   ・[data-animate-load] ページロード時フェードイン（logo-sec用）
   ・[data-stagger]      子要素のスタガー入場
   ・[data-count]        数値カウントアップ
   ・LP専用: sticky offset / crossfade slider / header state / page-top
============================================================ */

// Lenis インスタンス（_initPageTop のスクロールで参照）
let _lenis;

function initGsap() {
  if (typeof gsap === 'undefined') return;

  // 使うプラグインだけ登録する（未読み込みのものは自動スキップ）
  const plugins = [ScrollTrigger];
  if (typeof SplitText          !== 'undefined') plugins.push(SplitText);
  if (typeof DrawSVGPlugin      !== 'undefined') plugins.push(DrawSVGPlugin);
  if (typeof MotionPathPlugin   !== 'undefined') plugins.push(MotionPathPlugin);
  if (typeof Flip               !== 'undefined') plugins.push(Flip);
  if (typeof ScrambleTextPlugin !== 'undefined') plugins.push(ScrambleTextPlugin);
  if (typeof CustomEase         !== 'undefined') plugins.push(CustomEase);
  gsap.registerPlugin(...plugins);

  _initLenis();
  _initStickyOffset();
  _initSlider();
  _initLogoFadeIn();
  _initHeaderState();
  _initHeroAnimation();
  _initScrollAnimations();
  _initSlideAnimations();
  _initStaggerAnimations();
  _initCountUp();
  _initPageTop();
}


/* ----------------------------------------------------------
   Lenis スムーズスクロール
   Lenis の RAF を GSAP ticker に委譲し、ScrollTrigger と同期する。
   lenis.min.js が読み込まれていない場合はスキップ（通常スクロールで動作）。
---------------------------------------------------------- */
function _initLenis() {
  if (typeof Lenis === 'undefined') return;

  _lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  // nav.js のアンカースクロールから参照できるよう window に露出
  window._lenis = _lenis;

  _lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    _lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}


/* ----------------------------------------------------------
   LP: Sticky Offset
   .over-wrapper の margin-top を -(innerHeight) に設定して
   メインビジュアル上にコンテンツが覆いかぶさる演出を作る。
   リサイズ時も追従。
---------------------------------------------------------- */
function _initStickyOffset() {
  const overWrapper = document.querySelector('.over-wrapper');
  if (!overWrapper) return;

  function calc() {
    // CSS は 100dvh を使用。JS は innerHeight で近似（dvh との差は無視できる範囲）
    overWrapper.style.marginTop = `-${window.innerHeight}px`;
  }

  calc();
  window.addEventListener('resize', calc);
}


/* ----------------------------------------------------------
   LP: Crossfade Slider
   .main-visual__slide を GSAP timeline で自動切替（crossfade）。
   scrub は使わない。
---------------------------------------------------------- */
function _initSlider() {
  const slides = gsap.utils.toArray('.main-visual__slide');
  if (slides.length < 2) return;

  const HOLD  = 3.5;  // 各スライドの表示時間（秒）
  const CROSS = 1.5;  // クロスフェード時間（秒）

  // 初期状態: 1枚目のみ表示
  gsap.set(slides, { autoAlpha: 0 });
  gsap.set(slides[0], { autoAlpha: 1 });

  const tl = gsap.timeline({ repeat: -1 });

  slides.forEach((curr, i) => {
    const next = slides[(i + 1) % slides.length];
    tl.to(next, { autoAlpha: 1, duration: CROSS, ease: 'power1.inOut' }, `+=${HOLD}`)
      .to(curr, { autoAlpha: 0, duration: CROSS, ease: 'power1.inOut' }, '<');
  });
}


/* ----------------------------------------------------------
   LP: Logo Fade-In (ページロード時)
   [data-animate-load] 要素をページ読み込み直後にフェードイン。
   _initScrollAnimations の対象から除外するため別属性を使用。
---------------------------------------------------------- */
function _initLogoFadeIn() {
  const targets = document.querySelectorAll('[data-animate-load]');
  if (!targets.length) return;

  gsap.fromTo(targets,
    { autoAlpha: 0 },
    {
      autoAlpha: 1,
      duration:  2.5,
      ease:      'power1.inOut',
      stagger:   0.9,
      delay:     0.4,
    }
  );
}


/* ----------------------------------------------------------
   LP: Header State
   .over-wrapper がヘッダー位置に達したら .is-over を付与。
   ロゴ・SNSアイコンの色をスライダー上（白）→コンテンツ上（茶）に切替。
---------------------------------------------------------- */
function _initHeaderState() {
  const header = document.querySelector('.header');
  const overWrapper = document.querySelector('.over-wrapper');
  if (!header || !overWrapper) return;

  ScrollTrigger.create({
    trigger:    overWrapper,
    start:      'top 80px',
    onEnter:    () => header.classList.add('is-over'),
    onLeaveBack: () => header.classList.remove('is-over'),
  });
}


/* ----------------------------------------------------------
   LP: Page Top Button
   スクロール量が一定を超えたら表示。クリックで最上部へ。
---------------------------------------------------------- */
function _initPageTop() {
  const btn = document.querySelector('.page-top');
  if (!btn) return;

  gsap.set(btn, { autoAlpha: 0 });

  ScrollTrigger.create({
    start: '200px top',
    onEnter:     () => gsap.to(btn, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }),
    onLeaveBack: () => gsap.to(btn, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }),
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (_lenis) {
      _lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}


/* ----------------------------------------------------------
   Hero 入場アニメーション
   gsap.from は「現在のCSS値」を終点にするため、
   [data-animate]{opacity:0} と競合して 0→0 になる。
   fromTo で opacity:1 を明示する。
---------------------------------------------------------- */
function _initHeroAnimation() {
  const heroEls = document.querySelectorAll('.hero [data-animate]');
  if (!heroEls.length) return;

  const tl = gsap.timeline({ delay: 0.15 });

  heroEls.forEach((el, i) => {
    tl.fromTo(el,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      i === 0 ? 0 : '-=0.5'
    );
  });
}


/* ----------------------------------------------------------
   スクロール連動フェードイン（[data-animate]）
   Hero内は除外（_initHeroAnimationで処理）
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
   セクション見出し・テキスト・ビジュアルの左右交互演出に使う
---------------------------------------------------------- */
function _initSlideAnimations() {
  gsap.utils.toArray('[data-animate-x]').forEach(el => {
    const dir = parseFloat(el.dataset.animateX) || -1;
    gsap.fromTo(el,
      { opacity: 0, x: dir * 60 },
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
   カードグリッド・リストを順番にフェードイン
---------------------------------------------------------- */
function _initStaggerAnimations() {
  gsap.utils.toArray('[data-stagger]').forEach(container => {
    const children = container.children;
    if (!children.length) return;
    gsap.fromTo(children,
      { opacity: 0, y: 24 },
      {
        opacity:  1,
        y:        0,
        duration: 0.7,
        ease:     'power2.out',
        stagger:  0.1,
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
   例: <span data-count="92">0</span>
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
