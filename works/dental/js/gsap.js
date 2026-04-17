/* ============================================================
   gsap.js — GSAPアニメーション
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
  _initStaggerAnimations();
  _initCountUp();
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

  const tl = gsap.timeline({ delay: 0.2 });

  heroEls.forEach((el, i) => {
    tl.fromTo(el,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: 'power2.out' },
      i === 0 ? 0 : 0.5
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
