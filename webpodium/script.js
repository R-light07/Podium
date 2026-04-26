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
const CATEGORIES = {
  futebol:     { name: 'Futebol',    emoji: '⚽', tagClass: 'tag--football'   },
  basketball:  { name: 'Basketball', emoji: '🏀', tagClass: 'tag--basketball' },
  tennis:      { name: 'Ténis',      emoji: '🎾', tagClass: 'tag--tennis'     },
  atletismo:   { name: 'Atletismo',  emoji: '🏃', tagClass: 'tag--football'   },
  motorsport:  { name: 'Motorsport', emoji: '🏎️', tagClass: 'tag--tennis'     },
  volei:       { name: 'Voleibol',   emoji: '🏐', tagClass: 'tag--basketball' }
};

/** Notícias mock — simula tabela `noticias` do Supabase */
const NEWS_DATA = [
  {
    id: 1, categoria: 'basketball', destaque: true,
    titulo: 'Clássico decisivo termina em vitória emocionante',
    resumo: 'O confronto entre rivais foi marcado por grande intensidade do início ao fim, com uma das equipas a destacar-se e garantir uma vitória merecida.',
    conteudo: [
      'O pavilhão de Maxaquene recebeu na noite de ontem um dos clássicos mais aguardados da temporada. A intensidade esteve presente desde o apito inicial, com ambas as equipas a mostrarem um nível técnico elevado.',
      'A primeira parte terminou com uma diferença mínima no marcador, sinal do equilíbrio que se verificou em campo. No segundo tempo, uma série de triplos consecutivos quebrou o empate e inclinou definitivamente a balança.',
      'Com esta vitória, a equipa consolida a liderança do campeonato e mantém vivas as aspirações de conquistar o título nacional pela terceira temporada consecutiva.'
    ],
    data: '2026-03-25', autor: 'Ana Cossa',
  },
  {
    id: 2, categoria: 'futebol', destaque: true,
    titulo: 'Jovem talentosa destaca-se na liga nacional',
    resumo: 'Um novo nome começa a ganhar destaque após uma atuação impressionante. A atleta tem sido peça-chave e promete ser uma das revelações da temporada.',
    conteudo: [
      'Aos apenas 19 anos, a jogadora tem impressionado críticos e adeptos com exibições consistentes. O seu estilo técnico, combinado com uma maturidade rara, coloca-a no radar dos principais clubes do país.',
      'Na última jornada, foi decisiva ao assistir para dois golos e marcar o terceiro, liderando a equipa a uma vitória fora de casa.'
    ],
    data: '2026-03-24', autor: 'Pedro Antunes',
  },
  {
    id: 3, categoria: 'tennis', destaque: true,
    titulo: 'Preparação intensa para o próximo torneio internacional',
    resumo: 'As equipas já estão focadas nos treinos e estratégias para representar o país no cenário internacional, com grandes expectativas dos adeptos.',
    conteudo: [
      'O Open de Moçambique aproxima-se e os nossos representantes intensificam a preparação. Treinos duplos, análise de adversários e trabalho mental são a rotina diária nas últimas semanas.',
      'A comissão técnica mostra-se confiante nas escolhas feitas e acredita numa participação de destaque, depois dos bons resultados da época passada.'
    ],
    data: '2026-03-20', autor: 'Xavier Macuacua',
  },
  {
    id: 4, categoria: 'atletismo', destaque: false,
    titulo: 'Novo recorde nacional nos 800 metros',
    resumo: 'O atleta moçambicano superou a marca que resistia há mais de uma década, num desempenho que surpreendeu o próprio corpo técnico.',
    conteudo: [
      'Num encontro internacional em Pretória, o jovem atleta bateu o recorde nacional dos 800 metros com uma prova tacticamente perfeita. O tempo final coloca-o entre os 20 melhores do ranking africano da distância.',
      'O feito é ainda mais relevante por representar uma melhoria significativa face à sua melhor marca pessoal desta temporada.'
    ],
    data: '2026-03-18', autor: 'Carlos Matsinhe',
  },
  {
    id: 5, categoria: 'futebol', destaque: false,
    titulo: 'Federação anuncia novo formato da liga',
    resumo: 'As alterações visam tornar o campeonato mais competitivo e atractivo, com a introdução de play-offs finais para definir o campeão.',
    conteudo: [
      'A Federação Moçambicana de Futebol anunciou esta semana um conjunto de mudanças estruturais no formato da liga. A partir da próxima temporada, os quatro primeiros classificados disputarão play-offs eliminatórios.',
      'A medida foi bem recebida pela maioria dos clubes, que vêem nela uma oportunidade de aumentar o interesse dos adeptos e o valor comercial da competição.'
    ],
    data: '2026-03-15', autor: 'Ana Cossa',
  },
  {
    id: 6, categoria: 'motorsport', destaque: false,
    titulo: 'Equipa nacional estreia-se em prova continental',
    resumo: 'Uma equipa de GT3 moçambicana participa pela primeira vez num campeonato pan-africano, abrindo caminho para o automobilismo nacional.',
    conteudo: [
      'A primeira participação de uma equipa moçambicana numa prova de GT3 a nível continental representa um marco histórico. Os pilotos, apesar de estreantes, mostraram ritmo competitivo.',
      'O objectivo principal desta temporada é acumular experiência e preparar uma participação mais sólida no próximo ano.'
    ],
    data: '2026-03-12', autor: 'Pedro Antunes',
  },
  {
    id: 7, categoria: 'basketball', destaque: false,
    titulo: 'Jovens promessas brilham no torneio juvenil',
    resumo: 'O campeonato juvenil revelou talentos impressionantes, com vários jogadores a chamarem a atenção dos olheiros nacionais.',
    conteudo: [
      'O torneio juvenil terminou com grande entusiasmo nas bancadas. Vários jovens de diferentes províncias mostraram que o futuro do basketball nacional está em boas mãos.',
      'Os três melhores marcadores da competição receberam convites para estágios com a selecção sub-18.'
    ],
    data: '2026-03-10', autor: 'Xavier Macuacua',
  },
  {
    id: 8, categoria: 'volei', destaque: false,
    titulo: 'Selecção feminina prepara qualificação africana',
    resumo: 'As jogadoras iniciaram uma concentração de três semanas com vista à próxima fase de qualificação para o campeonato continental.',
    conteudo: [
      'A preparação inclui trabalho físico específico, treinos técnico-tácticos e jogos de preparação contra equipas regionais. O corpo técnico destaca a dedicação e o espírito do grupo.',
      'A qualificação realiza-se em Maio e reunirá seis selecções que disputam duas vagas para o Afrobasket.'
    ],
    data: '2026-03-08', autor: 'Carlos Matsinhe',
  },
  {
    id: 9, categoria: 'tennis', destaque: false,
    titulo: 'Academia de ténis abre em Matola',
    resumo: 'Um novo espaço dedicado à formação de jovens tenistas abriu portas na Matola, com cursos para todas as idades e níveis.',
    conteudo: [
      'A nova academia conta com quatro campos, ginásio e áreas pedagógicas. Os fundadores pretendem descobrir e formar talentos desde a base.',
      'Já estão abertas as inscrições para o primeiro ciclo de formação, com turmas para crianças a partir dos 6 anos.'
    ],
    data: '2026-03-05', autor: 'Ana Cossa',
  },
  {
    id: 10, categoria: 'futebol', destaque: false,
    titulo: 'Treinador nacional renova contrato',
    resumo: 'Após resultados positivos, o seleccionador continuará à frente da equipa principal por mais dois anos.',
    conteudo: [
      'A renovação surge depois de uma campanha consistente nas últimas qualificações, com a selecção a subir no ranking continental.',
      'O treinador destacou, em conferência de imprensa, a importância da estabilidade e do plano a longo prazo para o desenvolvimento do futebol moçambicano.'
    ],
    data: '2026-03-03', autor: 'Pedro Antunes',
  },
  {
    id: 11, categoria: 'atletismo', destaque: false,
    titulo: 'Maratona de Maputo regista recorde de inscrições',
    resumo: 'A edição deste ano bateu todos os recordes, com participantes de mais de 15 países inscritos na prova.',
    conteudo: [
      'A organização confirmou mais de 5 000 inscrições para as diferentes distâncias (meia-maratona e maratona completa), um crescimento de 40% face ao ano anterior.',
      'O percurso passa pelos principais pontos turísticos da cidade e termina na marginal.'
    ],
    data: '2026-02-28', autor: 'Carlos Matsinhe',
  },
  {
    id: 12, categoria: 'basketball', destaque: false,
    titulo: 'Clube negoceia regresso de lenda do basquetebol',
    resumo: 'Um dos jogadores mais emblemáticos da última década pode regressar ao clube que o formou.',
    conteudo: [
      'As negociações encontram-se em fase avançada e as duas partes mostram-se optimistas em fechar o acordo nos próximos dias.',
      'A adeptos reagiram com grande entusiasmo à notícia nas redes sociais.'
    ],
    data: '2026-02-25', autor: 'Xavier Macuacua',
  }
];

