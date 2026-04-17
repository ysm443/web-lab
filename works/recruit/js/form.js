/* ============================================================
   form.js — フォームバリデーション・ダミー送信
   採用サイト用: お問い合わせフォーム (#contactForm)

   【本番移行時の作業】
   _dummySubmit() を fetch(SUBMIT_URL, ...) に差し替えるだけ。
============================================================ */

// ============================================================
// ダミー送信（コンソール出力 + 1.2s 待機して成功を返す）
// ============================================================
function _dummySubmit(formData) {
  console.group('[form.js] ダミー送信');
  console.table(Object.fromEntries(formData));
  console.groupEnd();
  return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1200));
}

// ============================================================
// フィールド定義
// ============================================================
const FIELDS = [
  { name: 'name',     required: true, label: 'お名前' },
  { name: 'email',    required: true, label: 'メールアドレス', type: 'email' },
  { name: 'position', required: true, label: '応募希望職種' },
  { name: 'message',  required: true, label: '志望動機・メッセージ' },
];

// ============================================================
// バリデーション
// ============================================================
function _validateField(field, value) {
  if (field.required && value.trim() === '') {
    return `${field.label}を入力してください。`;
  }
  if (field.type === 'email' && value.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '正しいメールアドレスを入力してください。';
    }
  }
  return '';
}

function _validateAll(formEl) {
  let isValid = true;
  for (const field of FIELDS) {
    const input = formEl.elements[field.name];
    if (!input) continue;
    const error = _validateField(field, input.value);
    const errorEl = document.getElementById(`${field.name}Error`);
    if (error) {
      isValid = false;
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) errorEl.textContent = error;
    } else {
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.textContent = '';
    }
  }
  return isValid;
}

// ============================================================
// リアルタイムバリデーション（blur 時にエラーを更新）
// ============================================================
function _setupRealtimeValidation(formEl) {
  for (const field of FIELDS) {
    const input = formEl.elements[field.name];
    if (!input) continue;
    input.addEventListener('blur', () => {
      const error = _validateField(field, input.value);
      const errorEl = document.getElementById(`${field.name}Error`);
      if (error) {
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = error;
      } else {
        input.removeAttribute('aria-invalid');
        if (errorEl) errorEl.textContent = '';
      }
    });
  }
}

// ============================================================
// 送信処理
// ============================================================
async function _handleSubmit(e) {
  e.preventDefault();
  const formEl   = e.target;
  const submitBtn = formEl.querySelector('.form__submit');

  if (!_validateAll(formEl)) {
    const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // ローディング開始
  submitBtn.classList.add('is-loading');
  submitBtn.disabled = true;

  try {
    const result = await _dummySubmit(new FormData(formEl));
    if (result.ok) _showSuccess(formEl);
  } catch {
    // ダミーでは発生しないが念のため
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;
  }
}

// ============================================================
// 成功表示（フォームをフェードアウト → 成功カードをフェードイン）
// ============================================================
function _showSuccess(formEl) {
  const wrap      = formEl.closest('.contact__form-wrap');
  const successEl = document.getElementById('contactSuccess');
  if (!wrap || !successEl) return;

  // フォームが消えた後も高さを維持
  wrap.style.minHeight = `${wrap.offsetHeight}px`;

  formEl.classList.add('is-hidden');

  setTimeout(() => {
    successEl.removeAttribute('aria-hidden');
    successEl.classList.add('is-visible');
  }, 320);
}

// ============================================================
// 初期化（main.js から呼ぶ）
// ============================================================
function initForm() {
  const formEl = document.getElementById('contactForm');
  if (!formEl) return;
  _setupRealtimeValidation(formEl);
  formEl.addEventListener('submit', _handleSubmit);
}
