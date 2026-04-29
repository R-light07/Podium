/**
 * PODIUM ADMIN — admin.js
 * -----------------------------------------------------------
 * Dashboard com Supabase Auth + CRUD de notícias / categorias
 * -----------------------------------------------------------
 * Estrutura:
 *   1. Boot + auth guard
 *   2. API (wrapper Supabase)
 *   3. State
 *   4. Utils (toast, confirm, formatters, escape)
 *   5. Views: noticias, categorias, destaques
 *   6. Editores (notícia, categoria)
 *   7. Upload de imagens
 * -----------------------------------------------------------
 */

// ===== Boot =====
function showBootError(title, message, extra = '') {
  const bootScreen = document.getElementById('bootScreen');
  if (!bootScreen) return;
  bootScreen.innerHTML = `
    <div class="boot-logo"><span class="logo-pod">POD</span><span class="logo-ium">IUM</span></div>
    <div style="max-width:520px;text-align:left;padding:1.5rem;border:1px solid rgba(239,68,68,0.4);border-radius:12px;background:rgba(239,68,68,0.08);margin:1rem">
      <h3 style="color:#ef4444;margin-bottom:0.75rem;font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:1px">⚠ ${title}</h3>
      <div style="color:#c5c5c5;font-size:0.92rem;line-height:1.6">${message}</div>
      ${extra ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.08);color:#888;font-size:0.85rem;line-height:1.55">${extra}</div>` : ''}
    </div>
    <a href="../index.html" style="color:#ff4f44;font-size:0.9rem;margin-top:1rem">← Voltar ao site</a>`;
}

// 1. Verificar se está a correr via file:// (não funciona com Supabase)
if (location.protocol === 'file:') {
  showBootError(
    'Não pode abrir o dashboard com duplo-clique',
    `<p style="margin-bottom:0.75rem">O dashboard precisa de ser servido por HTTP — os browsers bloqueiam Supabase, autenticação e CDNs em <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px">file://</code>.</p>
     <p style="margin-bottom:0.75rem"><strong style="color:#fff">Como abrir:</strong></p>
     <ol style="margin-left:1.25rem;line-height:1.8">
       <li>Abra um terminal na pasta do projecto</li>
       <li>Corra: <code style="background:#000;padding:3px 8px;border-radius:4px;color:#22c55e">python3 -m http.server 8000</code></li>
       <li>Aceda a <code style="background:#000;padding:3px 8px;border-radius:4px;color:#22c55e">http://localhost:8000/admin/</code></li>
     </ol>`,
    `<strong>Alternativas:</strong> extensão "Live Server" no VSCode · <code>npx serve</code> · publicar em Netlify/Vercel`
  );
  throw new Error('file:// não suportado');
}

// 2. Verificar se o SDK do Supabase carregou
if (!window.supabase) {
  showBootError(
    'SDK do Supabase não carregou',
    `<p>O script <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px">supabase-js</code> não foi carregado. Possíveis causas:</p>
     <ul style="margin:0.75rem 0 0.75rem 1.25rem;line-height:1.8">
       <li>Sem ligação à internet</li>
       <li>Bloqueador de scripts (uBlock, etc.) a bloquear o CDN</li>
       <li>Firewall corporativa a bloquear <code>cdn.jsdelivr.net</code></li>
     </ul>`,
    'Tente recarregar a página. Se persistir, abra a consola do browser (F12) para ver o erro exacto.'
  );
  throw new Error('Supabase SDK não carregado');
}

// 3. Tentar criar o cliente
const sb = window.getSupabaseClient();

if (!sb) {
  showBootError(
    'Supabase não configurado',
    `<p style="margin-bottom:0.75rem">Para usar o dashboard precisa de:</p>
     <ol style="margin-left:1.25rem;line-height:1.8">
       <li>Criar um projecto em <a href="https://supabase.com" target="_blank" style="color:#ff4f44">supabase.com</a> (gratuito)</li>
       <li>Correr o ficheiro <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px">supabase/schema.sql</code> no SQL Editor</li>
       <li>Abrir <code style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px">supabase-config.js</code> e preencher <code>SUPABASE_URL</code> e <code>SUPABASE_ANON_KEY</code></li>
       <li>Criar um utilizador admin (ver passo 5 do SETUP.md)</li>
     </ol>`,
    'Guia completo em <code>supabase/SETUP.md</code>'
  );
  throw new Error('Supabase não configurado');
}

// ===== Helpers DOM =====
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ===== State global =====
const state = {
  user: null,
  role: null,
  noticias: [],
  categorias: [],
  events: [],
  results: [],
  competicoes: [],
  classificacao: [],
  topMarcadores: [],
  equipas: [],
  jogadores: [],
  filters: { search: '', categoria: '', status: '' },
  eventFilters: { search: '', categoria: '', status: '' },
  resultFilters: { search: '', categoria: '', origem: '' },
  equipaFilters: { search: '' },
  jogadorFilters: { search: '', equipa: '' },
  editingId: null,
  editingCategoryId: null,
  editingEventId: null,
  editingResultId: null,
  editingCompeticaoId: null,
  editingEquipaId: null,
  editingJogadorId: null,
  uploadedFile: null,
  galleryItems: [],
  statsItems: [],
  // Vínculos jogador-equipa em edição
  jogadorEquipasItems: [],
};

// ===== Utils =====
function escapeHTML(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ===== TOAST =====
let toastTimer;
function toast(message, type = 'info') {
  const el = $('#toast');
  clearTimeout(toastTimer);
  el.hidden = false;
  el.textContent = message;
  el.className = `toast toast--${type} show`;
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 300);
  }, 3500);
}

// ===== CONFIRM DIALOG =====
function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const modal = $('#confirmModal');
    $('#confirmTitle').textContent = title;
    $('#confirmMessage').textContent = message;
    modal.hidden = false;

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const cleanup = () => {
      modal.hidden = true;
      $('#confirmOk').removeEventListener('click', onOk);
      modal.querySelectorAll('[data-close]').forEach(el => el.removeEventListener('click', onCancel));
    };

    $('#confirmOk').addEventListener('click', onOk);
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', onCancel));
  });
}

// ============================================================
// 1. AUTH GUARD
// ============================================================
async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  // Verificar se é admin
  const { data: adminRow, error } = await sb
    .from('admin_users')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !adminRow) {
    toast('Não tem permissões de administrador.', 'error');
    await sb.auth.signOut();
    showLogin();
    return;
  }

  state.user = session.user;
  state.role = adminRow.role;
  await showApp();
}

function showLogin() {
  $('#bootScreen').hidden = true;
  $('#app').hidden = true;
  $('#loginView').hidden = false;
  setTimeout(() => $('#loginEmail')?.focus(), 50);
}

async function showApp() {
  $('#bootScreen').hidden = true;
  $('#loginView').hidden = true;
  $('#app').hidden = false;

  // Preencher info do utilizador
  const email = state.user.email || '';
  $('#userEmail').textContent = email;
  $('#userRole').textContent  = state.role;
  $('#userAvatar').textContent = (email[0] || '?').toUpperCase();

  // Carregar dados iniciais
  await Promise.all([
    loadCategorias(),
    loadNoticias(),
    loadEventos(),
    loadResultados(),
    loadClassificacoes(),
    loadEquipas(),
    loadJogadores(),
  ]);

  // Activar primeira view
  switchView('noticias');
}

// ===== LOGIN =====
$('#loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value;
  const errEl = $('#loginError');
  const btn = $('#loginSubmit');

  errEl.textContent = '';
  btn.disabled = true;
  btn.querySelector('span').textContent = 'A entrar...';

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Verificar admin
    const { data: adminRow } = await sb
      .from('admin_users')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (!adminRow) {
      await sb.auth.signOut();
      throw new Error('Esta conta não tem permissões de administrador.');
    }

    state.user = data.user;
    state.role = adminRow.role;
    await showApp();
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao iniciar sessão.';
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Entrar';
  }
});

$('#logoutBtn')?.addEventListener('click', async () => {
  const ok = await confirmDialog('Sair', 'Tem a certeza que quer terminar a sessão?');
  if (!ok) return;
  await sb.auth.signOut();
  location.reload();
});

// ============================================================
// 2. API — wrappers Supabase
// ============================================================
const api = {
  async listCategorias() {
    const { data, error } = await sb.from('categorias')
      .select('*').order('ordem', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createCategoria(payload) {
    const { data, error } = await sb.from('categorias').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateCategoria(id, payload) {
    const { data, error } = await sb.from('categorias').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCategoria(id) {
    const { error } = await sb.from('categorias').delete().eq('id', id);
    if (error) throw error;
  },

  async listNoticias() {
    const { data, error } = await sb.from('noticias')
      .select('*, categorias(id, slug, nome, emoji, cor)')
      .order('data_publicacao', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createNoticia(payload) {
    const { data, error } = await sb.from('noticias').insert(payload).select('*, categorias(id, slug, nome, emoji, cor)').single();
    if (error) throw error;
    return data;
  },

  async updateNoticia(id, payload) {
    const { data, error } = await sb.from('noticias').update(payload).eq('id', id).select('*, categorias(id, slug, nome, emoji, cor)').single();
    if (error) throw error;
    return data;
  },

  async deleteNoticia(id) {
    const { error } = await sb.from('noticias').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadImage(file) {
    const bucket = window.PODIUM_CONFIG.STORAGE_BUCKET;
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(filename);
    return publicUrl;
  },

  async deleteImage(url) {
    if (!url) return;
    const bucket = window.PODIUM_CONFIG.STORAGE_BUCKET;
    const match = url.match(new RegExp(`/${bucket}/(.+)$`));
    if (!match) return;
    await sb.storage.from(bucket).remove([match[1]]);
  },

  // ===== AGENDA / EVENTOS =====
  async listEventos() {
    const { data, error } = await sb.from('agenda_eventos')
      .select('*, categorias(id, slug, nome, emoji, cor)')
      .order('data_evento', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createEvento(payload) {
    const { data, error } = await sb.from('agenda_eventos')
      .insert(payload)
      .select('*, categorias(id, slug, nome, emoji, cor)')
      .single();
    if (error) throw error;
    return data;
  },

  async updateEvento(id, payload) {
    const { data, error } = await sb.from('agenda_eventos')
      .update(payload).eq('id', id)
      .select('*, categorias(id, slug, nome, emoji, cor)')
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEvento(id) {
    const { error } = await sb.from('agenda_eventos').delete().eq('id', id);
    if (error) throw error;
  },

  // ===== RESULTADOS =====
  async listResultados() {
    // Lemos da view unificada que junta agenda + manuais
    const { data, error } = await sb.from('resultados_publicos')
      .select('*')
      .order('data_evento', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createResultado(payload) {
    const { data, error } = await sb.from('resultados')
      .insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateResultado(id, payload) {
    const { data, error } = await sb.from('resultados')
      .update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async getResultado(id) {
    const { data, error } = await sb.from('resultados')
      .select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteResultado(id) {
    const { error } = await sb.from('resultados').delete().eq('id', id);
    if (error) throw error;
  },

  // ===== COMPETIÇÕES + CLASSIFICAÇÕES =====
  async listCompeticoes() {
    const { data, error } = await sb.from('competicoes')
      .select('*, categorias(id, slug, nome, emoji, cor)')
      .order('nome');
    if (error) throw error;
    return data || [];
  },

  async createCompeticao(payload) {
    const { data, error } = await sb.from('competicoes')
      .insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateCompeticao(id, payload) {
    const { data, error } = await sb.from('competicoes')
      .update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCompeticao(id) {
    const { error } = await sb.from('competicoes').delete().eq('id', id);
    if (error) throw error;
  },

  async listClassificacao() {
    // View calculada
    const { data, error } = await sb.from('classificacao_publica').select('*');
    if (error) throw error;
    return data || [];
  },

  async listTopMarcadores() {
    const { data, error } = await sb.from('top_marcadores').select('*');
    if (error) throw error;
    return data || [];
  },

  async listAjustes(competicaoId) {
    const { data, error } = await sb.from('classificacoes_ajustes')
      .select('*').eq('competicao_id', competicaoId)
      .order('criada_em', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createAjuste(payload) {
    const { data, error } = await sb.from('classificacoes_ajustes')
      .insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async deleteAjuste(id) {
    const { error } = await sb.from('classificacoes_ajustes').delete().eq('id', id);
    if (error) throw error;
  },

  // ===== EQUIPAS =====
  async listEquipas() {
    const { data, error } = await sb.from('equipas').select('*').order('nome');
    if (error) throw error;
    return data || [];
  },
  async createEquipa(payload) {
    const { data, error } = await sb.from('equipas').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateEquipa(id, payload) {
    const { data, error } = await sb.from('equipas').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteEquipa(id) {
    const { error } = await sb.from('equipas').delete().eq('id', id);
    if (error) throw error;
  },

  // ===== JOGADORES =====
  async listJogadores() {
    const { data, error } = await sb.from('jogadores_actuais').select('*').order('nome');
    if (error) throw error;
    return data || [];
  },
  async getJogador(id) {
    const { data, error } = await sb.from('jogadores').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },
  async createJogador(payload) {
    const { data, error } = await sb.from('jogadores').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateJogador(id, payload) {
    const { data, error } = await sb.from('jogadores').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteJogador(id) {
    const { error } = await sb.from('jogadores').delete().eq('id', id);
    if (error) throw error;
  },

  // ===== JOGADORES_EQUIPAS (vínculos) =====
  async listVinculosByJogador(jogadorId) {
    const { data, error } = await sb.from('jogadores_equipas')
      .select('*, equipas(id, nome)')
      .eq('jogador_id', jogadorId)
      .order('desde', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data || [];
  },
  async createVinculo(payload) {
    const { data, error } = await sb.from('jogadores_equipas').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async deleteVinculo(id) {
    const { error } = await sb.from('jogadores_equipas').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// 3. LOAD DATA
// ============================================================
async function loadCategorias() {
  try {
    state.categorias = await api.listCategorias();
    renderCategoriesSelects();
    renderCategoriesView();
    if (typeof renderEventsCategoriesSelect === 'function') {
      renderEventsCategoriesSelect();
    }
    if (typeof renderResultsCategoriesSelect === 'function') {
      renderResultsCategoriesSelect();
    }
    if (typeof renderCompeticaoCategoriasSelect === 'function') {
      renderCompeticaoCategoriasSelect();
    }
    $('#countCategorias').textContent = state.categorias.length;
  } catch (err) {
    toast('Erro ao carregar categorias: ' + err.message, 'error');
  }
}

async function loadNoticias() {
  const loading = $('#articlesLoading');
  loading.style.display = 'flex';
  try {
    state.noticias = await api.listNoticias();
    $('#countNoticias').textContent = state.noticias.length;
    renderNoticiasTable();
    renderDestaques();
  } catch (err) {
    toast('Erro ao carregar notícias: ' + err.message, 'error');
  } finally {
    loading.style.display = 'none';
  }
}

// ============================================================
// 4. VIEW SWITCHER
// ============================================================
function switchView(name) {
  $$('.view').forEach(v => v.classList.toggle('view--active', v.dataset.view === name));
  $$('.sidebar__link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  // Fechar sidebar mobile
  $('#sidebar').classList.remove('open');
  $('.sidebar-backdrop')?.classList.remove('show');
}

$$('.sidebar__link').forEach(link => {
  link.addEventListener('click', () => switchView(link.dataset.view));
});

// Sidebar mobile
$('#sidebarToggle')?.addEventListener('click', () => {
  $('#sidebar').classList.add('open');
  if (!$('.sidebar-backdrop')) {
    const bd = document.createElement('div');
    bd.className = 'sidebar-backdrop show';
    bd.addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      bd.classList.remove('show');
    });
    document.body.appendChild(bd);
  } else {
    $('.sidebar-backdrop').classList.add('show');
  }
});

// ============================================================
// 5. VIEW: NOTÍCIAS (tabela)
// ============================================================
function renderCategoriesSelects() {
  // Filtro da tabela
  const filterSel = $('#filterCategoria');
  filterSel.innerHTML = '<option value="">Todas as categorias</option>' +
    state.categorias.map(c => `<option value="${c.id}">${c.emoji} ${escapeHTML(c.nome)}</option>`).join('');

  // Select do editor
  const editorSel = $('#articleCategoria');
  editorSel.innerHTML = '<option value="">— Escolher —</option>' +
    state.categorias.map(c => `<option value="${c.id}">${c.emoji} ${escapeHTML(c.nome)}</option>`).join('');
}

function getFilteredNoticias() {
  const { search, categoria, status } = state.filters;
  const s = search.toLowerCase().trim();
  return state.noticias.filter(n => {
    if (s && !n.titulo.toLowerCase().includes(s)) return false;
    if (categoria && String(n.categoria_id) !== String(categoria)) return false;
    if (status === 'publicada' && !n.publicada) return false;
    if (status === 'rascunho'  && n.publicada) return false;
    if (status === 'destaque'  && !n.destaque) return false;
    return true;
  });
}

function renderNoticiasTable() {
  const tbody = $('#articlesTbody');
  const empty = $('#articlesEmpty');
  const rows = getFilteredNoticias();

  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = rows.map(n => {
    const cat = n.categorias || {};
    const statusCls = n.destaque ? 'destaque' : (n.publicada ? 'publicada' : 'rascunho');
    const statusLabel = n.destaque ? 'Destaque' : (n.publicada ? 'Publicada' : 'Rascunho');
    const imgHtml = n.imagem_url
      ? `<img class="table__img" src="${escapeHTML(n.imagem_url)}" alt="" />`
      : `<div class="table__img">${cat.emoji || '📰'}</div>`;

    return `
      <tr data-id="${n.id}" style="cursor:pointer">
        <td class="td-img">${imgHtml}</td>
        <td><span class="table__titulo" title="${escapeHTML(n.titulo)}">${escapeHTML(n.titulo)}</span></td>
        <td>
          <span class="table__cat">${cat.emoji || ''} ${escapeHTML(cat.nome || '—')}</span>
        </td>
        <td><span class="table__status table__status--${statusCls}">${statusLabel}</span></td>
        <td>${formatDate(n.data_publicacao)}</td>
        <td>${n.views || 0}</td>
        <td>
          <div class="table__actions">
            <button class="icon-btn" data-action="edit" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button class="icon-btn" data-action="delete" title="Eliminar" style="color:#ef4444">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Eventos nas linhas
  tbody.querySelectorAll('tr').forEach(tr => {
    const id = parseInt(tr.dataset.id, 10);
    tr.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        if (actionBtn.dataset.action === 'edit') openArticleEditor(id);
        if (actionBtn.dataset.action === 'delete') handleDeleteArticle(id);
      } else {
        openArticleEditor(id);
      }
    });
  });
}

