/* ============================================================
   gsap.js — GSAPアニメーション
   ・Lenis スムーズスクロール（ScrollTriggerと同期）
   ・Hero 入場
   ・[data-animate]   スクロール連動フェードイン（下から）
   ・[data-animate-x] スクロール連動スライドイン（左右交互）
   ・[data-stagger]   子要素のスタガー入場
   ・[data-count]     数値カウントアップ
============================================================ */

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

  _initHeroAnimation();
  _initScrollAnimations();
  _initSlideAnimations();
  _initFadeAnimations();
  _initStaggerAnimations();
  _initCountUp();
  _initScrollText();
  _initSwiper();
}


/* ----------------------------------------------------------
   Hero 入場アニメーション
   gsap.from は「現在のCSS値」を終点にするため、
   [data-animate]{opacity:0} と競合して 0→0 になる。
   fromTo で opacity:1 を明示する。
---------------------------------------------------------- */
function _initHeroAnimation() {
  const eyebrow  = document.querySelector('.hero__eyebrow');
  const headline = document.querySelector('.hero__headline');
  const sub      = document.querySelector('.hero__sub');
  const cta      = document.querySelector('.hero__cta');
  if (!headline) return;

  const tl = gsap.timeline({ delay: 0.2 });

  // Group 1: eyebrow
  tl.fromTo(eyebrow,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' },
    0
  );

  // Group 2: headline — 500ms後
  tl.fromTo(headline,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 1.8, ease: 'power3.out' },
    0.5
  );

  // Group 3: sub + cta — 1.1s後・同時
  tl.fromTo(
    [sub, cta].filter(Boolean),
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 1.6, ease: 'power2.out' },
    1.1
  );
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
   透明度フェードのみ（[data-animate-fade]）
   スライドより遅い duration:1.6 で opacity のみアニメーション。
   Vision 画像など「動かさず静かに現れる」要素に使う。
---------------------------------------------------------- */
function _initFadeAnimations() {
  gsap.utils.toArray('[data-animate-fade]').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0 },
      {
        opacity:  1,
        duration: 1.6, // スライド(0.9)より遅く
        ease:     'power1.out',
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
   水平スクロールテキスト（.business__scroll-text）
   ScrollTriggerのonUpdateコールバックでx位置を計算。
   scrubは使わず直接gsap.setで更新（FROM捕捉タイミング問題を回避）。
   speedFactor: 参考サイト(UUUM)の0.6(PC)/0.8(SP)に準拠。
---------------------------------------------------------- */
function _initScrollText() {
  const text = document.querySelector('.business__scroll-text');
  if (!text) return;

  const getSpeed = () => window.innerWidth > 860 ? 0.6 : 0.8;

  // 初期位置（セクション未到達時はテキストを右方向にオフセット）
  gsap.set(text, { x: (0.5 * 200 * getSpeed()) + 'vw' });

  ScrollTrigger.create({
    trigger: '.business__scroll-band',
    start:   'top bottom',
    end:     'bottom top',
    onUpdate: (self) => {
      const speed = getSpeed();
      // progress 0→1 に応じてテキストを右(+)から左(-)へ移動
      const x = (0.5 - self.progress) * 200 * speed;
      gsap.set(text, { x: x + 'vw' });
    }
  });
}


/* ----------------------------------------------------------
   Swiperカルーセル（.recruit__swiper）
   slidesPerView: 1.15でSP時に次スライドをのぞかせる
---------------------------------------------------------- */
function _initSwiper() {
  if (typeof Swiper === 'undefined') return;
  new Swiper('.recruit__swiper', {
    slidesPerView: 1.15,
    spaceBetween:  16,
    grabCursor:    true, // マウスカーソルをグラブ表示
    mousewheel: {
      forceToAxis: true, // 横方向のホイールのみ反応（縦スクロールと競合しない）
    },
    pagination: {
      el:        '.recruit .swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      600: { slidesPerView: 2.1,  spaceBetween: 24 },
      840: { slidesPerView: 3,    spaceBetween: 32 },
    }
  });

  // Swiper CSS は index.html で layer="swiper" を指定して @layer components より
  // 低い優先度に置いてある。overflow:visible は components.css の CSS だけで効く。
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
