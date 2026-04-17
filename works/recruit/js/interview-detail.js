/* ============================================================
   interview-detail.js — インタビュー詳細（interview-detail.html 用）
   URL: interview-detail.html?id={microCMS の id}
============================================================ */

const _DETAIL_URL = 'https://ysm.microcms.io/api/v1/blogs';
const _DETAIL_KEY = 'tfMF7WHWQJwT2YKoEaUNeYXVXtfgSS7BG8KL';

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// body 先頭2段落から dept・name を抽出し、残りを cleanBody として返す
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

// 関連インタビュー取得（現在の記事を除く最大3件）
async function _fetchRelated(currentId) {
  try {
    const res = await fetch(
      `${_DETAIL_URL}?limit=4&fields=id,title,eyecatch,dept,name,content`,
      { headers: { 'X-MICROCMS-API-KEY': _DETAIL_KEY } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.contents ?? []).filter(item => item.id !== currentId).slice(0, 3);
  } catch {
    return [];
  }
}

function _buildRelatedCard(item) {
  const parsed = _parseBody(item.content);
  const dept   = item.dept ?? item.department ?? parsed.dept;
  const name   = item.name ?? parsed.name;
  const title  = item.title ?? '';
  const imgUrl = item.eyecatch?.url ? `${item.eyecatch.url}?w=600&q=80` : null;

  return `
    <article class="interview__card">
      <a href="./interview-detail.html?id=${_esc(item.id)}" class="interview__card__link" aria-label="${_esc(name)} のインタビューを読む">
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

async function initInterviewDetail() {
  const id = new URLSearchParams(location.search).get('id');

  if (!id) {
    location.replace('./interview-list.html');
    return;
  }

  const article = document.getElementById('interviewPost');
  if (!article) return;

  try {
    const [res, relatedItems] = await Promise.all([
      fetch(`${_DETAIL_URL}/${id}`, {
        headers: { 'X-MICROCMS-API-KEY': _DETAIL_KEY },
      }),
      _fetchRelated(id),
    ]);

    if (!res.ok) throw new Error(`microCMS ${res.status}`);

    const item   = await res.json();
    const imgUrl = item.eyecatch?.url ? `${item.eyecatch.url}?w=1200&q=85` : null;
    const title  = item.title ?? '';
    const parsed = _parseBody(item.content);
    const dept   = item.dept ?? item.department ?? parsed.dept;
    const name   = item.name ?? parsed.name;
    const body   = parsed.cleanBody;

    document.title = `${name}${title ? ' — ' + title : ''} | 社員インタビュー`;

    const relatedHtml = relatedItems.length ? `
      <section class="interview-post__related">
        <div class="interview-post__related-inner">
          <p class="interview-post__related-label">OTHER INTERVIEWS</p>
          <h2 class="interview-post__related-heading">他のインタビュー</h2>
          <div class="interview-post__related-grid">
            ${relatedItems.map(_buildRelatedCard).join('')}
          </div>
        </div>
      </section>
    ` : '';

    article.innerHTML = `
      <div class="interview-post__inner">
        <header class="interview-post__header">
          ${dept  ? `<p class="interview-post__dept">${_esc(dept)}</p>`  : ''}
          ${name  ? `<p class="interview-post__name">${_esc(name)}</p>`  : ''}
          ${title ? `<h1 class="interview-post__title">${_esc(title)}</h1>` : ''}
        </header>
        <div class="interview-post__hero">
          ${imgUrl ? `<img src="${_esc(imgUrl)}" alt="${_esc(name)}" width="1200" height="675" />` : ''}
        </div>
        <div class="interview-post__body">
          ${body}
        </div>
        <div class="interview-post__foot">
          <a href="./interview-list.html" class="btn btn--outline">一覧へ戻る</a>
        </div>
      </div>
      ${relatedHtml}
    `;

    article.classList.add('is-visible');

  } catch (err) {
    console.warn('[interview-detail.js]', err.message);
    article.innerHTML = `
      <div class="interview-post__inner">
        <p class="interview-post__error">記事の読み込みに失敗しました。<a href="./interview-list.html">一覧に戻る</a></p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initInterviewDetail);