// Filtros da tabela
$('#articleSearch')?.addEventListener('input', (e) => {
  state.filters.search = e.target.value;
  renderNoticiasTable();
});
$('#filterCategoria')?.addEventListener('change', (e) => {
  state.filters.categoria = e.target.value;
  renderNoticiasTable();
});
$('#filterStatus')?.addEventListener('change', (e) => {
  state.filters.status = e.target.value;
  renderNoticiasTable();
});

// ============================================================
// 6. EDITOR DE NOTÍCIAS
// ============================================================
function openArticleEditor(id = null) {
  state.editingId = id;
  state.uploadedFile = null;
  state.galleryItems = [];

  const modal = $('#articleModal');
  const form = $('#articleForm');
  form.reset();
  form.classList.remove('submitted');
  $('#articleFormError').textContent = '';
  $('#uploadPreview').hidden = true;
  $('#uploadContent').hidden = false;
  $('#deleteArticleBtn').hidden = !id;

  if (id) {
    const n = state.noticias.find(x => x.id === id);
    if (!n) return;
    $('#articleModalTitle').textContent = 'Editar notícia';
    $('#articleId').value = n.id;
    $('#articleTitulo').value = n.titulo;
    $('#articleResumo').value = n.resumo;
    $('#articleConteudo').value = (n.conteudo || []).join('\n\n');
    $('#articleCategoria').value = n.categoria_id || '';
    $('#articleAutor').value = n.autor || '';
    $('#articleData').value = formatDateTimeLocal(n.data_publicacao);
    $('#articleDestaque').checked = !!n.destaque;
    $('#articlePublicada').checked = !!n.publicada;
    if (n.imagem_url) {
      $('#uploadPreviewImg').src = n.imagem_url;
      $('#uploadPreview').hidden = false;
      $('#uploadContent').hidden = true;
    }
    // Galeria existente
    if (Array.isArray(n.imagens_galeria) && n.imagens_galeria.length > 0) {
      state.galleryItems = n.imagens_galeria.map(url => ({ url, file: null }));
    }
  } else {
    $('#articleModalTitle').textContent = 'Nova notícia';
    $('#articleId').value = '';
    $('#articlePublicada').checked = true;
    $('#articleData').value = formatDateTimeLocal(new Date().toISOString());
  }

  renderGallery();
  modal.hidden = false;
}

$('#newArticleBtn')?.addEventListener('click', () => openArticleEditor());

