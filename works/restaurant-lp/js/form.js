/* ============================================================
   form.js — フォームバリデーション・fetch送信
   index.html の #contactForm と連携する。

   【案件ごとの設定】
   1. SUBMIT_URL を送信先に変更
   2. FIELDS に対応するフィールドを定義
   3. 必要に応じてバリデーションルールを追加
============================================================ */

// ============================================================
// 案件ごとに差し替え
// ============================================================
const SUBMIT_URL = './contact/send.php';

const FIELDS = [
  { name: 'name',    required: true, label: 'お名前' },
  { name: 'email',   required: true, label: 'メールアドレス', type: 'email' },
  { name: 'message', required: true, label: 'メッセージ' },
];

// ============================================================
// バリデーション
// ============================================================
function _validateField(field, value) {
  if (field.required && value.trim() === '') {
    return `${field.label}を入力してください。`;
  }
  if (field.type === 'email' && value.trim() !== '') {
    // 簡易メールチェック
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
// リアルタイムバリデーション（入力中にエラーを消す）
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

  const formEl = e.target;
  const submitBtn = formEl.querySelector('[type="submit"]');

  // バリデーション
  if (!_validateAll(formEl)) {
    // 最初のエラーフィールドにフォーカス
    const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // 送信中の状態
  submitBtn.disabled = true;
  submitBtn.textContent = '送信中...';

  // 既存の結果表示をクリア
  const existingResult = formEl.querySelector('.form__result');
  if (existingResult) existingResult.remove();

  try {
    const res = await fetch(SUBMIT_URL, {
      method: 'POST',
      body: new FormData(formEl),
    });

    const data = await res.json();

    if (data.ok) {
      // 成功
      formEl.reset();
      _clearErrors(formEl);
      _showResult(formEl, 'success', 'お問い合わせありがとうございます。送信が完了しました。');
    } else if (data.errors) {
      // サーバー側バリデーションエラー
      _applyServerErrors(formEl, data.errors);
    } else {
      _showResult(formEl, 'error', data.error || '送信に失敗しました。時間を置いて再度お試しください。');
    }
  } catch {
    _showResult(formEl, 'error', '通信エラーが発生しました。時間を置いて再度お試しください。');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '送信する';
  }
}

// ============================================================
// ヘルパー
// ============================================================
function _clearErrors(formEl) {
  for (const field of FIELDS) {
    const input = formEl.elements[field.name];
    const errorEl = document.getElementById(`${field.name}Error`);
    if (input) input.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
  }
}

function _applyServerErrors(formEl, errors) {
  for (const [name, message] of Object.entries(errors)) {
    const input = formEl.elements[name];
    const errorEl = document.getElementById(`${name}Error`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = message;
  }
  const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
  if (firstInvalid) firstInvalid.focus();
}

function _showResult(formEl, type, message) {
  const resultEl = document.createElement('div');
  resultEl.className = `form__result form__result--${type}`;
  resultEl.setAttribute('role', 'alert');
  resultEl.textContent = message;
  formEl.appendChild(resultEl);
}

// ============================================================
// 初期化（main.js から呼ばれる想定）
// ============================================================
function initForm() {
  const formEl = document.getElementById('contactForm');
  if (!formEl) return;

  _setupRealtimeValidation(formEl);
  formEl.addEventListener('submit', _handleSubmit);
}
