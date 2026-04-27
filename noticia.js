/**
 * PODIUM — NOTICIA.JS
 * Página dedicada a uma notícia individual
 * URL: noticia.html?slug=<slug>
 *
 * Funcionalidades:
 *  - Carrega notícia por slug (Supabase ou data.js mock)
 *  - Renderiza hero, conteúdo, galeria com lightbox
 *  - Partilha social, favoritos
 *  - Notícias relacionadas (mesma categoria)
 *  - 404 se não encontrar
 */

// ============================================================
// HELPERS
// ============================================================
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escapeHTML = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const formatDateLong = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
};

// ============================================================
// FAVORITOS (mesma chave do site público)
// ============================================================
const FAV_KEY = 'podium_favorites_v1';
const favorites = {
  get() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; } },
  set(list) { localStorage.setItem(FAV_KEY, JSON.stringify(list)); },
  has(id) { return this.get().includes(id); },
  toggle(id) {
    const list = this.get();
    const idx = list.indexOf(id);
    if (idx >= 0) { list.splice(idx, 1); this.set(list); return false; }
    list.push(id); this.set(list); return true;
  }
};

// ============================================================
// TOAST
// ============================================================
let toastTimer;
function showToast(message, type = 'info') {
  const el = $('#toast');
  if (!el) return;
  clearTimeout(toastTimer);
  el.hidden = false;
  el.textContent = message;
  el.className = `toast toast--${type} show`;
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 300);
  }, 2800);
}

// ============================================================
// API — Supabase ou mock
// ============================================================
const sbClient = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;

const CATEGORIES = window.PODIUM_CATEGORIES || {
  futebol:    { name: 'Futebol',    emoji: '⚽' },
  basketball: { name: 'Basketball', emoji: '🏀' },
  tennis:     { name: 'Ténis',      emoji: '🎾' },
  atletismo:  { name: 'Atletismo',  emoji: '🏃' },
  motorsport: { name: 'Motorsport', emoji: '🏎️' },
  volei:      { name: 'Voleibol',   emoji: '🏐' },
};

function normalizeFromSupabase(row) {
  if (!row) return null;
  return {
    id:        row.id,
    slug:      row.slug,
    categoria: row.categoria_slug || 'futebol',
    titulo:    row.titulo,
    resumo:    row.resumo,
    conteudo:  Array.isArray(row.conteudo) ? row.conteudo : [row.conteudo || ''].filter(Boolean),
    data:      row.data_publicacao,
    autor:     row.autor || 'Equipa Podium',
    imagem:    row.imagem_url || null,
    imagens_galeria: Array.isArray(row.imagens_galeria) ? row.imagens_galeria : [],
  };
}

const api = {
  async fetchBySlug(slug) {
    if (sbClient) {
      // Tentar buscar por slug (preferido) e fallback por id "id-N"
      const { data, error } = await sbClient
        .from('noticias_publicas')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) console.error(error);
      if (data) return normalizeFromSupabase(data);

      // Fallback se for "id-N"
      const m = slug.match(/^id-(\d+)$/);
      if (m) {
        const { data: byId } = await sbClient
          .from('noticias_publicas')
          .select('*')
          .eq('id', parseInt(m[1], 10))
          .maybeSingle();
        if (byId) return normalizeFromSupabase(byId);
      }
      return null;
    }
    // MOCK
    const list = window.PODIUM_NEWS_DATA || [];
    let found = list.find(n => n.slug === slug);
    if (!found) {
      const m = slug.match(/^id-(\d+)$/);
      if (m) found = list.find(n => n.id === parseInt(m[1], 10));
    }
    return found || null;
  },

  async fetchRelated(categoria, excludeId, limit = 3) {
    if (sbClient) {
      const { data } = await sbClient
        .from('noticias_publicas')
        .select('*')
        .eq('categoria_slug', categoria)
        .neq('id', excludeId)
        .limit(limit);
      return (data || []).map(normalizeFromSupabase);
    }
    const list = window.PODIUM_NEWS_DATA || [];
    return list
      .filter(n => n.categoria === categoria && n.id !== excludeId)
      .slice(0, limit);
  },

  async incrementarViews(id) {
    if (!sbClient) return;
    try { await sbClient.rpc('incrementar_views', { noticia_id: id }); } catch (e) { /* silent */ }
  }
};

