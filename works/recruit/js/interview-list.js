/* ============================================================
   interview-list.js — 全インタビュー一覧（interview/index.html 用）

   【CMS body の書き方】
   1行目（<p>）: 部署名 / 2行目（<p>）: 氏名 / 3行目以降: 本文
============================================================ */

const _LIST_URL = 'https://ysm.microcms.io/api/v1/blogs';
const _LIST_KEY = 'tfMF7WHWQJwT2YKoEaUNeYXVXtfgSS7BG8KL';

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

function _buildCard(item) {
  const parsed   = _parseBody(item.content);
  const imgUrl   = item.eyecatch?.url ? `${item.eyecatch.url}?w=800&q=80` : null;
  const dept     = item.dept ?? item.department ?? parsed.dept;
  const name     = item.name ?? parsed.name;
  const title    = item.title ?? '';
  const detailUrl = `./interview-detail.html?id=${_esc(item.id)}`;

  return `
    <article class="interview__card">
      <a href="${detailUrl}" class="interview__card__link" aria-label="${_esc(name)} のインタビューを読む">
        <div class="interview__card__image">
          ${imgUrl ? `<img src="${_esc(imgUrl)}" alt="${_esc(name)}" loading="lazy" />` : ''}
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

async function initInterviewList() {
  const grid    = document.getElementById('interviewListGrid');
  const counter = document.getElementById('interviewCount');
  if (!grid) return;

  try {
    const res = await fetch(`${_LIST_URL}?limit=100`, {
      headers: { 'X-MICROCMS-API-KEY': _LIST_KEY },
    });
    if (!res.ok) throw new Error(`microCMS ${res.status}`);

    const data  = await res.json();
    const items = data.contents  ?? [];
    const total = data.totalCount ?? 0;

    if (counter) counter.textContent = `${total}件`;

    if (!items.length) {
      grid.innerHTML = '<p class="interview-list__empty">現在公開中のインタビューはありません。</p>';
      return;
    }

    grid.innerHTML = items.map(_buildCard).join('');

    // CSS アニメーションのトリガー
    requestAnimationFrame(() => {
      grid.querySelectorAll('.interview__card').forEach((el, i) => {
        el.style.animationDelay = `${i * 80}ms`;
        el.classList.add('is-visible');
      });
    });

  } catch (err) {
    console.warn('[interview-list.js]', err.message);
    grid.innerHTML = '<p class="interview-list__empty">読み込みに失敗しました。</p>';
  }
}

document.addEventListener('DOMContentLoaded', initInterviewList);
