/**
 * PODIUM — SCRIPT.JS (v2)
 * -----------------------------------------------------------
 * Funcionalidades:
 *  1. Dados mock (facilmente substituíveis por chamada Supabase/API)
 *  2. Hero slider (autoplay 3s, setas, dots, swipe mobile)
 *  3. Navbar: scroll state, dropdowns, mobile menu, active link
 *  4. Pesquisa live (desktop + mobile)
 *  5. Renderização de notícias + filtros + load more
 *  6. Modal de notícia individual
 *  7. Favoritos (localStorage)
 *  8. Partilha social
 *  9. Toast, newsletter form, stats counter, scroll reveal
 * -----------------------------------------------------------
 * NOTA: para ligar ao Supabase no futuro:
 *   substituir `fetchNews()` por chamada supabase.from('noticias').select()
 *   substituir `fetchHeroSlides()` por query where destaque = true
 */

/* ============================================================
   0. DADOS — Mock local (pronto a migrar para Supabase)
   ============================================================ */
const CATEGORIES = window.PODIUM_CATEGORIES || {
  futebol:     { name: 'Futebol',    emoji: '⚽', tagClass: 'tag--football'   },
  basketball:  { name: 'Basketball', emoji: '🏀', tagClass: 'tag--basketball' },
  tennis:      { name: 'Ténis',      emoji: '🎾', tagClass: 'tag--tennis'     },
  atletismo:   { name: 'Atletismo',  emoji: '🏃', tagClass: 'tag--football'   },
  motorsport:  { name: 'Motorsport', emoji: '🏎️', tagClass: 'tag--tennis'     },
  volei:       { name: 'Voleibol',   emoji: '🏐', tagClass: 'tag--basketball' }
};

/** Notícias mock — vêm de data.js quando carregado */
const NEWS_DATA = window.PODIUM_NEWS_DATA || [];

/* ------- "API" — Supabase quando configurado, mock caso contrário ------- */
const sbClient = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;

// Mapa usado para normalizar registos Supabase → formato interno
function normalizeFromSupabase(row) {
  if (!row) return null;
  // row vem da view `noticias_publicas` (ou join com categorias)
  const cat = row.categorias || {};
  return {
    id:        row.id,
    slug:      row.slug || null,
    categoria: row.categoria_slug || cat.slug || 'futebol',
    destaque:  !!row.destaque,
    titulo:    row.titulo,
    resumo:    row.resumo,
    conteudo:  Array.isArray(row.conteudo) ? row.conteudo : [row.conteudo || ''].filter(Boolean),
    data:      row.data_publicacao,
    autor:     row.autor || 'Equipa Podium',
    imagem:    row.imagem_url || null,
    imagens_galeria: Array.isArray(row.imagens_galeria) ? row.imagens_galeria : [],
  };
}

