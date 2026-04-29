/**
 * PODIUM — CLASSIFICACOES.JS
 * Página com tabelas classificativas e top marcadores
 */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escapeHTML = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const sbClient = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;
const CATEGORIES = window.PODIUM_CATEGORIES || {};

const api = {
  async fetchAll() {
    if (sbClient) {
      const [classRes, marcRes, compRes] = await Promise.all([
        sbClient.from('classificacao_publica').select('*'),
        sbClient.from('top_marcadores').select('*'),
        sbClient.from('competicoes').select('*, categorias(slug, nome, emoji)')
                .eq('publicada', true).eq('ativa', true).order('nome'),
      ]);
      return {
        classificacao: classRes.data || [],
        marcadores:    marcRes.data  || [],
        competicoes:   compRes.data  || [],
      };
    }
    // MOCK
    const linhas = await window.PODIUM_MOCK_CLASS();
    return {
      classificacao: linhas.classificacao,
      marcadores:    linhas.marcadores,
      competicoes:   linhas.competicoes,
    };
  }
};

// MOCK fallback (caso script.js não esteja a expôr)
window.PODIUM_MOCK_CLASS = async function() {
  return {
    classificacao: [
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽',
        equipa: 'Costa do Sol', jogos: 8, vitorias: 6, empates: 1, derrotas: 1, gm: 18, gs: 7, diferenca_golos: 11, pontos: 19, ajuste_pontos: 0 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽',
        equipa: 'Liga Muçulmana', jogos: 8, vitorias: 5, empates: 2, derrotas: 1, gm: 14, gs: 6, diferenca_golos: 8, pontos: 17, ajuste_pontos: 0 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽',
        equipa: 'Maxaquene', jogos: 8, vitorias: 4, empates: 2, derrotas: 2, gm: 11, gs: 9, diferenca_golos: 2, pontos: 14, ajuste_pontos: 0 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽',
        equipa: 'Ferroviário', jogos: 8, vitorias: 3, empates: 3, derrotas: 2, gm: 10, gs: 9, diferenca_golos: 1, pontos: 12, ajuste_pontos: 0 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽',
        equipa: 'Desportivo', jogos: 8, vitorias: 2, empates: 2, derrotas: 4, gm: 7, gs: 11, diferenca_golos: -4, pontos: 8, ajuste_pontos: 0 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', categoria_nome: 'Futebol', categoria_emoji: '⚽',
        equipa: 'Têxtil', jogos: 8, vitorias: 1, empates: 1, derrotas: 6, gm: 5, gs: 16, diferenca_golos: -11, pontos: 1, ajuste_pontos: -3 },
      { competicao_id: 2, competicao_nome: 'Campeonato Nacional Basket', competicao_slug: 'basket-nacional', categoria_slug: 'basketball', categoria_nome: 'Basketball', categoria_emoji: '🏀',
        equipa: 'Maxaquene', jogos: 6, vitorias: 5, empates: 0, derrotas: 1, gm: 432, gs: 380, diferenca_golos: 52, pontos: 11, ajuste_pontos: 0 },
      { competicao_id: 2, competicao_nome: 'Campeonato Nacional Basket', competicao_slug: 'basket-nacional', categoria_slug: 'basketball', categoria_nome: 'Basketball', categoria_emoji: '🏀',
        equipa: 'Ferroviário', jogos: 6, vitorias: 4, empates: 0, derrotas: 2, gm: 410, gs: 388, diferenca_golos: 22, pontos: 10, ajuste_pontos: 0 },
      { competicao_id: 2, competicao_nome: 'Campeonato Nacional Basket', competicao_slug: 'basket-nacional', categoria_slug: 'basketball', categoria_nome: 'Basketball', categoria_emoji: '🏀',
        equipa: 'Costa do Sol', jogos: 6, vitorias: 2, empates: 0, derrotas: 4, gm: 380, gs: 401, diferenca_golos: -21, pontos: 8, ajuste_pontos: 0 },
    ],
    marcadores: [
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', jogador: 'Geny Catamo',  equipa: 'Costa do Sol',   golos: 7 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', jogador: 'Telinho',      equipa: 'Liga Muçulmana', golos: 5 },
      { competicao_id: 1, competicao_nome: 'Liga Nacional 2025/26', competicao_slug: 'liga-nacional', categoria_slug: 'futebol', jogador: 'Reginaldo',    equipa: 'Costa do Sol',   golos: 4 },
    ],
    competicoes: [
      { id: 1, nome: 'Liga Nacional 2025/26', slug: 'liga-nacional', pontos_vitoria: 3, pontos_empate: 1, pontos_derrota: 0, categorias: { slug: 'futebol', nome: 'Futebol', emoji: '⚽' } },
      { id: 2, nome: 'Campeonato Nacional Basket', slug: 'basket-nacional', pontos_vitoria: 2, pontos_empate: 1, pontos_derrota: 0, categorias: { slug: 'basketball', nome: 'Basketball', emoji: '🏀' } },
    ]
  };
};

