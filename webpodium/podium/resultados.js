/**
 * PODIUM — RESULTADOS.JS
 * Página dedicada com lista filtrável de resultados.
 */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escapeHTML = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ============================================================
// API
// ============================================================
const sbClient = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;

const CATEGORIES = window.PODIUM_CATEGORIES || {};

const api = {
  async fetchResults() {
    if (sbClient) {
      const { data, error } = await sbClient
        .from('resultados_publicos')
        .select('*')
        .order('data_evento', { ascending: false })
        .limit(50);
      if (error) { console.error(error); return []; }
      return data || [];
    }
    // MOCK fallback
    const daysAgo = (d) => {
      const date = new Date();
      date.setDate(date.getDate() - d);
      return date.toISOString();
    };
    return [
      { origem: 'manual', id: 1,
        equipa_casa: 'Costa do Sol', equipa_fora: 'Liga Muçulmana',
        resultado_casa: 2, resultado_fora: 1, data_evento: daysAgo(5),
        competicao: 'Liga Nacional - Jornada 27', mvp: 'Geny Catamo',
        observacoes: 'Vitória sofrida do Costa do Sol num jogo equilibrado.',
        local: 'Estádio do Costa do Sol', cidade: 'Maputo',
        estatisticas: [
          { minuto: 23, tipo: 'golo', equipa: 'casa', jogador: 'Geny Catamo' },
          { minuto: 56, tipo: 'golo', equipa: 'fora', jogador: 'Telinho' },
          { minuto: 78, tipo: 'golo', equipa: 'casa', jogador: 'Reginaldo' }
        ],
        categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽' },
      { origem: 'manual', id: 2,
        equipa_casa: 'Maxaquene', equipa_fora: 'Ferroviário',
        resultado_casa: 78, resultado_fora: 72, data_evento: daysAgo(12),
        competicao: 'Campeonato Nacional 2025/26', mvp: 'Custódio Muchate',
        observacoes: 'Triplos decisivos no último período garantiram a vitória.',
        local: 'Pavilhão de Maxaquene', cidade: 'Maputo', estatisticas: [],
        categoria_slug: 'basketball', categoria_nome: 'Basketball', categoria_emoji: '🏀' },
      { origem: 'manual', id: 3,
        equipa_casa: 'Moçambique', equipa_fora: 'Tanzânia',
        resultado_casa: 1, resultado_fora: 1, data_evento: daysAgo(20),
        competicao: 'Qualificação Africana',
        local: 'Estádio do Zimpeto', cidade: 'Maputo',
        mvp: null, observacoes: 'Empate justo num jogo intenso.', estatisticas: [],
        categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽' },
    ];
  }
};

// ============================================================
// STATE
// ============================================================
const state = {
  results: [],
  filters: { search: '', categoria: '' }
};

// ============================================================
// RENDER
// ============================================================
function getFiltered() {
  const { search, categoria } = state.filters;
  const s = search.toLowerCase().trim();
  return state.results.filter(r => {
    if (s) {
      const haystack = `${r.equipa_casa} ${r.equipa_fora} ${r.competicao || ''} ${r.mvp || ''}`.toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    if (categoria && r.categoria_slug !== categoria) return false;
    return true;
  });
}

function statIcon(tipo) {
  return ({
    golo:    '⚽',
    periodo: '⏱',
    cartao:  '🟨',
    outro:   '·'
  })[tipo] || '·';
}

function renderStats(stats, equipaCasa, equipaFora) {
  if (!Array.isArray(stats) || stats.length === 0) return '';
  return `
    <div class="result-stats">
      <h4 class="result-stats__title">Eventos do jogo</h4>
      <ul class="result-stats__list">
        ${stats.map(s => {
          // Período/quarto
          if (s.tipo === 'periodo') {
            return `
              <li class="result-stats__item">
                <span class="result-stats__minute">${s.minuto || ''}'</span>
                <span class="result-stats__icon">⏱</span>
                <span>Período: <strong>${s.casa} – ${s.fora}</strong></span>
              </li>`;
          }
          const team = s.equipa === 'casa' ? equipaCasa : equipaFora;
          const teamLabel = s.equipa === 'casa' ? '🏠' : '✈';
          return `
            <li class="result-stats__item">
              <span class="result-stats__minute">${s.minuto || ''}'</span>
              <span class="result-stats__icon">${statIcon(s.tipo)}</span>
              <span>${teamLabel} ${escapeHTML(s.jogador || s.detalhe || '')} <small style="color:var(--clr-muted)">(${escapeHTML(team || '')})</small></span>
            </li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

function renderList() {
  const list  = $('#resultsList');
  const empty = $('#resultsEmpty');
  const filtered = getFiltered();

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.innerHTML = filtered.map(r => {
    const cat = r.categoria_slug || 'futebol';
    const tagClass = CATEGORIES[cat]?.tagClass || '';
    const winner = r.resultado_casa > r.resultado_fora ? 'casa'
      : r.resultado_casa < r.resultado_fora ? 'fora' : 'draw';

    return `
      <article class="result-card result-card--full" data-categoria="${cat}">
        <div class="result-card__head">
          <span class="tag ${tagClass}">${r.categoria_emoji || ''} ${escapeHTML(r.categoria_nome || '')}</span>
          <time class="result-card__date">${formatDate(r.data_evento)}</time>
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
        ${r.observacoes ? `<p class="result-card__obs">${escapeHTML(r.observacoes)}</p>` : ''}
        ${r.mvp ? `<div class="result-card__mvp">⭐ MVP: <strong>${escapeHTML(r.mvp)}</strong></div>` : ''}
        ${renderStats(r.estatisticas, r.equipa_casa, r.equipa_fora)}
      </article>
    `;
  }).join('');
}

function populateCategoryFilter() {
  const sel = $('#resultsCategoria');
  if (!sel) return;
  // Categorias únicas dos resultados
  const seen = new Set();
  const cats = state.results.filter(r => {
    if (!r.categoria_slug || seen.has(r.categoria_slug)) return false;
    seen.add(r.categoria_slug);
    return true;
  });
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map(c => `<option value="${c.categoria_slug}">${c.categoria_emoji || ''} ${escapeHTML(c.categoria_nome || c.categoria_slug)}</option>`).join('');
}

// ============================================================
// EVENTS
// ============================================================
$('#resultsSearch')?.addEventListener('input', (e) => {
  state.filters.search = e.target.value;
  renderList();
});
$('#resultsCategoria')?.addEventListener('change', (e) => {
  state.filters.categoria = e.target.value;
  renderList();
});

// ============================================================
// BOOT
// ============================================================
async function boot() {
  try {
    state.results = await api.fetchResults();
    $('#resultsLoading')?.remove();
    populateCategoryFilter();
    renderList();
  } catch (err) {
    console.error('Erro:', err);
    $('#resultsLoading')?.remove();
    $('#resultsEmpty').hidden = false;
  }
}

boot();