const api = sbClient ? {
  // ===== SUPABASE API =====
  async fetchNews(filter = 'all') {
    let q = sbClient.from('noticias_publicas').select('*');
    if (filter !== 'all') q = q.eq('categoria_slug', filter);
    const { data, error } = await q;
    if (error) { console.error(error); return []; }
    return (data || []).map(normalizeFromSupabase);
  },
  async fetchHeroSlides() {
    const { data, error } = await sbClient
      .from('noticias_publicas')
      .select('*')
      .eq('destaque', true)
      .limit(5);
    if (error) { console.error(error); return []; }
    return (data || []).map(normalizeFromSupabase);
  },
  async searchNews(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const { data, error } = await sbClient
      .from('noticias_publicas')
      .select('*')
      .or(`titulo.ilike.%${q}%,resumo.ilike.%${q}%`)
      .limit(6);
    if (error) { console.error(error); return []; }
    return (data || []).map(normalizeFromSupabase);
  },
  async fetchEvents(limit = 8) {
    // Só eventos futuros (>= agora)
    const nowIso = new Date().toISOString();
    const { data, error } = await sbClient
      .from('agenda_publica')
      .select('*')
      .gte('data_evento', nowIso)
      .order('data_evento', { ascending: true })
      .limit(limit);
    if (error) { console.error(error); return []; }
    return data || [];
  },
  async fetchResults(limit = 6) {
    const { data, error } = await sbClient
      .from('resultados_publicos')
      .select('*')
      .order('data_evento', { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return []; }
    return data || [];
  }
} : {
  // ===== MOCK API (fallback) =====
  async fetchNews(filter = 'all') {
    // Supabase: let q = supabase.from('noticias').select('*, categorias(nome)')
    //           .order('data_publicacao', { ascending: false })
    //           if (filter !== 'all') q = q.eq('categoria', filter)
    //           return (await q).data
    await new Promise(r => setTimeout(r, 150)); // simular latência
    return filter === 'all'
      ? [...NEWS_DATA].sort((a, b) => new Date(b.data) - new Date(a.data))
      : NEWS_DATA.filter(n => n.categoria === filter)
                 .sort((a, b) => new Date(b.data) - new Date(a.data));
  },

  async fetchHeroSlides() {
    // Supabase: return (await supabase.from('noticias').select().eq('destaque', true).limit(5)).data
    await new Promise(r => setTimeout(r, 50));
    return NEWS_DATA.filter(n => n.destaque);
  },

  async searchNews(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return NEWS_DATA.filter(n =>
      n.titulo.toLowerCase().includes(q) ||
      n.resumo.toLowerCase().includes(q) ||
      (CATEGORIES[n.categoria]?.name.toLowerCase().includes(q))
    ).slice(0, 6);
  },

  async fetchEvents() {
    // Mock: 4 eventos hardcoded para demo (mesmos do HTML antigo)
    const inDays = (d) => {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(20, 0, 0, 0);
      return date.toISOString();
    };
    return [
      { id: 1, titulo: 'Campeonato Nacional — Fase Final', data_evento: inDays(15),
        local: 'Pavilhão de Maxaquene', cidade: 'Maputo',
        categoria_slug: 'basketball', categoria_nome: 'Basketball', categoria_emoji: '🏀' },
      { id: 2, titulo: 'Liga Nacional — Jornada 28', data_evento: inDays(22),
        local: 'Estádio da Machava', cidade: 'Maputo',
        categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽' },
      { id: 3, titulo: 'Open de Moçambique', data_evento: inDays(35),
        local: 'Clube de Ténis', cidade: 'Maputo',
        categoria_slug: 'tennis', categoria_nome: 'Ténis', categoria_emoji: '🎾' },
      { id: 4, titulo: 'Final da Taça de Moçambique', data_evento: inDays(48),
        local: 'Estádio Nacional do Zimpeto', cidade: 'Maputo',
        categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽' },
    ];
  },

  async fetchResults() {
    const daysAgo = (d) => {
      const date = new Date();
      date.setDate(date.getDate() - d);
      return date.toISOString();
    };
    return [
      { origem: 'manual', id: 1,
        titulo: 'Costa do Sol vs Liga Muçulmana',
        equipa_casa: 'Costa do Sol', equipa_fora: 'Liga Muçulmana',
        resultado_casa: 2, resultado_fora: 1,
        data_evento: daysAgo(5),
        competicao: 'Liga Nacional - Jornada 27',
        mvp: 'Geny Catamo',
        observacoes: 'Vitória sofrida do Costa do Sol num jogo equilibrado.',
        estatisticas: [
          { minuto: 23, tipo: 'golo', equipa: 'casa', jogador: 'Geny Catamo' },
          { minuto: 56, tipo: 'golo', equipa: 'fora', jogador: 'Telinho' },
          { minuto: 78, tipo: 'golo', equipa: 'casa', jogador: 'Reginaldo' }
        ],
        categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽' },
      { origem: 'manual', id: 2,
        titulo: 'Maxaquene vs Ferroviário',
        equipa_casa: 'Maxaquene', equipa_fora: 'Ferroviário',
        resultado_casa: 78, resultado_fora: 72,
        data_evento: daysAgo(12),
        competicao: 'Campeonato Nacional 2025/26',
        mvp: 'Custódio Muchate',
        observacoes: 'Triplos decisivos no último período garantiram a vitória.',
        estatisticas: [],
        categoria_slug: 'basketball', categoria_nome: 'Basketball', categoria_emoji: '🏀' },
      { origem: 'manual', id: 3,
        titulo: 'Selecção vs Tanzânia',
        equipa_casa: 'Moçambique', equipa_fora: 'Tanzânia',
        resultado_casa: 1, resultado_fora: 1,
        data_evento: daysAgo(20),
        competicao: 'Qualificação Africana',
        mvp: null, observacoes: null, estatisticas: [],
        categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽' },
    ];
  }
};

/* ============================================================
   1. UTILS
   ============================================================ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateLong = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const escapeHTML = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const highlight = (text, query) => {
  if (!query) return escapeHTML(text);
  const esc = escapeHTML(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return esc.replace(re, '<mark>$1</mark>');
};

/* ============================================================
   2. TOAST
   ============================================================ */
const toastEl = $('#toast');
let toastTimer;
function showToast(message, type = 'info') {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.hidden = false;
  toastEl.textContent = message;
  toastEl.className = `toast toast--${type} show`;
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => { toastEl.hidden = true; }, 300);
  }, 2800);
}

/* ============================================================
   3. FAVORITOS (localStorage)
   ============================================================ */
const FAV_KEY = 'podium_favorites_v1';
const favorites = {
  get() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
    catch { return []; }
  },
  set(list) {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    updateFavoritesBadge();
  },
  has(id) { return this.get().includes(id); },
  toggle(id) {
    const list = this.get();
    const idx = list.indexOf(id);
    if (idx >= 0) { list.splice(idx, 1); this.set(list); return false; }
    list.push(id); this.set(list); return true;
  }
};

function updateFavoritesBadge() {
  const badge = $('#favoritesCount');
  const count = favorites.get().length;
  if (!badge) return;
  badge.textContent = count;
  badge.hidden = count === 0;
}

/* ============================================================
   4. HERO SLIDER
   ============================================================ */
const HERO_AUTOPLAY_MS = 6000;

async function initHeroSlider() {
  const track    = $('#heroTrack');
  const dotsWrap = $('#heroDots');
  const progress = $('#heroProgress');
  const prev     = $('#heroPrev');
  const next     = $('#heroNext');
  if (!track) return;

  const slides = await api.fetchHeroSlides();
  if (!slides.length) return;
  cacheNews(slides);

  // Render slides
  track.innerHTML = slides.map((s, i) => {
    const cat = CATEGORIES[s.categoria] || {};
    // Imagem pode vir de Supabase (s.imagem) ou de mock (s.imagem); fallback gradient por categoria
    const bgImage = s.imagem ? `style="background-image:url('${escapeHTML(s.imagem)}')"` : '';
    const fallbackClass = !s.imagem ? `news-card__img--${s.categoria}` : '';
    return `
      <div class="hero-slide ${i === 0 ? 'active' : ''}" data-index="${i}" data-id="${s.id}" role="group" aria-roledescription="slide" aria-label="Slide ${i + 1} de ${slides.length}">
        <div class="hero-slide__bg ${fallbackClass}" ${bgImage}></div>
        <div class="hero-slide__overlay"></div>
        <div class="hero-slide__content">
          <span class="hero-slide__eyebrow">${cat.emoji || ''} ${cat.name || 'Desporto'} · Destaque</span>
          <div class="hero-slide__meta">
            <time datetime="${s.data}">${formatDate(s.data)}</time>
            <span>Por ${escapeHTML(s.autor)}</span>
          </div>
          <h1 class="hero-slide__title">${escapeHTML(s.titulo)}</h1>
          <p class="hero-slide__desc">${escapeHTML(s.resumo)}</p>
          <div class="hero-slide__cta">
            <button class="btn btn--primary" data-open-article="${s.id}">Ler artigo</button>
            <a href="#noticias" class="btn btn--outline">Mais notícias</a>
          </div>
        </div>
      </div>`;
  }).join('');

  // Dots
  dotsWrap.innerHTML = slides.map((_, i) =>
    `<button class="${i === 0 ? 'active' : ''}" data-slide="${i}" role="tab" aria-selected="${i === 0}" aria-label="Ir para slide ${i + 1}"></button>`
  ).join('');

  let currentSlide = 0;
  let autoplayId;
  let progressStart;
  let progressRaf;

  function goTo(index) {
    const slideEls = $$('.hero-slide', track);
    const dotEls   = $$('button', dotsWrap);
    slideEls.forEach(el => el.classList.remove('active'));
    dotEls.forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-selected', 'false');
    });
    slideEls[index].classList.add('active');
    dotEls[index].classList.add('active');
    dotEls[index].setAttribute('aria-selected', 'true');
    currentSlide = index;
    restartProgress();
  }

  const nextSlide = () => goTo((currentSlide + 1) % slides.length);
  const prevSlide = () => goTo((currentSlide - 1 + slides.length) % slides.length);

  function startAutoplay() {
    stopAutoplay();
    autoplayId = setInterval(nextSlide, HERO_AUTOPLAY_MS);
    restartProgress();
  }
  function stopAutoplay() {
    clearInterval(autoplayId);
    cancelAnimationFrame(progressRaf);
  }

  function restartProgress() {
    if (!progress) return;
    progress.style.transition = 'none';
    progress.style.width = '0%';
    // Force reflow para reiniciar a animação
    // eslint-disable-next-line no-unused-expressions
    progress.offsetWidth;
    progress.style.transition = `width ${HERO_AUTOPLAY_MS}ms linear`;
    progress.style.width = '100%';
  }

  // Setas
  prev?.addEventListener('click', () => { prevSlide(); startAutoplay(); });
  next?.addEventListener('click', () => { nextSlide(); startAutoplay(); });

  // Dots
  dotsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-slide]');
    if (!btn) return;
    goTo(parseInt(btn.dataset.slide, 10));
    startAutoplay();
  });

  // Pausar no hover
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  // Pausar quando tab perde foco (performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // Swipe mobile
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
    startAutoplay();
  }, { passive: true });

  // Teclado (setas)
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.modalOpen === 'true') return;
    if (e.key === 'ArrowLeft'  && document.activeElement === document.body) prevSlide();
    if (e.key === 'ArrowRight' && document.activeElement === document.body) nextSlide();
  });

  // Click em "Ler artigo"
  track.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-article]');
    if (btn) openArticleModal(parseInt(btn.dataset.openArticle, 10));
  });

  // Respeitar prefers-reduced-motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAutoplay();
  }
}

