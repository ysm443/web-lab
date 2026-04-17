/* ============================================================
   scroll.js — スクロールアニメーション（GSAPなし時のフォールバック）
   ・GSAPが読み込まれていればスキップ（gsap.js に委譲）
   ・[data-animate] 要素に .is-visible を付与
============================================================ */

function initScroll() {
  if (typeof gsap !== 'undefined') return; // GSAPに委譲

  const targets = document.querySelectorAll('[data-animate]');
  if (!targets.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => observer.observe(el));
}