$('#articleForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  e.target.classList.add('submitted');
  const errEl = $('#articleFormError');
  const btn = $('#saveArticleBtn');
  errEl.textContent = '';

  const titulo   = $('#articleTitulo').value.trim();
  const resumo   = $('#articleResumo').value.trim();
  const conteudo = $('#articleConteudo').value.trim();
  const categoria_id = $('#articleCategoria').value;

  if (!titulo || !resumo || !conteudo) {
    errEl.textContent = 'Título, resumo e conteúdo são obrigatórios.';
    return;
  }
  if (!categoria_id) {
    errEl.textContent = 'Escolha uma categoria.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    // Upload imagem se houver ficheiro novo
    let imagem_url = state.uploadedFile ? null : ($('#uploadPreviewImg').src || null);
    if (state.uploadedFile) {
      imagem_url = await api.uploadImage(state.uploadedFile);
    }
    // Se imagem foi removida durante a edição
    if ($('#uploadPreview').hidden && !state.uploadedFile) {
      imagem_url = null;
    }

    // Upload das imagens novas da galeria + manter as já existentes
    const imagens_galeria = [];
    for (const item of state.galleryItems) {
      if (item.url) {
        // Imagem já existente — manter
        imagens_galeria.push(item.url);
      } else if (item.file) {
        // Novo upload
        btn.textContent = `A enviar ${imagens_galeria.length + 1}/${state.galleryItems.length}...`;
        const url = await api.uploadImage(item.file);
        imagens_galeria.push(url);
      }
    }

    const payload = {
      titulo,
      resumo,
      conteudo: conteudo.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
      categoria_id: parseInt(categoria_id, 10),
      autor: $('#articleAutor').value.trim() || 'Equipa Podium',
      data_publicacao: $('#articleData').value ? new Date($('#articleData').value).toISOString() : new Date().toISOString(),
      destaque: $('#articleDestaque').checked,
      publicada: $('#articlePublicada').checked,
      imagem_url,
      imagens_galeria,
    };

    if (state.editingId) {
      await api.updateNoticia(state.editingId, payload);
      toast('Notícia actualizada com sucesso.', 'success');
    } else {
      payload.criada_por = state.user.id;
      await api.createNoticia(payload);
      toast('Notícia criada com sucesso.', 'success');
    }

    closeArticleEditor();
    await loadNoticias();
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao guardar.';
    toast('Erro ao guardar: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

$('#deleteArticleBtn')?.addEventListener('click', () => {
  if (state.editingId) handleDeleteArticle(state.editingId);
});

async function handleDeleteArticle(id) {
  const n = state.noticias.find(x => x.id === id);
  const ok = await confirmDialog('Eliminar notícia', `Eliminar "${n?.titulo || 'esta notícia'}"? Esta acção não pode ser desfeita.`);
  if (!ok) return;

  try {
    if (n?.imagem_url) await api.deleteImage(n.imagem_url);
    await api.deleteNoticia(id);
    toast('Notícia eliminada.', 'success');
    closeArticleEditor();
    await loadNoticias();
  } catch (err) {
    toast('Erro ao eliminar: ' + err.message, 'error');
  }
}

function closeArticleEditor() {
  $('#articleModal').hidden = true;
  state.editingId = null;
  state.uploadedFile = null;
}

// ============================================================
// 7. UPLOAD DE IMAGEM
// ============================================================
const uploadZone     = $('#uploadZone');
const uploadInput    = $('#articleImagem');
const uploadPreview  = $('#uploadPreview');
const uploadPreviewImg = $('#uploadPreviewImg');
const uploadContent  = $('#uploadContent');

uploadZone?.addEventListener('click', (e) => {
  if (e.target.closest('.upload-zone__remove')) return;
  uploadInput.click();
});

uploadZone?.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('upload-zone--dragover');
});
uploadZone?.addEventListener('dragleave', () => {
  uploadZone.classList.remove('upload-zone--dragover');
});
uploadZone?.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('upload-zone--dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleImageSelect(file);
});

uploadInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleImageSelect(file);
});

function handleImageSelect(file) {
  if (!file.type.startsWith('image/')) {
    toast('Por favor, escolha um ficheiro de imagem.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Imagem excede 5 MB.', 'error');
    return;
  }
  state.uploadedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadPreviewImg.src = e.target.result;
    uploadPreview.hidden = false;
    uploadContent.hidden = true;
  };
  reader.readAsDataURL(file);
}

$('#uploadRemove')?.addEventListener('click', (e) => {
  e.stopPropagation();
  state.uploadedFile = null;
  uploadInput.value = '';
  uploadPreview.hidden = true;
  uploadContent.hidden = false;
  uploadPreviewImg.src = '';
});

// ============================================================
// 7b. UPLOAD DE GALERIA (múltiplas imagens)
// ============================================================
const galleryZone    = $('#galleryZone');
const galleryInput   = $('#articleGaleria');
const galleryGrid    = $('#galleryGrid');

galleryZone?.addEventListener('click', () => galleryInput.click());

galleryZone?.addEventListener('dragover', (e) => {
  e.preventDefault();
  galleryZone.classList.add('upload-zone--dragover');
});
galleryZone?.addEventListener('dragleave', () => {
  galleryZone.classList.remove('upload-zone--dragover');
});
galleryZone?.addEventListener('drop', (e) => {
  e.preventDefault();
  galleryZone.classList.remove('upload-zone--dragover');
  handleGalleryFiles(e.dataTransfer.files);
});

galleryInput?.addEventListener('change', (e) => {
  handleGalleryFiles(e.target.files);
  galleryInput.value = ''; // permitir re-seleccionar mesmo ficheiro
});

function handleGalleryFiles(fileList) {
  const files = Array.from(fileList);
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast(`"${file.name}" não é uma imagem`, 'error');
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(`"${file.name}" excede 5 MB`, 'error');
      continue;
    }
    // Adicionar ao state com preview local (data URL)
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.galleryItems.push({ file, url: null, preview: ev.target.result });
      renderGallery();
    };
    reader.readAsDataURL(file);
  }
}

function renderGallery() {
  const grid = $('#galleryGrid');
  if (!grid) return;
  if (state.galleryItems.length === 0) {
    grid.hidden = true;
    grid.innerHTML = '';
    return;
  }
  grid.hidden = false;
  grid.innerHTML = state.galleryItems.map((item, idx) => {
    const src = item.url || item.preview;
    return `
      <div class="gallery-thumb" data-index="${idx}">
        <img src="${escapeHTML(src)}" alt="Imagem ${idx + 1}" />
        <button type="button" class="gallery-thumb__remove" data-remove="${idx}" aria-label="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        ${!item.url ? '<span class="gallery-thumb__badge">Novo</span>' : ''}
      </div>
    `;
  }).join('');
}

$('#galleryGrid')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (btn) {
    e.stopPropagation();
    const idx = parseInt(btn.dataset.remove, 10);
    state.galleryItems.splice(idx, 1);
    renderGallery();
  }
});

// ============================================================
// 8. VIEW: CATEGORIAS
// ============================================================
function renderCategoriesView() {
  const grid = $('#categoriesGrid');
  grid.innerHTML = state.categorias.map(c => `
    <div class="cat-tile" data-id="${c.id}">
      <span class="cat-tile__dot" style="background:${escapeHTML(c.cor || '#888')}"></span>
      <span class="cat-tile__emoji">${c.emoji || '📰'}</span>
      <div class="cat-tile__name">${escapeHTML(c.nome)}</div>
      <code class="cat-tile__slug">${escapeHTML(c.slug)}</code>
    </div>
  `).join('');

  grid.querySelectorAll('.cat-tile').forEach(tile => {
    tile.addEventListener('click', () => openCategoryEditor(parseInt(tile.dataset.id, 10)));
  });
}

function openCategoryEditor(id = null) {
  state.editingCategoryId = id;
  const form = $('#categoryForm');
  form.reset();
  form.classList.remove('submitted');
  $('#categoryFormError').textContent = '';
  $('#deleteCategoryBtn').hidden = !id;

  if (id) {
    const c = state.categorias.find(x => x.id === id);
    if (!c) return;
    $('#categoryModalTitle').textContent = 'Editar categoria';
    $('#categoryId').value = c.id;
    $('#categoryNome').value = c.nome;
    $('#categoryEmoji').value = c.emoji || '';
    $('#categorySlug').value = c.slug;
    $('#categoryCor').value = c.cor || '#e63329';
  } else {
    $('#categoryModalTitle').textContent = 'Nova categoria';
    $('#categoryId').value = '';
  }

  $('#categoryModal').hidden = false;
}

$('#newCategoryBtn')?.addEventListener('click', () => openCategoryEditor());

// Auto-slug a partir do nome
$('#categoryNome')?.addEventListener('input', (e) => {
  const slugInput = $('#categorySlug');
  if (!state.editingCategoryId || !slugInput.value) {
    slugInput.value = slugify(e.target.value);
  }
});

$('#categoryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  e.target.classList.add('submitted');
  const errEl = $('#categoryFormError');
  const btn = $('#saveCategoryBtn');
  errEl.textContent = '';

  const payload = {
    nome: $('#categoryNome').value.trim(),
    emoji: $('#categoryEmoji').value.trim() || '📰',
    slug: $('#categorySlug').value.trim(),
    cor: $('#categoryCor').value,
  };

  if (!payload.nome || !payload.slug) {
    errEl.textContent = 'Nome e slug são obrigatórios.';
    return;
  }
  if (!/^[a-z0-9-]+$/.test(payload.slug)) {
    errEl.textContent = 'Slug só pode conter minúsculas, números e hífenes.';
    return;
  }

  btn.disabled = true;
  try {
    if (state.editingCategoryId) {
      await api.updateCategoria(state.editingCategoryId, payload);
      toast('Categoria actualizada.', 'success');
    } else {
      await api.createCategoria(payload);
      toast('Categoria criada.', 'success');
    }
    $('#categoryModal').hidden = true;
    await loadCategorias();
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao guardar.';
  } finally {
    btn.disabled = false;
  }
});

$('#deleteCategoryBtn')?.addEventListener('click', async () => {
  const id = state.editingCategoryId;
  if (!id) return;
  const c = state.categorias.find(x => x.id === id);
  const ok = await confirmDialog(
    'Eliminar categoria',
    `Eliminar "${c?.nome}"? As notícias associadas ficarão sem categoria.`
  );
  if (!ok) return;
  try {
    await api.deleteCategoria(id);
    toast('Categoria eliminada.', 'success');
    $('#categoryModal').hidden = true;
    await loadCategorias();
    await loadNoticias();
  } catch (err) {
    toast('Erro ao eliminar: ' + err.message, 'error');
  }
});