/* ============================================================
   5. NAVBAR — scroll state, dropdowns, mobile menu
   ============================================================ */
function initNavbar() {
  const header    = $('#header');
  const hamburger = $('#hamburger');
  const nav       = $('#nav');

  // Scroll state
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger mobile
  const closeMenu = () => {
    nav?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Fechar dropdowns abertos
    $$('.nav__dropdown.open').forEach(d => d.classList.remove('open'));
  };

  hamburger?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Dropdowns
  $$('.nav__dropdown').forEach(dropdown => {
    const toggle = $('.nav__dropdown-toggle', dropdown);
    toggle?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = dropdown.classList.contains('open');
      // Fechar outros dropdowns
      $$('.nav__dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
        $('.nav__dropdown-toggle', d)?.setAttribute('aria-expanded', 'false');
      });
      dropdown.classList.toggle('open', !wasOpen);
      toggle.setAttribute('aria-expanded', String(!wasOpen));
    });
  });

  // Fechar dropdowns ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__dropdown')) {
      $$('.nav__dropdown.open').forEach(d => {
        d.classList.remove('open');
        $('.nav__dropdown-toggle', d)?.setAttribute('aria-expanded', 'false');
      });
    }
    // Fechar menu mobile ao clicar fora
    if (nav?.classList.contains('open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      closeMenu();
    }
  });

  // Fechar com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeMobileSearch();
    }
  });

  // Ao clicar em link do menu mobile, fechar
  $$('.nav__link:not(.nav__dropdown-toggle)', nav).forEach(link => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('open')) closeMenu();
    });
  });

  // Ao clicar em link de dropdown (desporto com data-filter), aplicar filtro
  $$('.nav__dropdown-menu a[data-filter]').forEach(a => {
    a.addEventListener('click', (e) => {
      const filter = a.dataset.filter;
      if (filter) {
        activateFilter(filter);
        closeMenu();
      }
    });
  });

  // Active link baseado em scroll
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link[data-section]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   6. PESQUISA (live, desktop + mobile)
   ============================================================ */
