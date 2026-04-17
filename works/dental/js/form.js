/* ============================================================
   form.js — WEB予約フォーム（歯科専用拡張）
   テンプレートの form.js をベースに以下を追加:
   - type: 'radio'  → RadioNodeList の選択状態チェック
   - type: 'select' → value が空でないかチェック
   - type: 'kana'   → カタカナ判定
   - type: 'tel'    → 電話番号桁数判定
   - 送信UIをダミー実装（fetch → setTimeout + オーバーレイ）
============================================================ */

/* ============================================================
   案件設定（ダミー送信のためURLは未使用）
============================================================ */
const FIELDS = [
  { name: 'examination', required: true,  label: '受診歴',          type: 'radio'  },
  { name: 'symptoms',    required: true,  label: '症状・希望内容',    type: 'radio'  },
  { name: 'calendar',    required: true,  label: '予約日'                           },
  { name: 'time',        required: true,  label: '予約時間',         type: 'select' },
  { name: 'sei',         required: true,  label: '姓（漢字）'                       },
  { name: 'sei-kana',    required: true,  label: 'セイ（フリガナ）',  type: 'kana'  },
  { name: 'mei',         required: true,  label: '名（漢字）'                       },
  { name: 'mei-kana',    required: true,  label: 'メイ（フリガナ）',  type: 'kana'  },
  { name: 'gender',      required: true,  label: '性別',             type: 'radio'  },
  { name: 'year',        required: true,  label: '生年（年）',        type: 'select' },
  { name: 'mail',        required: true,  label: 'メールアドレス',    type: 'email'  },
  { name: 'telephone',   required: true,  label: '電話番号',         type: 'tel'    },
  { name: 'comment',     required: false, label: '要望・ご質問'                      },
];

/* ============================================================
   バリデーション（単一フィールド）
============================================================ */
function _validateField(field, value) {
  if (field.required && value.trim() === '') {
    return field.type === 'radio' || field.type === 'select'
      ? `${field.label}を選択してください。`
      : `${field.label}を入力してください。`;
  }
  if (field.type === 'email' && value.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '正しいメールアドレスを入力してください。';
    }
  }
  if (field.type === 'kana' && value.trim() !== '') {
    if (!/^[ァ-ヶー\s　]+$/.test(value.trim())) {
      return 'カタカナで入力してください。';
    }
  }
  if (field.type === 'tel' && value.trim() !== '') {
    const tel = value.replace(/-/g, '');
    if (!/^[0-9]{10,11}$/.test(tel)) {
      return '正しい電話番号を入力してください（例: 08012345678）。';
    }
  }
  return '';
}

/* ============================================================
   バリデーション（全フィールド）
============================================================ */
function _validateAll(formEl) {
  let isValid = true;

  for (const field of FIELDS) {
    const errorEl = document.getElementById(`${field.name}Error`);

    if (field.type === 'radio') {
      // RadioNodeList.value → 選択された値 or ''
      const nodeList = formEl.elements[field.name];
      const value = nodeList ? nodeList.value : '';
      const error = _validateField(field, value);
      if (error) {
        isValid = false;
        if (errorEl) errorEl.textContent = error;
        // 最初のラジオを aria-invalid マーク（フォーカス用）
        const firstRadio = formEl.querySelector(`input[name="${field.name}"]`);
        if (firstRadio) firstRadio.setAttribute('aria-invalid', 'true');
      } else {
        if (errorEl) errorEl.textContent = '';
        const firstRadio = formEl.querySelector(`input[name="${field.name}"]`);
        if (firstRadio) firstRadio.removeAttribute('aria-invalid');
      }
      continue;
    }

    const input = formEl.elements[field.name];
    if (!input) continue;

    const value = input.value ?? '';
    const error = _validateField(field, value);

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

/* ============================================================
   リアルタイムバリデーション（blur 時にエラーを消す）
============================================================ */
function _setupRealtimeValidation(formEl) {
  for (const field of FIELDS) {
    if (field.type === 'radio') {
      // ラジオは change イベントでエラーを消す
      formEl.querySelectorAll(`input[name="${field.name}"]`).forEach(radio => {
        radio.addEventListener('change', () => {
          const errorEl = document.getElementById(`${field.name}Error`);
          if (errorEl) errorEl.textContent = '';
          radio.removeAttribute('aria-invalid');
        });
      });
      continue;
    }

    const input = formEl.elements[field.name];
    if (!input) continue;

    input.addEventListener('blur', () => {
      const error = _validateField(field, input.value ?? '');
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

/* ============================================================
   送信処理（ダミー実装 — コンソール出力 + 成功UI）
============================================================ */
async function _handleSubmit(e) {
  e.preventDefault();

  const formEl   = e.target;
  const submitBtn = formEl.querySelector('[type="submit"]');

  if (!_validateAll(formEl)) {
    const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // ローディング開始
  submitBtn.disabled = true;
  _showOverlay('loading');

  // ダミーAPI: データをコンソール出力
  const data = Object.fromEntries(new FormData(formEl).entries());
  console.log('[WEB予約] 送信データ:', data);

  // 1.5秒後に成功表示
  setTimeout(() => {
    _showOverlay('success');
    submitBtn.disabled = false;
  }, 1500);
}

/* ============================================================
   送信後リセット
============================================================ */
function _setupOverlayReset(formEl) {
  const resetBtn = document.getElementById('formOverlayReset');
  if (!resetBtn) return;
  resetBtn.addEventListener('click', () => {
    _showOverlay('hidden');
    formEl.reset();
    _clearErrors(formEl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   ヘルパー
============================================================ */
function _showOverlay(state) {
  const overlay = document.getElementById('formOverlay');
  if (!overlay) return;
  overlay.dataset.state = state; // 'loading' | 'success' | 'hidden'
  overlay.setAttribute('aria-hidden', state === 'hidden' ? 'true' : 'false');
  if (state !== 'hidden') {
    _trapFocus(overlay);
  }
}

function _clearErrors(formEl) {
  for (const field of FIELDS) {
    const input   = formEl.elements[field.name];
    const errorEl = document.getElementById(`${field.name}Error`);
    if (input && input.removeAttribute) input.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
  }
}

/* ============================================================
   初期化（main.js から呼ばれる）
============================================================ */
function initForm() {
  const formEl = document.getElementById('contactForm');
  if (!formEl) return;

  _setupRealtimeValidation(formEl);
  _setupOverlayReset(formEl);
  formEl.addEventListener('submit', _handleSubmit);
}