// ============================================================
// 9. VIEW: DESTAQUES
// ============================================================
function renderDestaques() {
  const wrap = $('#destaquesWrap');
  const destaques = state.noticias.filter(n => n.destaque && n.publicada);

  if (destaques.length === 0) {
    wrap.innerHTML = `
      <div class="destaques-empty">
        <p>Ainda não há notícias marcadas como destaque.</p>
        <p style="font-size:0.82rem;margin-top:0.5rem">Active o ⭐ "Destaque no hero" ao editar uma notícia.</p>
      </div>
    `;
    return;
  }

  wrap.innerHTML = destaques.map((n, i) => {
    const cat = n.categorias || {};
    const imgHtml = n.imagem_url
      ? `<img class="destaque-row__img" src="${escapeHTML(n.imagem_url)}" alt="" />`
      : `<div class="destaque-row__img">${cat.emoji || '📰'}</div>`;
    return `
      <div class="destaque-row" data-id="${n.id}" style="cursor:pointer">
        <span class="destaque-row__order">0${i + 1}</span>
        ${imgHtml}
        <div>
          <div class="destaque-row__title">${escapeHTML(n.titulo)}</div>
          <div class="destaque-row__cat">${cat.emoji || ''} ${escapeHTML(cat.nome || '')} · ${formatDate(n.data_publicacao)}</div>
        </div>
        <button class="icon-btn" data-action="edit" title="Editar notícia">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button class="icon-btn" data-action="remove" title="Remover destaque" style="color:#f59e0b">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </button>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('.destaque-row').forEach(row => {
    const id = parseInt(row.dataset.id, 10);
    row.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'remove') {
        e.stopPropagation();
        try {
          await api.updateNoticia(id, { destaque: false });
          toast('Removido dos destaques.', 'success');
          await loadNoticias();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      } else {
        openArticleEditor(id);
      }
    });
  });
}

// ============================================================
// 10. MODAL CLOSE HANDLERS (global)
// ============================================================
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close]')) {
    e.target.closest('.modal').hidden = true;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.modal:not([hidden])').forEach(m => m.hidden = true);
  }
});

// ============================================================
// 11. VIEW: AGENDA (eventos desportivos)
// ============================================================
async function loadEventos() {
  const loading = $('#eventsLoading');
  if (loading) loading.style.display = 'flex';
  try {
    state.events = await api.listEventos();
    const countEl = $('#countAgenda');
    if (countEl) countEl.textContent = state.events.length;
    renderEventsTable();
  } catch (err) {
    toast('Erro ao carregar eventos: ' + err.message, 'error');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderEventsCategoriesSelect() {
  const sel = $('#filterEventCategoria');
  if (sel) {
    sel.innerHTML = '<option value="">Todas as categorias</option>' +
      state.categorias.map(c => `<option value="${c.id}">${c.emoji} ${escapeHTML(c.nome)}</option>`).join('');
  }
  const editorSel = $('#eventCategoria');
  if (editorSel) {
    editorSel.innerHTML = '<option value="">— Escolher —</option>' +
      state.categorias.map(c => `<option value="${c.id}">${c.emoji} ${escapeHTML(c.nome)}</option>`).join('');
  }
}

function getFilteredEvents() {
  const { search, categoria, status } = state.eventFilters;
  const s = search.toLowerCase().trim();
  return state.events.filter(e => {
    if (s) {
      const haystack = `${e.titulo} ${e.competicao || ''}`.toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    if (categoria && String(e.categoria_id) !== String(categoria)) return false;
    if (status && e.status !== status) return false;
    return true;
  });
}

function statusLabel(s) {
  return ({
    agendado:  'Agendado',
    em_curso:  'Em curso',
    terminado: 'Terminado',
    cancelado: 'Cancelado',
    adiado:    'Adiado'
  })[s] || s;
}

function statusClass(s) {
  return ({
    agendado:  'publicada',
    em_curso:  'destaque',
    terminado: 'rascunho',
    cancelado: 'rascunho',
    adiado:    'rascunho'
  })[s] || 'rascunho';
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function renderEventsTable() {
  const tbody = $('#eventsTbody');
  const empty = $('#eventsEmpty');
  if (!tbody) return;

  const rows = getFilteredEvents();
  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  tbody.innerHTML = rows.map(e => {
    const cat = e.categorias || {};
    const localCidade = [e.local, e.cidade].filter(Boolean).join(' · ') || '—';
    const tituloFull = e.titulo + (e.competicao ? ` · ${e.competicao}` : '');
    return `
      <tr data-id="${e.id}" style="cursor:pointer">
        <td><span class="table__titulo" title="${escapeHTML(tituloFull)}">${escapeHTML(e.titulo)}</span></td>
        <td><span class="table__cat">${cat.emoji || ''} ${escapeHTML(cat.nome || '—')}</span></td>
        <td>${formatDateTime(e.data_evento)}</td>
        <td style="font-size:0.85rem;color:var(--clr-text-2)">${escapeHTML(localCidade)}</td>
        <td><span class="table__status table__status--${statusClass(e.status)}">${statusLabel(e.status)}</span></td>
        <td>
          <div class="table__actions">
            <button class="icon-btn" data-action="edit" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button class="icon-btn" data-action="delete" title="Eliminar" style="color:#ef4444">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    const id = parseInt(tr.dataset.id, 10);
    tr.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        if (actionBtn.dataset.action === 'edit') openEventEditor(id);
        if (actionBtn.dataset.action === 'delete') handleDeleteEvent(id);
      } else {
        openEventEditor(id);
      }
    });
  });
}

// Filtros da agenda
$('#eventSearch')?.addEventListener('input', (e) => {
  state.eventFilters.search = e.target.value;
  renderEventsTable();
});
$('#filterEventCategoria')?.addEventListener('change', (e) => {
  state.eventFilters.categoria = e.target.value;
  renderEventsTable();
});
$('#filterEventStatus')?.addEventListener('change', (e) => {
  state.eventFilters.status = e.target.value;
  renderEventsTable();
});

// ============================================================
// 12. EDITOR DE EVENTOS
// ============================================================
function openEventEditor(id = null) {
  state.editingEventId = id;
  const modal = $('#eventModal');
  const form = $('#eventForm');
  form.reset();
  form.classList.remove('submitted');
  $('#eventFormError').textContent = '';
  $('#deleteEventBtn').hidden = !id;
  $('#eventResultadoWrap').hidden = true;

  // Garantir select de categorias preenchido
  renderEventsCategoriesSelect();

  if (id) {
    const e = state.events.find(x => x.id === id);
    if (!e) return;
    $('#eventModalTitle').textContent = 'Editar evento';
    $('#eventId').value = e.id;
    $('#eventTitulo').value = e.titulo || '';
    $('#eventDescricao').value = e.descricao || '';
    $('#eventCategoria').value = e.categoria_id || '';
    $('#eventCompeticao').value = e.competicao || '';
    $('#eventData').value = formatDateTimeLocal(e.data_evento);
    $('#eventDuracao').value = e.duracao_min || 90;
    $('#eventLocal').value = e.local || '';
    $('#eventCidade').value = e.cidade || '';
    fillEquipasSelect($('#eventEquipaCasaId'), { placeholder: '— Sem equipa —', selected: e.equipa_casa_id });
    fillEquipasSelect($('#eventEquipaForaId'), { placeholder: '— Sem equipa —', selected: e.equipa_fora_id });
    $('#eventStatus').value = e.status || 'agendado';
    $('#eventDestaque').checked = !!e.destaque;
    $('#eventPublicado').checked = !!e.publicado;
    $('#eventResultadoCasa').value = e.resultado_casa ?? '';
    $('#eventResultadoFora').value = e.resultado_fora ?? '';
    if (e.status === 'terminado') $('#eventResultadoWrap').hidden = false;
  } else {
    $('#eventModalTitle').textContent = 'Novo evento';
    $('#eventId').value = '';
    $('#eventStatus').value = 'agendado';
    $('#eventPublicado').checked = true;
    $('#eventDuracao').value = 90;
    fillEquipasSelect($('#eventEquipaCasaId'), { placeholder: '— Sem equipa —' });
    fillEquipasSelect($('#eventEquipaForaId'), { placeholder: '— Sem equipa —' });
    // Default: amanhã às 16:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0);
    $('#eventData').value = formatDateTimeLocal(tomorrow.toISOString());
  }

  modal.hidden = false;
}

$('#newEventBtn')?.addEventListener('click', () => openEventEditor());

// Mostrar/esconder resultado conforme status
$('#eventStatus')?.addEventListener('change', (e) => {
  $('#eventResultadoWrap').hidden = e.target.value !== 'terminado';
});

