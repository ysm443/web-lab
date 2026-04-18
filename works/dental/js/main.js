/* ============================================================
   main.js — エントリーポイント
   各関数の呼び出しをまとめるだけ。ロジックはここに書かない。

   読み込み順序（各HTML）:
   gsap.min.js → ScrollTrigger.min.js →
   nav.js → scroll.js → form.js → gsap.js → main.js
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  if (typeof initNav    === 'function') initNav();
  if (typeof initScroll === 'function') initScroll();
  if (typeof initForm   === 'function') initForm();
  if (typeof initGsap   === 'function') initGsap();

  // フッターの年号を自動更新
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

// lazy 画像読み込み後にレイアウトが確定してからトリガー位置を再計算
// DOMContentLoaded 時点では lazy 画像が未ロードでページ高さがズレるため
window.addEventListener('load', () => {
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
});


/* ============================================================
   フォーカストラップ（モーダル用ユーティリティ）
============================================================ */
function _trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  const handler = e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };

  _trapFocus._handler = handler;
  modal.addEventListener('keydown', handler);
  first.focus();
}