const state = {
  classificacao: [],
  marcadores: [],
  competicoes: [],
  filters: { categoria: '', competicao: '' }
};

function populateFilters() {
  // Categorias únicas
  const cats = new Set();
  state.competicoes.forEach(c => {
    const slug = c.categorias?.slug || c.categoria_slug;
    if (slug) cats.add(JSON.stringify({ slug, nome: c.categorias?.nome, emoji: c.categorias?.emoji }));
  });
  $('#filterCategoria').innerHTML = '<option value="">Todas as categorias</option>' +
    [...cats].map(s => {
      const c = JSON.parse(s);
      return `<option value="${c.slug}">${c.emoji || ''} ${escapeHTML(c.nome || c.slug)}</option>`;
    }).join('');

  $('#filterCompeticao').innerHTML = '<option value="">Todas as competições</option>' +
    state.competicoes.map(c => `<option value="${c.id}">${escapeHTML(c.nome)}</option>`).join('');
}

function getFilteredCompeticoes() {
  return state.competicoes.filter(c => {
    if (state.filters.competicao && String(c.id) !== state.filters.competicao) return false;
    if (state.filters.categoria) {
      const slug = c.categorias?.slug || c.categoria_slug;
      if (slug !== state.filters.categoria) return false;
    }
    return true;
  });
}

function render() {
  const wrap = $('#classificacoesContent');
  const empty = $('#pageEmpty');
  const competicoes = getFilteredCompeticoes();

  if (competicoes.length === 0) {
    wrap.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  wrap.innerHTML = competicoes.map(c => {
    const equipas = state.classificacao.filter(r => r.competicao_id === c.id);
    const marcadores = state.marcadores.filter(m => m.competicao_id === c.id);
    const cat = c.categorias || {};

    if (equipas.length === 0) {
      return `
        <article class="classificacao-full">
          <header class="classificacao-full__head">
            <h2 class="classificacao-full__title">${cat.emoji || ''} ${escapeHTML(c.nome)}</h2>
          </header>
          <p style="text-align:center;color:var(--clr-muted);padding:1rem">Sem jogos terminados ainda.</p>
        </article>
      `;
    }

    return `
      <article class="classificacao-full">
        <header class="classificacao-full__head">
          <h2 class="classificacao-full__title">${cat.emoji || ''} ${escapeHTML(c.nome)}</h2>
          <div class="classificacao-full__rules">
            <span>V: <strong>${c.pontos_vitoria}</strong></span>
            <span>E: <strong>${c.pontos_empate}</strong></span>
            <span>D: <strong>${c.pontos_derrota}</strong></span>
          </div>
        </header>
        <table>
          <thead>
            <tr>
              <th class="pos">#</th>
              <th>Equipa</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GM</th>
              <th>GS</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            ${equipas.map((e, i) => `
              <tr ${i === 0 ? 'class="leader"' : ''}>
                <td class="pos">${i + 1}</td>
                <td class="equipa">${escapeHTML(e.equipa)}</td>
                <td>${e.jogos}</td>
                <td>${e.vitorias}</td>
                <td>${e.empates}</td>
                <td>${e.derrotas}</td>
                <td>${e.gm}</td>
                <td>${e.gs}</td>
                <td>${e.diferenca_golos > 0 ? '+' : ''}${e.diferenca_golos}</td>
                <td class="pts">${e.pontos}${e.ajuste_pontos ? `<small style="font-size:0.7rem;color:${e.ajuste_pontos > 0 ? '#22c55e' : '#ef4444'};margin-left:0.2rem">(${e.ajuste_pontos > 0 ? '+' : ''}${e.ajuste_pontos})</small>` : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${marcadores.length > 0 ? `
          <div class="classificacao-full__marcadores">
            <h3>⚽ Top Marcadores</h3>
            <ol class="marcadores-list">
              ${marcadores.slice(0, 10).map((m, i) => `
                <li>
                  <span class="pos ${i === 0 ? 'pos--first' : ''}">${i + 1}</span>
                  <span><strong>${escapeHTML(m.jogador)}</strong> <small style="color:var(--clr-muted)">(${escapeHTML(m.equipa || '')})</small></span>
                  <span class="golos">${m.golos}</span>
                </li>
              `).join('')}
            </ol>
          </div>
        ` : ''}
      </article>
    `;
  }).join('');
}

$('#filterCategoria')?.addEventListener('change', (e) => {
  state.filters.categoria = e.target.value;
  // Resetar filtro de competição (cascata)
  $('#filterCompeticao').value = '';
  state.filters.competicao = '';
  render();
});
$('#filterCompeticao')?.addEventListener('change', (e) => {
  state.filters.competicao = e.target.value;
  render();
});

async function boot() {
  try {
    const data = await api.fetchAll();
    state.classificacao = data.classificacao;
    state.marcadores    = data.marcadores;
    state.competicoes   = data.competicoes;
    $('#pageLoading')?.remove();
    populateFilters();
    render();
  } catch (err) {
    console.error('Erro:', err);
    $('#pageLoading')?.remove();
    $('#pageEmpty').hidden = false;
  }
}

boot();