$('#eventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  e.target.classList.add('submitted');
  const errEl = $('#eventFormError');
  const btn = $('#saveEventBtn');
  errEl.textContent = '';

  const titulo = $('#eventTitulo').value.trim();
  const categoria_id = $('#eventCategoria').value;
  const data_evento_local = $('#eventData').value;

  if (!titulo) {
    errEl.textContent = 'Título é obrigatório.';
    return;
  }
  if (!categoria_id) {
    errEl.textContent = 'Escolha uma categoria.';
    return;
  }
  if (!data_evento_local) {
    errEl.textContent = 'Data e hora são obrigatórias.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    const status = $('#eventStatus').value;
    const payload = {
      titulo,
      descricao: $('#eventDescricao').value.trim() || null,
      categoria_id: parseInt(categoria_id, 10),
      competicao: $('#eventCompeticao').value.trim() || null,
      data_evento: new Date(data_evento_local).toISOString(),
      duracao_min: parseInt($('#eventDuracao').value, 10) || 90,
      local: $('#eventLocal').value.trim() || null,
      cidade: $('#eventCidade').value.trim() || null,
      equipa_casa_id: $('#eventEquipaCasaId').value ? parseInt($('#eventEquipaCasaId').value, 10) : null,
      equipa_fora_id: $('#eventEquipaForaId').value ? parseInt($('#eventEquipaForaId').value, 10) : null,
      // Manter campos texto sincronizados (retrocompatibilidade)
      equipa_casa: $('#eventEquipaCasaId').selectedOptions[0]?.textContent.trim() || null,
      equipa_fora: $('#eventEquipaForaId').selectedOptions[0]?.textContent.trim() || null,
      status,
      destaque: $('#eventDestaque').checked,
      publicado: $('#eventPublicado').checked,
      resultado_casa: status === 'terminado' && $('#eventResultadoCasa').value !== ''
        ? parseInt($('#eventResultadoCasa').value, 10) : null,
      resultado_fora: status === 'terminado' && $('#eventResultadoFora').value !== ''
        ? parseInt($('#eventResultadoFora').value, 10) : null,
    };
    // Limpar "— Sem equipa —" do texto
    if (payload.equipa_casa && payload.equipa_casa.startsWith('—')) payload.equipa_casa = null;
    if (payload.equipa_fora && payload.equipa_fora.startsWith('—')) payload.equipa_fora = null;

    if (state.editingEventId) {
      await api.updateEvento(state.editingEventId, payload);
      toast('Evento actualizado.', 'success');
    } else {
      payload.criada_por = state.user.id;
      await api.createEvento(payload);
      toast('Evento criado.', 'success');
    }

    $('#eventModal').hidden = true;
    state.editingEventId = null;
    await loadEventos();
    if (typeof loadResultados === 'function') await loadResultados();
    if (typeof loadClassificacoes === 'function') await loadClassificacoes();
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao guardar.';
    toast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

$('#deleteEventBtn')?.addEventListener('click', () => {
  if (state.editingEventId) handleDeleteEvent(state.editingEventId);
});

async function handleDeleteEvent(id) {
  const e = state.events.find(x => x.id === id);
  const ok = await confirmDialog(
    'Eliminar evento',
    `Eliminar "${e?.titulo || 'este evento'}"? Esta acção não pode ser desfeita.`
  );
  if (!ok) return;
  try {
    await api.deleteEvento(id);
    toast('Evento eliminado.', 'success');
    $('#eventModal').hidden = true;
    state.editingEventId = null;
    await loadEventos();
    if (typeof loadResultados === 'function') await loadResultados();
    if (typeof loadClassificacoes === 'function') await loadClassificacoes();
  } catch (err) {
    toast('Erro ao eliminar: ' + err.message, 'error');
  }
}

// ============================================================
// 13. VIEW: RESULTADOS
// ============================================================
async function loadResultados() {
  const loading = $('#resultsLoading');
  if (loading) loading.style.display = 'flex';
  try {
    state.results = await api.listResultados();
    const countEl = $('#countResultados');
    if (countEl) countEl.textContent = state.results.length;
    renderResultsTable();
  } catch (err) {
    // Não bloquear: pode não ter migração 004 corrida
    console.warn('Resultados:', err.message);
    state.results = [];
    if ($('#countResultados')) $('#countResultados').textContent = '0';
    renderResultsTable();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderResultsCategoriesSelect() {
  const sel = $('#filterResultCategoria');
  if (sel) {
    sel.innerHTML = '<option value="">Todas as categorias</option>' +
      state.categorias.map(c => `<option value="${c.slug}">${c.emoji} ${escapeHTML(c.nome)}</option>`).join('');
  }
  const editorSel = $('#resultCategoria');
  if (editorSel) {
    editorSel.innerHTML = '<option value="">— Escolher —</option>' +
      state.categorias.map(c => `<option value="${c.id}">${c.emoji} ${escapeHTML(c.nome)}</option>`).join('');
  }
}

function getFilteredResults() {
  const { search, categoria, origem } = state.resultFilters;
  const s = search.toLowerCase().trim();
  return state.results.filter(r => {
    if (s) {
      const haystack = `${r.titulo} ${r.competicao || ''} ${r.equipa_casa || ''} ${r.equipa_fora || ''}`.toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    if (categoria && r.categoria_slug !== categoria) return false;
    if (origem && r.origem !== origem) return false;
    return true;
  });
}

function renderResultsTable() {
  const tbody = $('#resultsTbody');
  const empty = $('#resultsEmpty');
  if (!tbody) return;

  const rows = getFilteredResults();
  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  tbody.innerHTML = rows.map(r => {
    const dataFmt = formatDate(r.data_evento);
    const origemLabel = r.origem === 'agenda'
      ? '<span class="table__status table__status--rascunho" title="Editar via Agenda">Da agenda</span>'
      : '<span class="table__status table__status--publicada">Manual</span>';
    const editable = r.origem === 'manual';
    const actionBtn = editable
      ? `<button class="icon-btn" data-action="edit" title="Editar">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
         </button>
         <button class="icon-btn" data-action="delete" title="Eliminar" style="color:#ef4444">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
         </button>`
      : `<span style="color:var(--clr-muted);font-size:0.8rem;font-style:italic">Editar na Agenda</span>`;

    return `
      <tr data-id="${r.id}" data-origem="${r.origem}" ${editable ? 'style="cursor:pointer"' : ''}>
        <td>
          <span class="table__titulo">${escapeHTML(r.equipa_casa)} <span style="color:var(--clr-muted)">vs</span> ${escapeHTML(r.equipa_fora)}</span>
          ${r.competicao ? `<br><small style="color:var(--clr-muted)">${escapeHTML(r.competicao)}</small>` : ''}
        </td>
        <td><strong style="font-family:var(--ff-condensed);font-size:1.1rem">${r.resultado_casa} – ${r.resultado_fora}</strong></td>
        <td><span class="table__cat">${r.categoria_emoji || ''} ${escapeHTML(r.categoria_nome || '—')}</span></td>
        <td>${dataFmt}</td>
        <td>${origemLabel}</td>
        <td><div class="table__actions">${actionBtn}</div></td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    const id = parseInt(tr.dataset.id, 10);
    const origem = tr.dataset.origem;
    if (origem !== 'manual') return; // só manuais são editáveis aqui
    tr.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        if (actionBtn.dataset.action === 'edit') openResultEditor(id);
        if (actionBtn.dataset.action === 'delete') handleDeleteResult(id);
      } else {
        openResultEditor(id);
      }
    });
  });
}

// Filtros
$('#resultSearch')?.addEventListener('input', (e) => {
  state.resultFilters.search = e.target.value;
  renderResultsTable();
});
$('#filterResultCategoria')?.addEventListener('change', (e) => {
  state.resultFilters.categoria = e.target.value;
  renderResultsTable();
});
$('#filterResultOrigem')?.addEventListener('change', (e) => {
  state.resultFilters.origem = e.target.value;
  renderResultsTable();
});

// ============================================================
// 14. EDITOR DE RESULTADOS
// ============================================================
async function openResultEditor(id = null) {
  state.editingResultId = id;
  state.statsItems = [];

  const modal = $('#resultModal');
  const form = $('#resultForm');
  form.reset();
  form.classList.remove('submitted');
  $('#resultFormError').textContent = '';
  $('#deleteResultBtn').hidden = !id;

  renderResultsCategoriesSelect();

  if (id) {
    // Editar — buscar dados completos da tabela `resultados` (não da view)
    const r = await api.getResultado(id);
    if (!r) {
      toast('Resultado não encontrado', 'error');
      return;
    }
    $('#resultModalTitle').textContent = 'Editar resultado';
    $('#resultId').value = r.id;
    $('#resultTitulo').value = r.titulo || '';
    $('#resultCategoria').value = r.categoria_id || '';
    $('#resultData').value = formatDateTimeLocal(r.data_evento);
    $('#resultCompeticao').value = r.competicao || '';
    $('#resultLocal').value = r.local || '';
    $('#resultCidade').value = r.cidade || '';
    fillEquipasSelect($('#resultEquipaCasaId'), { placeholder: '— Escolher —', selected: r.equipa_casa_id });
    fillEquipasSelect($('#resultEquipaForaId'), { placeholder: '— Escolher —', selected: r.equipa_fora_id });
    $('#resultMarcadorCasa').value = r.resultado_casa ?? '';
    $('#resultMarcadorFora').value = r.resultado_fora ?? '';
    fillJogadoresSelect($('#resultMVPId'), { placeholder: '— Sem MVP —', selected: r.mvp_id });
    $('#resultObservacoes').value = r.observacoes || '';
    $('#resultDestaque').checked = !!r.destaque;
    $('#resultPublicado').checked = !!r.publicado;
    state.statsItems = Array.isArray(r.estatisticas) ? r.estatisticas : [];
  } else {
    $('#resultModalTitle').textContent = 'Novo resultado';
    $('#resultId').value = '';
    $('#resultPublicado').checked = true;
    $('#resultData').value = formatDateTimeLocal(new Date().toISOString());
    fillEquipasSelect($('#resultEquipaCasaId'), { placeholder: '— Escolher —' });
    fillEquipasSelect($('#resultEquipaForaId'), { placeholder: '— Escolher —' });
    fillJogadoresSelect($('#resultMVPId'), { placeholder: '— Sem MVP —' });
  }

  renderStatsList();
  modal.hidden = false;
}

function renderStatsList() {
  const list = $('#statsList');
  if (!list) return;

  // Obter IDs das equipas seleccionadas no resultForm para filtrar jogadores
  const equipaCasaId = $('#resultEquipaCasaId')?.value || null;
  const equipaForaId = $('#resultEquipaForaId')?.value || null;

  list.innerHTML = state.statsItems.map((s, i) => {
    const equipaIdAtual = s.equipa === 'casa' ? equipaCasaId
                       : s.equipa === 'fora' ? equipaForaId
                       : null;

    // Lista de jogadores filtrada pela equipa do evento (se vinculados); senão todos
    let jogadoresDisponiveis = state.jogadores;
    if (equipaIdAtual) {
      const filtrados = state.jogadores.filter(j => String(j.equipa_id) === String(equipaIdAtual));
      if (filtrados.length > 0) jogadoresDisponiveis = filtrados;
    }

    // Para retro-compat: se s.jogador (texto) existe mas não há jogador_id, mostrar como custom
    const jogadorIdSelect = s.jogador_id || '';
    const jogadorNome = s.jogador_nome || s.jogador || s.detalhe || '';

    return `
      <div class="stat-row" data-index="${i}">
        <input type="number" placeholder="Min." value="${s.minuto ?? ''}" data-field="minuto" min="0" max="200" />
        <select data-field="tipo">
          <option value="golo"     ${s.tipo === 'golo' ? 'selected' : ''}>Golo</option>
          <option value="periodo"  ${s.tipo === 'periodo' ? 'selected' : ''}>Período / Set</option>
          <option value="cartao"   ${s.tipo === 'cartao' ? 'selected' : ''}>Cartão</option>
          <option value="outro"    ${s.tipo === 'outro' ? 'selected' : ''}>Outro</option>
        </select>
        <select data-field="equipa">
          <option value="casa" ${s.equipa === 'casa' ? 'selected' : ''}>Casa</option>
          <option value="fora" ${s.equipa === 'fora' ? 'selected' : ''}>Fora</option>
        </select>
        <select data-field="jogador_id">
          <option value="">— ${jogadorNome && !jogadorIdSelect ? escapeHTML(jogadorNome) : 'Jogador'} —</option>
          ${jogadoresDisponiveis.map(j =>
            `<option value="${j.id}" ${String(jogadorIdSelect) === String(j.id) ? 'selected' : ''}>${escapeHTML(j.nome)}</option>`
          ).join('')}
        </select>
        <button type="button" class="stat-row__remove" data-action="remove" aria-label="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `;
  }).join('');

  // Bind change events
  list.querySelectorAll('.stat-row').forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    row.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.dataset.field;
        let val = input.value;
        if (field === 'minuto') val = val ? parseInt(val, 10) : null;
        if (field === 'jogador_id') {
          val = val ? parseInt(val, 10) : null;
          state.statsItems[idx].jogador_id = val;
          // Capturar também o nome do jogador para retro-compat e displaying
          if (val) {
            const jog = state.jogadores.find(j => j.id === val);
            state.statsItems[idx].jogador_nome = jog?.nome || '';
            state.statsItems[idx].jogador = jog?.nome || ''; // legado
          } else {
            state.statsItems[idx].jogador_nome = '';
            state.statsItems[idx].jogador = '';
          }
        } else {
          state.statsItems[idx][field] = val;
          // Ao mudar o lado (casa/fora), re-render para filtrar jogadores
          if (field === 'equipa') renderStatsList();
        }
      });
    });
    row.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      state.statsItems.splice(idx, 1);
      renderStatsList();
    });
  });
}