function initSearch() {
  const input        = $('#searchInput');
  const results      = $('#searchResults');
  const toggleMobile = $('#searchToggleMobile');
  const mobileBox    = $('#mobileSearch');
  const mobileInput  = $('#mobileSearchInput');
  const closeMobile  = $('#searchCloseMobile');

  let debounceTimer;
  const runSearch = async (query, target) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!query.trim()) {
        target.classList.remove('open');
        target.innerHTML = '';
        return;
      }
      const found = await api.searchNews(query);
      if (found.length === 0) {
        target.innerHTML = `<div class="search-results__empty">Nada encontrado para "${escapeHTML(query)}"</div>`;
      } else {
        target.innerHTML = found.map(n => {
          const cat = CATEGORIES[n.categoria] || {};
          return `
            <div class="search-results__item" data-open-article="${n.id}" role="option" tabindex="0">
              <span class="search-results__emoji">${cat.emoji || '📰'}</span>
              <div class="search-results__text">
                <span class="search-results__title">${highlight(n.titulo, query)}</span>
                <span class="search-results__cat">${cat.name || ''}</span>
              </div>
            </div>`;
        }).join('');
      }
      target.classList.add('open');
    }, 180);
  };

  input?.addEventListener('input', (e) => runSearch(e.target.value, results));
  input?.addEventListener('focus', (e) => { if (e.target.value) runSearch(e.target.value, results); });

  // Fechar resultados ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) results?.classList.remove('open');
  });

  // Click em resultado → abrir modal
  results?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-open-article]');
    if (item) {
      openArticleModal(parseInt(item.dataset.openArticle, 10));
      results.classList.remove('open');
      input.value = '';
    }
  });

  // ------- Mobile search toggle -------
  toggleMobile?.addEventListener('click', () => {
    mobileBox.hidden = false;
    setTimeout(() => mobileInput?.focus(), 50);
  });
  closeMobile?.addEventListener('click', closeMobileSearch);
  mobileInput?.addEventListener('input', async (e) => {
    // Reutilizamos o mesmo dropdown de resultados (desktop) por simplicidade
    const q = e.target.value;
    if (!q.trim()) return;
    const found = await api.searchNews(q);
    if (found.length === 0) { showToast(`Nada encontrado para "${q}"`, 'info'); return; }
    // Em mobile: abrir directamente o primeiro resultado numa tecla Enter
  });
  mobileInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const found = await api.searchNews(mobileInput.value);
      if (found.length > 0) {
        openArticleModal(found[0].id);
        closeMobileSearch();
      } else showToast('Sem resultados', 'info');
    }
  });
}