// ============================================================
// RENDER
// ============================================================
function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug') || '';
}

function showError() {
  $('#articleLoading').hidden = true;
  $('#article').hidden = true;
  $('#articleNotfound').hidden = false;
}

async function loadArticle() {
  const slug = getSlugFromURL();
  if (!slug) { showError(); return; }

  const article = await api.fetchBySlug(slug);
  if (!article) { showError(); return; }

  renderArticle(article);

  // Não bloqueante:
  api.incrementarViews(article.id);
  loadRelated(article);
}

function renderArticle(article) {
  const cat = CATEGORIES[article.categoria] || {};

  // Page meta
  document.title = `${article.titulo} — Podium`;
  $('#metaDescription')?.setAttribute('content', article.resumo);
  $('#ogTitle')?.setAttribute('content', article.titulo);
  $('#ogDescription')?.setAttribute('content', article.resumo);
  if (article.imagem) $('#ogImage')?.setAttribute('content', article.imagem);

  // Hero
  if (article.imagem) {
    $('#articleHeroBg').style.backgroundImage = `url('${article.imagem}')`;
    $('#articleHero').classList.add('article__hero--photo');
  } else {
    $('#articleHero').classList.add(`article__hero--${article.categoria}`);
  }

  // Categoria
  $('#articleCategory').textContent = `${cat.emoji || ''} ${cat.name || 'Desporto'}`;

  // Título, meta, lead
  $('#articleTitle').textContent = article.titulo;
  $('#articleDate').textContent = formatDateLong(article.data);
  $('#articleDate').setAttribute('datetime', article.data);
  $('#articleAuthor').textContent = article.autor;
  $('#articleLead').textContent = article.resumo;

  // Conteúdo (parágrafos)
  const contentEl = $('#articleContent');
  contentEl.innerHTML = (article.conteudo || [])
    .map(p => `<p>${escapeHTML(p)}</p>`)
    .join('');

  // Galeria
  if (article.imagens_galeria && article.imagens_galeria.length > 0) {
    renderGallery(article.imagens_galeria, article.titulo);
  }

  // Acções (favorito state inicial)
  const favBtn = $('[data-share="fav"]');
  if (favBtn) {
    const isFav = favorites.has(article.id);
    favBtn.classList.toggle('active', isFav);
    favBtn.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart"></i>`;
    favBtn.setAttribute('data-id', article.id);
  }

  // Mostrar
  $('#articleLoading').hidden = true;
  $('#article').hidden = false;
}

function renderGallery(images, articleTitle) {
  const section = $('#articleGallery');
  const grid    = $('#articleGalleryGrid');
  section.hidden = false;

  grid.innerHTML = images.map((url, i) => `
    <button type="button" class="gallery-item" data-index="${i}" aria-label="Imagem ${i + 1} de ${images.length}">
      <img src="${escapeHTML(url)}" alt="${escapeHTML(articleTitle)} — imagem ${i + 1}" loading="lazy" />
    </button>
  `).join('');

  // Lightbox: guardar lista global
  window.__galleryImages = images;
  window.__galleryCaption = articleTitle;
}