// Re-render stats quando equipas casa/fora mudam (filtragem de jogadores)
$('#resultEquipaCasaId')?.addEventListener('change', () => {
  if (state.statsItems.length > 0) renderStatsList();
});
$('#resultEquipaForaId')?.addEventListener('change', () => {
  if (state.statsItems.length > 0) renderStatsList();
});

$('#addStatBtn')?.addEventListener('click', () => {
  state.statsItems.push({ minuto: null, tipo: 'golo', equipa: 'casa', jogador_id: null, jogador_nome: '' });
  renderStatsList();
});


$('#newResultBtn')?.addEventListener('click', () => openResultEditor());

$('#resultForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  e.target.classList.add('submitted');
  const errEl = $('#resultFormError');
  const btn = $('#saveResultBtn');
  errEl.textContent = '';

  const titulo = $('#resultTitulo').value.trim();
  const categoria_id = $('#resultCategoria').value;
  const data = $('#resultData').value;
  const equipa_casa_id_val = $('#resultEquipaCasaId').value;
  const equipa_fora_id_val = $('#resultEquipaForaId').value;
  const marcadorCasa = $('#resultMarcadorCasa').value;
  const marcadorFora = $('#resultMarcadorFora').value;

  if (!titulo) { errEl.textContent = 'Título é obrigatório.'; return; }
  if (!categoria_id) { errEl.textContent = 'Escolha uma categoria.'; return; }
  if (!data) { errEl.textContent = 'Data é obrigatória.'; return; }
  if (!equipa_casa_id_val || !equipa_fora_id_val) { errEl.textContent = 'Equipas (casa e visitante) são obrigatórias.'; return; }
  if (equipa_casa_id_val === equipa_fora_id_val) { errEl.textContent = 'As duas equipas têm de ser diferentes.'; return; }
  if (marcadorCasa === '' || marcadorFora === '') { errEl.textContent = 'Marcador é obrigatório.'; return; }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    const equipaCasaSel = $('#resultEquipaCasaId').selectedOptions[0];
    const equipaForaSel = $('#resultEquipaForaId').selectedOptions[0];
    const mvpSel = $('#resultMVPId').selectedOptions[0];

    const payload = {
      titulo,
      categoria_id: parseInt(categoria_id, 10),
      data_evento: new Date(data).toISOString(),
      competicao: $('#resultCompeticao').value.trim() || null,
      local: $('#resultLocal').value.trim() || null,
      cidade: $('#resultCidade').value.trim() || null,
      equipa_casa_id: parseInt(equipa_casa_id_val, 10),
      equipa_fora_id: parseInt(equipa_fora_id_val, 10),
      // Texto cache (retro-compatibilidade)
      equipa_casa: equipaCasaSel?.textContent.trim() || '',
      equipa_fora: equipaForaSel?.textContent.trim() || '',
      resultado_casa: parseInt(marcadorCasa, 10),
      resultado_fora: parseInt(marcadorFora, 10),
      mvp_id: $('#resultMVPId').value ? parseInt($('#resultMVPId').value, 10) : null,
      mvp: ($('#resultMVPId').value && mvpSel) ? mvpSel.textContent.trim().split(' (')[0] : null,
      observacoes: $('#resultObservacoes').value.trim() || null,
      estatisticas: state.statsItems.filter(s => s.minuto !== null && s.minuto !== ''),
      destaque: $('#resultDestaque').checked,
      publicado: $('#resultPublicado').checked,
    };

    if (state.editingResultId) {
      await api.updateResultado(state.editingResultId, payload);
      toast('Resultado actualizado.', 'success');
    } else {
      payload.criada_por = state.user.id;
      await api.createResultado(payload);
      toast('Resultado criado.', 'success');
    }

    $('#resultModal').hidden = true;
    state.editingResultId = null;
    await loadResultados();
    if (typeof loadClassificacoes === 'function') await loadClassificacoes();
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao guardar.';
    toast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

$('#deleteResultBtn')?.addEventListener('click', () => {
  if (state.editingResultId) handleDeleteResult(state.editingResultId);
});

async function handleDeleteResult(id) {
  const r = state.results.find(x => x.id === id && x.origem === 'manual');
  const ok = await confirmDialog(
    'Eliminar resultado',
    `Eliminar "${r?.titulo || 'este resultado'}"? Esta acção não pode ser desfeita.`
  );
  if (!ok) return;
  try {
    await api.deleteResultado(id);
    toast('Resultado eliminado.', 'success');
    $('#resultModal').hidden = true;
    state.editingResultId = null;
    await loadResultados();
    if (typeof loadClassificacoes === 'function') await loadClassificacoes();
  } catch (err) {
    toast('Erro ao eliminar: ' + err.message, 'error');
  }
}

// ============================================================
// 15. VIEW: CLASSIFICAÇÕES
// ============================================================
async function loadClassificacoes() {
  const loading = $('#competicoesLoading');
  if (loading) loading.style.display = 'flex';
  try {
    // Carregar tudo em paralelo
    const [competicoes, classificacao, topMarcadores] = await Promise.all([
      api.listCompeticoes(),
      api.listClassificacao().catch(() => []),
      api.listTopMarcadores().catch(() => []),
    ]);
    state.competicoes = competicoes;
    state.classificacao = classificacao;
    state.topMarcadores = topMarcadores;
    if ($('#countCompeticoes')) $('#countCompeticoes').textContent = competicoes.length;
    renderClassificacoesView();
  } catch (err) {
    console.warn('Classificações:', err.message);
    state.competicoes = [];
    state.classificacao = [];
    state.topMarcadores = [];
    if ($('#countCompeticoes')) $('#countCompeticoes').textContent = '0';
    renderClassificacoesView();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function renderCompeticaoCategoriasSelect() {
  const sel = $('#competicaoCategoria');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Escolher —</option>' +
    state.categorias.map(c =>
      `<option value="${c.id}">${c.emoji} ${escapeHTML(c.nome)}</option>`
    ).join('');
}

function renderClassificacoesView() {
  const wrap = $('#competicoesWrap');
  if (!wrap) return;

  if (state.competicoes.length === 0) {
    wrap.innerHTML = `
      <div class="competicao-card__empty" style="background:var(--clr-bg-2);border:1px dashed var(--clr-border);border-radius:var(--radius);padding:3rem 1rem">
        <p style="margin:0">Nenhuma competição criada ainda.</p>
        <p style="margin:0.5rem 0 0;font-size:0.85rem">Crie uma competição com o nome <strong>exactamente igual</strong> ao usado no campo "Competição" dos resultados.</p>
      </div>
    `;
    return;
  }

  wrap.innerHTML = state.competicoes.map(c => renderCompeticaoCard(c)).join('');

  // Bind acções de edit/delete competição + ajustes
  wrap.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      const action = btn.dataset.action;
      if (action === 'edit-competicao')   openCompeticaoEditor(id);
      if (action === 'delete-competicao') handleDeleteCompeticao(id);
      if (action === 'add-ajuste')        openAjusteEditor(id);
      if (action === 'remove-ajuste')     handleRemoveAjuste(parseInt(btn.dataset.ajusteId, 10), id);
    });
  });
}

function renderCompeticaoCard(c) {
  const cat = c.categorias || {};
  const linhas = state.classificacao.filter(r => r.competicao_id === c.id);
  const marcadores = state.topMarcadores.filter(m => m.competicao_id === c.id).slice(0, 5);

  const tabelaHTML = linhas.length === 0
    ? '<div class="competicao-card__empty">Sem jogos terminados ainda nesta competição.</div>'
    : `
      <table class="classificacao-table">
        <thead>
          <tr>
            <th class="pos">#</th>
            <th>Equipa</th>
            <th class="num">J</th>
            <th class="num">V</th>
            <th class="num">E</th>
            <th class="num">D</th>
            <th class="num">GM</th>
            <th class="num">GS</th>
            <th class="num">DG</th>
            <th class="pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          ${linhas.map((r, i) => {
            const ajusteHTML = r.ajuste_pontos
              ? `<span class="ajuste ajuste--${r.ajuste_pontos > 0 ? 'positivo' : 'negativo'}">(${r.ajuste_pontos > 0 ? '+' : ''}${r.ajuste_pontos})</span>`
              : '';
            return `
              <tr>
                <td class="pos">${i + 1}</td>
                <td class="equipa">${escapeHTML(r.equipa)}</td>
                <td class="num">${r.jogos}</td>
                <td class="num">${r.vitorias}</td>
                <td class="num">${r.empates}</td>
                <td class="num">${r.derrotas}</td>
                <td class="num">${r.gm}</td>
                <td class="num">${r.gs}</td>
                <td class="num">${r.diferenca_golos > 0 ? '+' : ''}${r.diferenca_golos}</td>
                <td class="pts">${r.pontos}${ajusteHTML}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

  const marcadoresHTML = marcadores.length > 0 ? `
    <div class="top-marcadores">
      <h4 class="top-marcadores__title">⚽ Top Marcadores</h4>
      <ol class="top-marcadores__list">
        ${marcadores.map((m, i) => `
          <li class="top-marcadores__item">
            <span class="top-marcadores__pos ${i === 0 ? 'top-marcadores__pos--first' : ''}">${i + 1}</span>
            <span><strong>${escapeHTML(m.jogador)}</strong> <small style="color:var(--clr-muted)">(${escapeHTML(m.equipa || '')})</small></span>
            <span class="top-marcadores__golos">${m.golos}</span>
          </li>
        `).join('')}
      </ol>
    </div>
  ` : '';

  const status = !c.publicada ? '<span class="table__status table__status--rascunho">Rascunho</span>'
    : !c.ativa ? '<span class="table__status table__status--rascunho">Inactiva</span>'
    : '';

  return `
    <article class="competicao-card">
      <header class="competicao-card__head">
        <div>
          <h2 class="competicao-card__title">
            ${cat.emoji || ''} ${escapeHTML(c.nome)} ${status}
          </h2>
          <div class="competicao-card__meta">
            <span>Vitória: <strong>${c.pontos_vitoria}</strong> pts</span>
            <span>Empate: <strong>${c.pontos_empate}</strong> pts</span>
            <span>Derrota: <strong>${c.pontos_derrota}</strong> pts</span>
            <span>${linhas.length} equipa${linhas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="competicao-card__actions">
          <button class="icon-btn" data-action="edit-competicao" data-id="${c.id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button class="icon-btn" data-action="delete-competicao" data-id="${c.id}" title="Eliminar" style="color:#ef4444">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
      </header>

      ${tabelaHTML}
      ${marcadoresHTML}

      <footer class="competicao-card__bottom">
        <button class="btn btn--ghost btn--sm" data-action="add-ajuste" data-id="${c.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          Ajustar pontos
        </button>
      </footer>
    </article>
  `;
}

