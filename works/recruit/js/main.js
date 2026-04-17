/* ============================================================
   main.js — エントリーポイント
   各関数の呼び出しをまとめるだけ。ロジックはここに書かない。

   読み込み順序（index.html）:
   gsap.min.js → ScrollTrigger.min.js →
   nav.js → scroll.js → form.js → gsap.js → main.js

   案件に応じて使う関数のコメントアウトを外す。
   対応する <script> タグも index.html で有効にすること。
============================================================ */

// initInterview の fetch 完了を待ってから GSAP を初期化する（stagger 対象が確定してから）
document.addEventListener('DOMContentLoaded', async () => {

  if (typeof initNav       === 'function') initNav();
  if (typeof initScroll    === 'function') initScroll();
  if (typeof initForm      === 'function') initForm();
  if (typeof initInterview === 'function') await initInterview();
  if (typeof initGsap      === 'function') initGsap();

  // フッターの年号を自動更新
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

/* ============================================================
   フォーカストラップ（モーダル用ユーティリティ）
   使い方:
     _trapFocus(modalEl);          // 開く時
     modal.removeEventListener('keydown', _trapFocus._handler); // 閉じる時
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