function closeMobileSearch() {
  const mobileBox = $('#mobileSearch');
  if (mobileBox) {
    mobileBox.hidden = true;
    const input = $('#mobileSearchInput');
    if (input) input.value = '';
  }
}

/* ============================================================
   7. NOTÍCIAS — render, filtros, load more
   ============================================================ */
const PAGE_SIZE = 6;
const state = {
  filter: 'all',
  page: 1,
  all: [],
};

function buildNewsCard(n) {
  const cat = CATEGORIES[n.categoria] || {};
  const isFav = favorites.has(n.id);
  // Imagem: vem do mock (n.imagem) ou Supabase (n.imagem) — campo já normalizado
  const hasImg = !!n.imagem;
  const imgStyle = hasImg ? `style="background-image:url('${escapeHTML(n.imagem)}')"` : '';
  return `
    <article class="news-card reveal visible" data-id="${n.id}">
      <div class="news-card__img ${hasImg ? 'news-card__img--photo' : `news-card__img--${n.categoria}`}" ${imgStyle}>
        ${hasImg ? '' : `<span class="news-card__emoji">${cat.emoji || '📰'}</span>`}
        <button class="news-card__fav ${isFav ? 'active' : ''}" data-fav="${n.id}"
                aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                aria-pressed="${isFav}">
          <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="news-card__body">
        <div class="news-card__meta">
          <span class="tag ${cat.tagClass || ''}">${cat.name || ''}</span>
          <time datetime="${n.data}">${formatDate(n.data)}</time>
        </div>
        <h3>${escapeHTML(n.titulo)}</h3>
        <p>${escapeHTML(n.resumo)}</p>
        <span class="news-card__link" data-open-article="${n.id}">Ler mais →</span>
      </div>
    </article>
  `;
}