// ============================================================
// 16. EDITOR DE COMPETIÇÃO
// ============================================================
function openCompeticaoEditor(id = null) {
  state.editingCompeticaoId = id;
  const modal = $('#competicaoModal');
  const form = $('#competicaoForm');
  form.reset();
  $('#competicaoFormError').textContent = '';
  $('#deleteCompeticaoBtn').hidden = !id;

  renderCompeticaoCategoriasSelect();

  if (id) {
    const c = state.competicoes.find(x => x.id === id);
    if (!c) return;
    $('#competicaoModalTitle').textContent = 'Editar competição';
    $('#competicaoId').value = c.id;
    $('#competicaoNome').value = c.nome;
    $('#competicaoCategoria').value = c.categoria_id || '';
    $('#competicaoDataInicio').value = c.data_inicio || '';
    $('#competicaoDataFim').value = c.data_fim || '';
    $('#competicaoPontosVitoria').value = c.pontos_vitoria;
    $('#competicaoPontosEmpate').value = c.pontos_empate;
    $('#competicaoPontosDerrota').value = c.pontos_derrota;
    $('#competicaoAtiva').checked = c.ativa;
    $('#competicaoPublicada').checked = c.publicada;
  } else {
    $('#competicaoModalTitle').textContent = 'Nova competição';
    $('#competicaoId').value = '';
    $('#competicaoPontosVitoria').value = 3;
    $('#competicaoPontosEmpate').value = 1;
    $('#competicaoPontosDerrota').value = 0;
    $('#competicaoAtiva').checked = true;
    $('#competicaoPublicada').checked = true;
  }

  modal.hidden = false;
}

$('#newCompeticaoBtn')?.addEventListener('click', () => openCompeticaoEditor());

function generateCompeticaoSlug(nome) {
  return nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

$('#competicaoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#competicaoFormError');
  const btn = $('#saveCompeticaoBtn');
  errEl.textContent = '';

  const nome = $('#competicaoNome').value.trim();
  const categoria_id = $('#competicaoCategoria').value;

  if (!nome) { errEl.textContent = 'Nome é obrigatório.'; return; }
  if (!categoria_id) { errEl.textContent = 'Escolha uma categoria.'; return; }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    const payload = {
      nome,
      slug: generateCompeticaoSlug(nome),
      categoria_id: parseInt(categoria_id, 10),
      pontos_vitoria: parseInt($('#competicaoPontosVitoria').value, 10) || 3,
      pontos_empate:  parseInt($('#competicaoPontosEmpate').value, 10)  || 1,
      pontos_derrota: parseInt($('#competicaoPontosDerrota').value, 10) || 0,
      data_inicio: $('#competicaoDataInicio').value || null,
      data_fim:    $('#competicaoDataFim').value    || null,
      ativa:       $('#competicaoAtiva').checked,
      publicada:   $('#competicaoPublicada').checked,
    };

    if (state.editingCompeticaoId) {
      await api.updateCompeticao(state.editingCompeticaoId, payload);
      toast('Competição actualizada.', 'success');
    } else {
      await api.createCompeticao(payload);
      toast('Competição criada.', 'success');
    }

    $('#competicaoModal').hidden = true;
    state.editingCompeticaoId = null;
    await loadClassificacoes();
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao guardar.';
    toast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

$('#deleteCompeticaoBtn')?.addEventListener('click', () => {
  if (state.editingCompeticaoId) handleDeleteCompeticao(state.editingCompeticaoId);
});

async function handleDeleteCompeticao(id) {
  const c = state.competicoes.find(x => x.id === id);
  const ok = await confirmDialog(
    'Eliminar competição',
    `Eliminar "${c?.nome || 'esta competição'}"? Os jogos não serão apagados — só a tabela classificativa desaparece. Esta acção não pode ser desfeita.`
  );
  if (!ok) return;
  try {
    await api.deleteCompeticao(id);
    toast('Competição eliminada.', 'success');
    $('#competicaoModal').hidden = true;
    state.editingCompeticaoId = null;
    await loadClassificacoes();
  } catch (err) {
    toast('Erro ao eliminar: ' + err.message, 'error');
  }
}

// ============================================================
// 17. AJUSTES DE PONTOS
// ============================================================
function openAjusteEditor(competicaoId) {
  $('#ajusteCompeticaoId').value = competicaoId;
  $('#ajusteForm').reset();
  $('#ajusteFormError').textContent = '';
  fillEquipasSelect($('#ajusteEquipaId'), { placeholder: '— Escolher —' });
  $('#ajusteModal').hidden = false;
}

$('#ajusteForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#ajusteFormError');
  const btn = $('#saveAjusteBtn');
  errEl.textContent = '';

  const competicaoId = parseInt($('#ajusteCompeticaoId').value, 10);
  const equipaId = $('#ajusteEquipaId').value;
  const pontosStr = $('#ajustePontos').value;

  if (!equipaId) { errEl.textContent = 'Escolha uma equipa.'; return; }
  if (pontosStr === '') { errEl.textContent = 'Pontos obrigatórios.'; return; }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    const equipaSel = $('#ajusteEquipaId').selectedOptions[0];
    await api.createAjuste({
      competicao_id: competicaoId,
      equipa_id: parseInt(equipaId, 10),
      equipa: equipaSel?.textContent.trim() || '', // texto cache
      pontos: parseInt(pontosStr, 10),
      motivo: $('#ajusteMotivo').value.trim() || null,
      criada_por: state.user.id,
    });
    toast('Ajuste adicionado.', 'success');
    $('#ajusteModal').hidden = true;
    await loadClassificacoes();
  } catch (err) {
    errEl.textContent = err.message;
    toast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Adicionar';
  }
});

async function handleRemoveAjuste(ajusteId, competicaoId) {
  const ok = await confirmDialog('Remover ajuste', 'Tem a certeza que quer remover este ajuste?');
  if (!ok) return;
  try {
    await api.deleteAjuste(ajusteId);
    toast('Ajuste removido.', 'success');
    await loadClassificacoes();
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

// ============================================================
// 18. HELPERS — Selects de equipas/jogadores
// ============================================================
function fillEquipasSelect(selEl, options = {}) {
  if (!selEl) return;
  const { placeholder = '— Sem equipa —', selected = '' } = options;
  selEl.innerHTML = `<option value="">${placeholder}</option>` +
    state.equipas.map(e =>
      `<option value="${e.id}" ${String(selected) === String(e.id) ? 'selected' : ''}>${escapeHTML(e.nome)}</option>`
    ).join('');
}

function fillJogadoresSelect(selEl, options = {}) {
  if (!selEl) return;
  const { placeholder = '— Escolher —', selected = '', filterEquipaId = null } = options;
  let lista = state.jogadores;
  if (filterEquipaId) {
    lista = lista.filter(j => String(j.equipa_id) === String(filterEquipaId));
  }
  selEl.innerHTML = `<option value="">${placeholder}</option>` +
    lista.map(j => {
      const sufixo = j.equipa_nome ? ` (${j.equipa_nome})` : '';
      return `<option value="${j.id}" ${String(selected) === String(j.id) ? 'selected' : ''}>${escapeHTML(j.nome)}${escapeHTML(sufixo)}</option>`;
    }).join('');
}

function refreshAllEquipasSelects() {
  fillEquipasSelect($('#eventEquipaCasaId'),  { placeholder: '— Sem equipa —' });
  fillEquipasSelect($('#eventEquipaForaId'),  { placeholder: '— Sem equipa —' });
  fillEquipasSelect($('#resultEquipaCasaId'), { placeholder: '— Escolher —' });
  fillEquipasSelect($('#resultEquipaForaId'), { placeholder: '— Escolher —' });
  fillEquipasSelect($('#ajusteEquipaId'),     { placeholder: '— Escolher —' });
  // Filtro de jogadores por equipa
  const filterSel = $('#filterJogadorEquipa');
  if (filterSel) {
    filterSel.innerHTML = '<option value="">Todas as equipas</option>' +
      state.equipas.map(e => `<option value="${e.id}">${escapeHTML(e.nome)}</option>`).join('');
  }
}

function refreshAllJogadoresSelects() {
  fillJogadoresSelect($('#resultMVPId'), { placeholder: '— Sem MVP —' });
}

// ============================================================
// 19. VIEW: EQUIPAS
// ============================================================
async function loadEquipas() {
  const loading = $('#equipasLoading');
  if (loading) loading.style.display = 'flex';
  try {
    state.equipas = await api.listEquipas();
    if ($('#countEquipas')) $('#countEquipas').textContent = state.equipas.length;
    renderEquipasTable();
    refreshAllEquipasSelects();
  } catch (err) {
    console.warn('Equipas:', err.message);
    state.equipas = [];
    if ($('#countEquipas')) $('#countEquipas').textContent = '0';
    renderEquipasTable();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function getFilteredEquipas() {
  const s = state.equipaFilters.search.toLowerCase().trim();
  if (!s) return state.equipas;
  return state.equipas.filter(e =>
    (e.nome || '').toLowerCase().includes(s) ||
    (e.cidade || '').toLowerCase().includes(s)
  );
}

function renderEquipasTable() {
  const tbody = $('#equipasTbody');
  const empty = $('#equipasEmpty');
  if (!tbody) return;

  const rows = getFilteredEquipas();
  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  // Contagem de jogadores por equipa
  const jogadoresPorEquipa = {};
  state.jogadores.forEach(j => {
    if (j.equipa_id) {
      jogadoresPorEquipa[j.equipa_id] = (jogadoresPorEquipa[j.equipa_id] || 0) + 1;
    }
  });

  tbody.innerHTML = rows.map(e => `
    <tr data-id="${e.id}" style="cursor:pointer">
      <td><span class="table__titulo">${escapeHTML(e.nome)}</span></td>
      <td style="color:var(--clr-text-2)">${escapeHTML(e.cidade || '—')}</td>
      <td style="color:var(--clr-muted)">${e.fundada_em || '—'}</td>
      <td style="color:var(--clr-muted)">${escapeHTML(e.cores || '—')}</td>
      <td><strong>${jogadoresPorEquipa[e.id] || 0}</strong></td>
      <td><div class="table__actions">
        <button class="icon-btn" data-action="edit" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button class="icon-btn" data-action="delete" title="Eliminar" style="color:#ef4444">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    const id = parseInt(tr.dataset.id, 10);
    tr.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action]');
      if (btn) {
        ev.stopPropagation();
        if (btn.dataset.action === 'edit')   openEquipaEditor(id);
        if (btn.dataset.action === 'delete') handleDeleteEquipa(id);
      } else {
        openEquipaEditor(id);
      }
    });
  });
}

$('#equipaSearch')?.addEventListener('input', (e) => {
  state.equipaFilters.search = e.target.value;
  renderEquipasTable();
});

function openEquipaEditor(id = null) {
  state.editingEquipaId = id;
  const modal = $('#equipaModal');
  const form = $('#equipaForm');
  form.reset();
  $('#equipaFormError').textContent = '';
  $('#deleteEquipaBtn').hidden = !id;

  if (id) {
    const e = state.equipas.find(x => x.id === id);
    if (!e) return;
    $('#equipaModalTitle').textContent = 'Editar equipa';
    $('#equipaId').value = e.id;
    $('#equipaNome').value = e.nome;
    $('#equipaCidade').value = e.cidade || '';
    $('#equipaFundada').value = e.fundada_em || '';
    $('#equipaCores').value = e.cores || '';
    $('#equipaObservacoes').value = e.observacoes || '';
  } else {
    $('#equipaModalTitle').textContent = 'Nova equipa';
    $('#equipaId').value = '';
  }
  modal.hidden = false;
}

$('#newEquipaBtn')?.addEventListener('click', () => openEquipaEditor());

$('#equipaForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#equipaFormError');
  const btn = $('#saveEquipaBtn');
  errEl.textContent = '';

  const nome = $('#equipaNome').value.trim();
  if (!nome) { errEl.textContent = 'Nome é obrigatório.'; return; }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    const payload = {
      nome,
      slug: nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
        .replace(/^-+|-+$/g, ''),
      cidade: $('#equipaCidade').value.trim() || null,
      fundada_em: $('#equipaFundada').value ? parseInt($('#equipaFundada').value, 10) : null,
      cores: $('#equipaCores').value.trim() || null,
      observacoes: $('#equipaObservacoes').value.trim() || null,
    };

    if (state.editingEquipaId) {
      await api.updateEquipa(state.editingEquipaId, payload);
      toast('Equipa actualizada.', 'success');
    } else {
      await api.createEquipa(payload);
      toast('Equipa criada.', 'success');
    }

    $('#equipaModal').hidden = true;
    state.editingEquipaId = null;
    await loadEquipas();
  } catch (err) {
    errEl.textContent = err.message;
    toast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

$('#deleteEquipaBtn')?.addEventListener('click', () => {
  if (state.editingEquipaId) handleDeleteEquipa(state.editingEquipaId);
});

async function handleDeleteEquipa(id) {
  const e = state.equipas.find(x => x.id === id);
  const ok = await confirmDialog(
    'Eliminar equipa',
    `Eliminar "${e?.nome || 'esta equipa'}"? Os resultados/eventos existentes ficarão sem equipa associada.`
  );
  if (!ok) return;
  try {
    await api.deleteEquipa(id);
    toast('Equipa eliminada.', 'success');
    $('#equipaModal').hidden = true;
    state.editingEquipaId = null;
    await loadEquipas();
    await loadJogadores();
  } catch (err) {
    toast('Erro ao eliminar: ' + err.message, 'error');
  }
}

// ============================================================
// 20. VIEW: JOGADORES
// ============================================================
async function loadJogadores() {
  const loading = $('#jogadoresLoading');
  if (loading) loading.style.display = 'flex';
  try {
    state.jogadores = await api.listJogadores();
    if ($('#countJogadores')) $('#countJogadores').textContent = state.jogadores.length;
    renderJogadoresTable();
    refreshAllJogadoresSelects();
  } catch (err) {
    console.warn('Jogadores:', err.message);
    state.jogadores = [];
    if ($('#countJogadores')) $('#countJogadores').textContent = '0';
    renderJogadoresTable();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function getFilteredJogadores() {
  const { search, equipa } = state.jogadorFilters;
  const s = search.toLowerCase().trim();
  return state.jogadores.filter(j => {
    if (s && !(j.nome || '').toLowerCase().includes(s)
         && !(j.apelido || '').toLowerCase().includes(s)) return false;
    if (equipa && String(j.equipa_id) !== String(equipa)) return false;
    return true;
  });
}

function renderJogadoresTable() {
  const tbody = $('#jogadoresTbody');
  const empty = $('#jogadoresEmpty');
  if (!tbody) return;

  const rows = getFilteredJogadores();
  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  tbody.innerHTML = rows.map(j => `
    <tr data-id="${j.id}" style="cursor:pointer">
      <td>
        <span class="table__titulo">${escapeHTML(j.nome)}</span>
        ${j.apelido ? `<br><small style="color:var(--clr-muted)">"${escapeHTML(j.apelido)}"</small>` : ''}
      </td>
      <td style="color:var(--clr-text-2)">${escapeHTML(j.equipa_nome || '— Sem equipa —')}</td>
      <td style="color:var(--clr-muted)">${escapeHTML(j.posicao || '—')}</td>
      <td style="color:var(--clr-muted)">${j.numero_actual ?? j.numero_camisola ?? '—'}</td>
      <td><div class="table__actions">
        <button class="icon-btn" data-action="edit" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button class="icon-btn" data-action="delete" title="Eliminar" style="color:#ef4444">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    const id = parseInt(tr.dataset.id, 10);
    tr.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action]');
      if (btn) {
        ev.stopPropagation();
        if (btn.dataset.action === 'edit')   openJogadorEditor(id);
        if (btn.dataset.action === 'delete') handleDeleteJogador(id);
      } else {
        openJogadorEditor(id);
      }
    });
  });
}

