/* ============================================================
   interview.js — microCMS インタビュー（index.html 用・最大4件）

   【CMS body の書き方】
   1行目（<p>）: 部署名
   2行目（<p>）: 氏名
   3行目以降  : 本文（詳細ページに表示）

   ※ dept / name カスタムフィールドがあればそちらを優先。
============================================================ */

const _INTERVIEW_URL = 'https://ysm.microcms.io/api/v1/blogs';
const _INTERVIEW_KEY = 'tfMF7WHWQJwT2YKoEaUNeYXVXtfgSS7BG8KL';

// body の1・2行目から部署名・氏名を抽出
function _parseBody(bodyHtml) {
  const div   = document.createElement('div');
  div.innerHTML = bodyHtml ?? '';
  const paras = Array.from(div.querySelectorAll('p'));
  const dept  = paras[0]?.textContent?.trim() ?? '';
  const name  = paras[1]?.textContent?.trim() ?? '';
  paras[0]?.remove();
  paras[1]?.remove();
  return { dept, name, cleanBody: div.innerHTML };
}

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// カード HTML（index.html 用: 詳細リンクは ./interview-detail.html）
// ============================================================
function _buildCard(item) {
  const parsed   = _parseBody(item.content);
  const imgUrl   = item.eyecatch?.url ? `${item.eyecatch.url}?w=800&q=80` : null;
  // カスタムフィールド優先、なければ body 先頭から抽出
  const dept     = item.dept ?? item.department ?? parsed.dept;
  const name     = item.name ?? parsed.name;
  const title    = item.title ?? '';
  const detailUrl = `./interview-detail.html?id=${_esc(item.id)}`;

  return `
    <article class="interview__card">
      <a href="${detailUrl}" class="interview__card__link" aria-label="${_esc(name)} のインタビューを読む">
        <div class="interview__card__image">
          ${imgUrl ? `<img src="${_esc(imgUrl)}" alt="${_esc(name)}" width="800" height="600" loading="lazy" />` : ''}
        </div>
        <div class="interview__card__body">
          ${dept  ? `<p class="interview__card__dept">${_esc(dept)}</p>`  : ''}
          ${name  ? `<p class="interview__card__name">${_esc(name)}</p>`  : ''}
          ${title ? `<p class="interview__card__quote">「${_esc(title)}」</p>` : ''}
        </div>
      </a>
    </article>
  `;
}

// ============================================================
// 初期化（main.js から await で呼ぶ）
// ============================================================
async function initInterview() {
  const grid = document.querySelector('.interview__grid');
  if (!grid) return;

  // GSAP flash 防止: 静的カードを先に非表示にする
  if (typeof gsap !== 'undefined') {
    gsap.set(grid.children, { opacity: 0 });
  }

  try {
    const res = await fetch(`${_INTERVIEW_URL}?limit=4`, {
      headers: { 'X-MICROCMS-API-KEY': _INTERVIEW_KEY },
    });
    if (!res.ok) throw new Error(`microCMS ${res.status}`);

    const data  = await res.json();
    const items = data.contents  ?? [];
    const total = data.totalCount ?? 0;

    if (items.length) {
      grid.innerHTML = items.map(_buildCard).join('');
    }

    // 4件超 → 「もっと見る」ボタンを表示
    const moreEl = document.getElementById('interviewMore');
    if (moreEl && total > 4) moreEl.hidden = false;

    console.info(`[interview.js] ${items.length}件 / 全${total}件`);

  } catch (err) {
    // フォールバック: 静的カードのまま GSAP に渡す
    console.warn('[interview.js] フォールバック:', err.message);
  }
}