function buildSkeletonCard() {
  return `
    <article class="news-card news-card--skeleton">
      <div class="news-card__img"></div>
      <div class="news-card__body">
        <div class="news-card__meta"><span>·····</span><span>·····</span></div>
        <h3>·</h3>
        <p>·</p>
      </div>
    </article>`;
}

async function renderNews({ showSkeleton = true } = {}) {
  const grid      = $('#newsGrid');
  const emptyEl   = $('#newsEmpty');
  const loadBtn   = $('#loadMoreBtn');
  if (!grid) return;

  if (showSkeleton) {
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = Array(PAGE_SIZE).fill(0).map(buildSkeletonCard).join('');
  }

  state.all = await api.fetchNews(state.filter);
  cacheNews(state.all);
  const slice = state.all.slice(0, state.page * PAGE_SIZE);

  grid.setAttribute('aria-busy', 'false');
  if (state.all.length === 0) {
    grid.innerHTML = '';
    emptyEl.hidden = false;
    loadBtn.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  grid.innerHTML = slice.map(buildNewsCard).join('');
  loadBtn.hidden = slice.length >= state.all.length;
}

function activateFilter(filter) {
  state.filter = filter;
  state.page = 1;
  $$('.filter-chip').forEach(c => {
    const active = c.dataset.filter === filter;
    c.classList.toggle('active', active);
    c.setAttribute('aria-selected', String(active));
  });
  // Scroll para a secção de notícias se veio de link externo
  const news = $('#noticias');
  if (news && window.scrollY < news.offsetTop - 200) {
    news.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  renderNews();
}

function initNewsSection() {
  // Filtros
  $('#newsFilters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (chip) activateFilter(chip.dataset.filter);
  });

  // Load more
  $('#loadMoreBtn')?.addEventListener('click', () => {
    state.page++;
    renderNews({ showSkeleton: false });
  });

  // Clear filters
  $('#clearFilters')?.addEventListener('click', () => activateFilter('all'));

  // Delegação: click em card → abrir modal; click em favorito → toggle
  $('#newsGrid')?.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      const id = parseInt(favBtn.dataset.fav, 10);
      const added = favorites.toggle(id);
      favBtn.classList.toggle('active', added);
      favBtn.setAttribute('aria-pressed', String(added));
      favBtn.setAttribute('aria-label', added ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      favBtn.innerHTML = `<i class="${added ? 'fas' : 'far'} fa-heart"></i>`;
      showToast(added ? '⭐ Adicionado aos favoritos' : 'Removido dos favoritos', added ? 'success' : 'info');
      return;
    }
    const openBtn = e.target.closest('[data-open-article]');
    if (openBtn) openArticleModal(parseInt(openBtn.dataset.openArticle, 10));
  });

  // Click em cat-card → filtra
  $$('.cat-card[data-filter]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => activateFilter(card.dataset.filter));
  });

  // Botão de favoritos no header → mostrar só favoritos
  $('#favoritesBtn')?.addEventListener('click', () => {
    const list = favorites.get();
    if (list.length === 0) {
      showToast('Ainda não tem notícias favoritas', 'info');
      return;
    }
    // Mostrar apenas favoritos
    state.filter = '__favorites';
    state.page = 1;
    $$('.filter-chip').forEach(c => c.classList.remove('active'));
    const news = $('#noticias');
    news?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Render custom
    (async () => {
      const grid = $('#newsGrid');
      const all = await api.fetchNews('all');
      const favs = all.filter(n => list.includes(n.id));
      state.all = favs;
      grid.innerHTML = favs.map(buildNewsCard).join('');
      $('#newsEmpty').hidden = favs.length > 0;
      $('#loadMoreBtn').hidden = true;
    })();
  });

  renderNews();
}