async function loadRelated(article) {
  const related = await api.fetchRelated(article.categoria, article.id, 3);
  if (related.length === 0) return;

  const section = $('#related');
  const grid    = $('#relatedGrid');
  section.hidden = false;

  grid.innerHTML = related.map(n => {
    const cat = CATEGORIES[n.categoria] || {};
    const hasImg = !!n.imagem;
    const imgStyle = hasImg ? `style="background-image:url('${escapeHTML(n.imagem)}')"` : '';
    const slug = n.slug || `id-${n.id}`;
    return `
      <a class="related-card" href="noticia.html?slug=${encodeURIComponent(slug)}">
        <div class="related-card__img ${hasImg ? 'related-card__img--photo' : `news-card__img--${n.categoria}`}" ${imgStyle}>
          ${!hasImg ? `<span class="news-card__emoji">${cat.emoji || '📰'}</span>` : ''}
        </div>
        <div class="related-card__body">
          <span class="related-card__cat">${cat.name || ''}</span>
          <h3 class="related-card__title">${escapeHTML(n.titulo)}</h3>
          <time class="related-card__date">${formatDate(n.data)}</time>
        </div>
      </a>
    `;
  }).join('');
}

// ============================================================
// LIGHTBOX
// ============================================================
const lightbox = {
  current: 0,
  images: [],

  open(index) {
    this.images = window.__galleryImages || [];
    if (this.images.length === 0) return;
    this.current = index;
    this.update();
    $('#lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
  },

  close() {
    $('#lightbox').hidden = true;
    document.body.style.overflow = '';
  },

  update() {
    const url = this.images[this.current];
    $('#lightboxImage').src = url;
    $('#lightboxImage').alt = `Imagem ${this.current + 1} de ${this.images.length}`;
    $('#lightboxCaption').textContent = `${this.current + 1} / ${this.images.length}${window.__galleryCaption ? ' · ' + window.__galleryCaption : ''}`;
    // Mostrar/esconder setas se for única
    const single = this.images.length <= 1;
    $('#lightboxPrev').hidden = single;
    $('#lightboxNext').hidden = single;
  },

  next() {
    this.current = (this.current + 1) % this.images.length;
    this.update();
  },

  prev() {
    this.current = (this.current - 1 + this.images.length) % this.images.length;
    this.update();
  }
};

// Click numa imagem da galeria → abre lightbox
document.addEventListener('click', (e) => {
  const item = e.target.closest('.gallery-item');
  if (item) {
    e.preventDefault();
    lightbox.open(parseInt(item.dataset.index, 10));
    return;
  }
  if (e.target.matches('[data-close]') || e.target.classList.contains('lightbox__backdrop')) {
    if ($('#lightbox') && !$('#lightbox').hidden) lightbox.close();
  }
});

$('#lightboxNext')?.addEventListener('click', (e) => { e.stopPropagation(); lightbox.next(); });
$('#lightboxPrev')?.addEventListener('click', (e) => { e.stopPropagation(); lightbox.prev(); });

// Teclado
document.addEventListener('keydown', (e) => {
  if ($('#lightbox')?.hidden) return;
  if (e.key === 'Escape')      lightbox.close();
  if (e.key === 'ArrowRight')  lightbox.next();
  if (e.key === 'ArrowLeft')   lightbox.prev();
});

// ============================================================
// PARTILHA
// ============================================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-share]');
  if (!btn) return;
  const url   = window.location.href;
  const title = $('#articleTitle')?.textContent || 'Podium';
  const text  = encodeURIComponent(`${title} — via Podium`);

  switch (btn.dataset.share) {
    case 'fav': {
      const id = parseInt(btn.dataset.id, 10);
      if (!id) return;
      const added = favorites.toggle(id);
      btn.classList.toggle('active', added);
      btn.innerHTML = `<i class="${added ? 'fas' : 'far'} fa-heart"></i>`;
      showToast(added ? '⭐ Adicionado aos favoritos' : 'Removido dos favoritos', added ? 'success' : 'info');
      break;
    }
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
      break;
    case 'link':
      navigator.clipboard?.writeText(url)
        .then(() => showToast('🔗 Link copiado!', 'success'))
        .catch(() => showToast('Não foi possível copiar', 'error'));
      break;
  }
});

// ============================================================
// BOOT
// ============================================================
loadArticle();