/* ------- "API" — Supabase quando configurado, mock caso contrário ------- */
const sbClient = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;

// Mapa usado para normalizar registos Supabase → formato interno
function normalizeFromSupabase(row) {
  if (!row) return null;
  // row vem da view `noticias_publicas` (ou join com categorias)
  const cat = row.categorias || {};
  return {
    id:        row.id,
    categoria: row.categoria_slug || cat.slug || 'futebol',
    destaque:  !!row.destaque,
    titulo:    row.titulo,
    resumo:    row.resumo,
    conteudo:  Array.isArray(row.conteudo) ? row.conteudo : [row.conteudo || ''].filter(Boolean),
    data:      row.data_publicacao,
    autor:     row.autor || 'Equipa Podium',
    imagem:    row.imagem_url || null,
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
const HERO_AUTOPLAY_MS = 3000;

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
    return `
      <div class="hero-slide ${i === 0 ? 'active' : ''}" data-index="${i}" data-id="${s.id}" role="group" aria-roledescription="slide" aria-label="Slide ${i + 1} de ${slides.length}">
        <div class="hero-slide__bg news-card__img--${s.categoria}"></div>
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
  return `
    <article class="news-card reveal visible" data-id="${n.id}">
      <div class="news-card__img news-card__img--${n.categoria}">
        <span class="news-card__emoji">${cat.emoji || '📰'}</span>
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

async function openArticleModal(id) {
  const article = await findArticleById(id);
  if (!article) { showToast('Notícia não encontrada', 'error'); return; }

  const modal   = $('#articleModal');
  const content = $('#articleModalContent');
  const cat = CATEGORIES[article.categoria] || {};
  const isFav = favorites.has(id);

  content.innerHTML = `
    <header class="article-modal__hero news-card__img--${article.categoria}">
      <span class="article-modal__hero-emoji">${cat.emoji || '📰'}</span>
    </header>
    <div class="article-modal__body">
      <div class="article-modal__meta">
        <span class="tag ${cat.tagClass || ''}">${cat.name || ''}</span>
        <time datetime="${article.data}">${formatDateLong(article.data)}</time>
        <span>Por <strong>${escapeHTML(article.autor)}</strong></span>
      </div>
      <h2 id="articleModalTitle" class="article-modal__title">${escapeHTML(article.titulo)}</h2>
      <p class="article-modal__lead">${escapeHTML(article.resumo)}</p>
      <div class="article-modal__text">
        ${article.conteudo.map(p => `<p>${escapeHTML(p)}</p>`).join('')}
      </div>
      <div class="article-modal__actions">
        <span class="article-modal__actions-label">Partilhar:</span>
        <button class="share-btn share-btn--fav ${isFav ? 'active' : ''}" data-share="fav" data-id="${id}" aria-label="Adicionar aos favoritos">
          <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <button class="share-btn" data-share="facebook" aria-label="Partilhar no Facebook"><i class="fab fa-facebook-f"></i></button>
        <button class="share-btn" data-share="twitter"  aria-label="Partilhar no X/Twitter"><i class="fab fa-x-twitter"></i></button>
        <button class="share-btn" data-share="whatsapp" aria-label="Partilhar no WhatsApp"><i class="fab fa-whatsapp"></i></button>
        <button class="share-btn" data-share="link"     aria-label="Copiar link"><i class="fas fa-link"></i></button>
      </div>
    </div>`;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.body.dataset.modalOpen = 'true';

  // Focus no botão fechar para acessibilidade
  setTimeout(() => $('.article-modal__close', modal)?.focus(), 50);

  // Acções de partilha
  content.addEventListener('click', handleShareClick);
}

function handleShareClick(e) {
  const btn = e.target.closest('[data-share]');
  if (!btn) return;

  const url = window.location.href;
  const title = $('#articleModalTitle')?.textContent || 'Podium';
  const text = encodeURIComponent(`${title} — via Podium`);

  switch (btn.dataset.share) {
    case 'fav': {
      const id = parseInt(btn.dataset.id, 10);
      const added = favorites.toggle(id);
      btn.classList.toggle('active', added);
      btn.innerHTML = `<i class="${added ? 'fas' : 'far'} fa-heart"></i>`;
      // sincronizar com card na lista
      const cardFav = $(`[data-fav="${id}"]`);
      if (cardFav) {
        cardFav.classList.toggle('active', added);
        cardFav.innerHTML = `<i class="${added ? 'fas' : 'far'} fa-heart"></i>`;
      }
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
}

function closeArticleModal() {
  const modal = $('#articleModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  document.body.dataset.modalOpen = 'false';
}

function initModal() {
  $('#articleModal')?.addEventListener('click', (e) => {
    if (e.target.matches('[data-close="modal"]')) closeArticleModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.dataset.modalOpen === 'true') {
      closeArticleModal();
    }
  });
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
  initModal();
  initStatsCounter();
  initNewsletter();
  initSmoothScroll();
  initScrollReveal();
});