/* ============================================================
   8. MODAL DE NOTÍCIA
   ============================================================ */
/** Cache de notícias já carregadas (para lookup rápido no modal) */
const newsCache = new Map();
function cacheNews(list) { list.forEach(n => newsCache.set(n.id, n)); }

async function findArticleById(id) {
  if (newsCache.has(id)) return newsCache.get(id);
  // Não está em cache — carregar tudo (raro, mas possível)
  const all = await api.fetchNews('all');
  cacheNews(all);
  return newsCache.get(id) || null;
}

/** Navegar para a página dedicada da notícia */
async function openArticleModal(id) {
  const article = await findArticleById(id);
  if (!article) { showToast('Notícia não encontrada', 'error'); return; }
  const slug = article.slug || `id-${article.id}`;
  window.location.href = `noticia.html?slug=${encodeURIComponent(slug)}`;
}

/* ============================================================
   8b. AGENDA DESPORTIVA
   ============================================================ */
async function initAgenda() {
  const timeline = $('#agendaTimeline');
  const loading  = $('#agendaLoading');
  const empty    = $('#agendaEmpty');
  if (!timeline) return;

  try {
    const events = await api.fetchEvents(8);

    if (loading) loading.remove();

    if (!events || events.length === 0) {
      timeline.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    timeline.innerHTML = events.map(e => {
      const cat = e.categoria_slug || 'futebol';
      const catName = e.categoria_nome || CATEGORIES[cat]?.name || 'Desporto';
      const tagClass = CATEGORIES[cat]?.tagClass || '';
      const dateObj = new Date(e.data_evento);
      const dia = dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
      const hora = dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      const localCidade = [e.local, e.cidade].filter(Boolean).join(' · ') || '';

      // Equipas vs (se houver)
      const equipas = (e.equipa_casa && e.equipa_fora)
        ? `<p class="timeline__teams"><strong>${escapeHTML(e.equipa_casa)}</strong> <span>vs</span> <strong>${escapeHTML(e.equipa_fora)}</strong></p>`
        : '';

      // Resultado se terminado
      const resultado = (e.status === 'terminado' && e.resultado_casa != null && e.resultado_fora != null)
        ? `<p class="timeline__result">Resultado final: <strong>${e.resultado_casa} – ${e.resultado_fora}</strong></p>`
        : '';

      // Status badge
      const statusBadge = e.status && e.status !== 'agendado'
        ? `<span class="timeline__status timeline__status--${e.status}">${{
            em_curso: 'Em curso',
            terminado: 'Terminado',
            cancelado: 'Cancelado',
            adiado: 'Adiado'
          }[e.status] || ''}</span>`
        : '';

      return `
        <div class="timeline__item">
          <div class="timeline__dot"></div>
          <div class="timeline__date">${dia}<br><span class="timeline__time">${hora}</span></div>
          <div class="timeline__content">
            <div class="timeline__tags">
              <span class="tag ${tagClass}">${e.categoria_emoji || ''} ${escapeHTML(catName)}</span>
              ${statusBadge}
            </div>
            <h3>${escapeHTML(e.titulo)}</h3>
            ${equipas}
            ${resultado}
            ${localCidade ? `<p class="timeline__location">${escapeHTML(localCidade)}</p>` : ''}
            ${e.competicao ? `<p class="timeline__competition">${escapeHTML(e.competicao)}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar agenda:', err);
    if (loading) loading.remove();
    if (empty) empty.hidden = false;
  }
}

/* ============================================================
   8c. RESULTADOS — Cards resumidos no index
   ============================================================ */
async function initResultados() {
  const grid    = $('#resultadosGrid');
  const loading = $('#resultadosLoading');
  const empty   = $('#resultadosEmpty');
  if (!grid) return;

  try {
    const results = await api.fetchResults(6);

    if (loading) loading.remove();

    if (!results || results.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    grid.innerHTML = results.map(r => {
      const cat = r.categoria_slug || 'futebol';
      const tagClass = CATEGORIES[cat]?.tagClass || '';
      const dateObj = new Date(r.data_evento);
      const dia = dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
      const winner = r.resultado_casa > r.resultado_fora ? 'casa'
        : r.resultado_casa < r.resultado_fora ? 'fora' : 'draw';

      return `
        <article class="result-card" data-categoria="${cat}">
          <div class="result-card__head">
            <span class="tag ${tagClass}">${r.categoria_emoji || ''} ${escapeHTML(r.categoria_nome || '')}</span>
            <time class="result-card__date">${dia}</time>
          </div>
          ${r.competicao ? `<p class="result-card__comp">${escapeHTML(r.competicao)}</p>` : ''}
          <div class="result-card__score">
            <div class="result-card__team result-card__team--${winner === 'casa' ? 'winner' : winner === 'fora' ? 'loser' : ''}">
              <span class="result-card__team-name">${escapeHTML(r.equipa_casa)}</span>
              <span class="result-card__team-score">${r.resultado_casa}</span>
            </div>
            <div class="result-card__team result-card__team--${winner === 'fora' ? 'winner' : winner === 'casa' ? 'loser' : ''}">
              <span class="result-card__team-name">${escapeHTML(r.equipa_fora)}</span>
              <span class="result-card__team-score">${r.resultado_fora}</span>
            </div>
          </div>
          ${r.mvp ? `<div class="result-card__mvp">⭐ MVP: <strong>${escapeHTML(r.mvp)}</strong></div>` : ''}
        </article>
      `;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar resultados:', err);
    if (loading) loading.remove();
    if (empty) empty.hidden = false;
  }
}

/* ============================================================
   9. STATS COUNTER
   ============================================================ */
function initStatsCounter() {
  const nums = $$('.stat__number[data-target]');
  if (!nums.length) return;

  const animate = (el, target, duration = 2000) => {
    const start = performance.now();
    const isLarge = target >= 1000;
    const displayTarget = isLarge ? target / 1000 : target;
    const suffix = isLarge ? 'K+' : '+';
    const step = (ts) => {
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * displayTarget) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = displayTarget + suffix;
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        nums.forEach(el => animate(el, parseInt(el.dataset.target, 10)));
        o.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const bar = $('.stats-bar');
  if (bar) obs.observe(bar);
}

/* ============================================================
   10. NEWSLETTER
   ============================================================ */
function initNewsletter() {
  const form = $('#newsletterForm');
  const input = $('#emailInput');
  const err = $('#formError');
  const ok = $('#formSuccess');
  if (!form) return;

  const valid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  input?.addEventListener('input', () => {
    err.textContent = ''; ok.textContent = '';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    err.textContent = ''; ok.textContent = '';

    if (!email)        { err.textContent = 'Por favor, introduza o seu email.'; input.focus(); return; }
    if (!valid(email)) { err.textContent = 'Por favor, introduza um email válido.'; input.focus(); return; }

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = '…';
    btn.disabled = true;

    setTimeout(() => {
      ok.textContent = '✓ Subscrito com sucesso!';
      input.value = '';
      btn.textContent = oldText;
      btn.disabled = false;
      showToast('✓ Bem-vindo à Podium!', 'success');
      setTimeout(() => { ok.textContent = ''; }, 5000);
    }, 900);
  });
}

/* ============================================================
   11. SCROLL SUAVE em links âncora
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   12. SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  const els = $$(
    '.cat-card, .timeline__item, .stat, .about__content, .about__visual, ' +
    '.categories__header, .agenda__header'
  );
  els.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => obs.observe(el));
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateFavoritesBadge();
  initNavbar();
  initSearch();
  initHeroSlider();
  initNewsSection();
  initAgenda();
  initResultados();
  initStatsCounter();
  initNewsletter();
  initSmoothScroll();
  initScrollReveal();
});