$('#jogadorSearch')?.addEventListener('input', (e) => {
  state.jogadorFilters.search = e.target.value;
  renderJogadoresTable();
});
$('#filterJogadorEquipa')?.addEventListener('change', (e) => {
  state.jogadorFilters.equipa = e.target.value;
  renderJogadoresTable();
});

async function openJogadorEditor(id = null) {
  state.editingJogadorId = id;
  state.jogadorEquipasItems = [];
  const modal = $('#jogadorModal');
  const form = $('#jogadorForm');
  form.reset();
  $('#jogadorFormError').textContent = '';
  $('#deleteJogadorBtn').hidden = !id;

  if (id) {
    const j = await api.getJogador(id);
    if (!j) return;
    $('#jogadorModalTitle').textContent = 'Editar jogador';
    $('#jogadorId').value = j.id;
    $('#jogadorNome').value = j.nome;
    $('#jogadorApelido').value = j.apelido || '';
    $('#jogadorPosicao').value = j.posicao || '';
    $('#jogadorNumero').value = j.numero_camisola ?? '';
    $('#jogadorDataNasc').value = j.data_nascimento || '';
    $('#jogadorObservacoes').value = j.observacoes || '';

    // Carregar vínculos
    const vinculos = await api.listVinculosByJogador(id);
    state.jogadorEquipasItems = vinculos.map(v => ({
      id: v.id,
      equipa_id: v.equipa_id,
      equipa_nome: v.equipas?.nome,
      desde: v.desde,
      ate: v.ate,
      numero_camisola: v.numero_camisola,
    }));
  } else {
    $('#jogadorModalTitle').textContent = 'Novo jogador';
    $('#jogadorId').value = '';
  }

  renderJogadorEquipas();
  modal.hidden = false;
}

function renderJogadorEquipas() {
  const list = $('#jogadorEquipasList');
  if (!list) return;
  list.innerHTML = state.jogadorEquipasItems.map((v, i) => `
    <div class="stat-row" data-index="${i}">
      <select data-field="equipa_id" style="grid-column: span 2">
        ${state.equipas.map(e =>
          `<option value="${e.id}" ${String(v.equipa_id) === String(e.id) ? 'selected' : ''}>${escapeHTML(e.nome)}</option>`
        ).join('')}
      </select>
      <input type="date" placeholder="Desde" value="${v.desde || ''}" data-field="desde" title="Desde" />
      <input type="date" placeholder="Até (vazio = actual)" value="${v.ate || ''}" data-field="ate" title="Até (vazio = actual)" />
      <button type="button" class="stat-row__remove" data-action="remove-vinculo" aria-label="Remover">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.stat-row').forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    row.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.dataset.field;
        let val = input.value || null;
        if (field === 'equipa_id' && val) val = parseInt(val, 10);
        state.jogadorEquipasItems[idx][field] = val;
      });
    });
    row.querySelector('[data-action="remove-vinculo"]')?.addEventListener('click', () => {
      state.jogadorEquipasItems.splice(idx, 1);
      renderJogadorEquipas();
    });
  });
}

$('#addJogadorEquipaBtn')?.addEventListener('click', () => {
  if (state.equipas.length === 0) {
    toast('Crie pelo menos uma equipa primeiro.', 'error');
    return;
  }
  state.jogadorEquipasItems.push({
    equipa_id: state.equipas[0].id,
    desde: null, ate: null, numero_camisola: null,
  });
  renderJogadorEquipas();
});

$('#newJogadorBtn')?.addEventListener('click', () => openJogadorEditor());

$('#jogadorForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#jogadorFormError');
  const btn = $('#saveJogadorBtn');
  errEl.textContent = '';

  const nome = $('#jogadorNome').value.trim();
  if (!nome) { errEl.textContent = 'Nome é obrigatório.'; return; }

  btn.disabled = true;
  btn.textContent = 'A guardar...';

  try {
    const payload = {
      nome,
      apelido: $('#jogadorApelido').value.trim() || null,
      posicao: $('#jogadorPosicao').value.trim() || null,
      numero_camisola: $('#jogadorNumero').value ? parseInt($('#jogadorNumero').value, 10) : null,
      data_nascimento: $('#jogadorDataNasc').value || null,
      observacoes: $('#jogadorObservacoes').value.trim() || null,
    };

    let jogadorId;
    if (state.editingJogadorId) {
      await api.updateJogador(state.editingJogadorId, payload);
      jogadorId = state.editingJogadorId;
      toast('Jogador actualizado.', 'success');
    } else {
      const created = await api.createJogador(payload);
      jogadorId = created.id;
      toast('Jogador criado.', 'success');
    }

    // Sincronizar vínculos: estratégia simples — apagar todos e recriar
    if (state.editingJogadorId) {
      const existentes = await api.listVinculosByJogador(jogadorId);
      for (const v of existentes) await api.deleteVinculo(v.id);
    }
    for (const v of state.jogadorEquipasItems) {
      if (v.equipa_id) {
        await api.createVinculo({
          jogador_id: jogadorId,
          equipa_id: v.equipa_id,
          desde: v.desde || null,
          ate:   v.ate   || null,
          numero_camisola: v.numero_camisola || null,
        });
      }
    }

    $('#jogadorModal').hidden = true;
    state.editingJogadorId = null;
    await loadJogadores();
  } catch (err) {
    errEl.textContent = err.message;
    toast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

$('#deleteJogadorBtn')?.addEventListener('click', () => {
  if (state.editingJogadorId) handleDeleteJogador(state.editingJogadorId);
});

async function handleDeleteJogador(id) {
  const j = state.jogadores.find(x => x.id === id);
  const ok = await confirmDialog(
    'Eliminar jogador',
    `Eliminar "${j?.nome || 'este jogador'}"? Os resultados/MVPs existentes ficarão sem jogador associado.`
  );
  if (!ok) return;
  try {
    await api.deleteJogador(id);
    toast('Jogador eliminado.', 'success');
    $('#jogadorModal').hidden = true;
    state.editingJogadorId = null;
    await loadJogadores();
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

// ============================================================
// BOOT
// ============================================================
checkAuth();
