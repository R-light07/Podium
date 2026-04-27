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
  filters: { search: '', categoria: '', status: '' },
  editingId: null,
  editingCategoryId: null,
  uploadedFile: null,
  // Galeria: {url} para imagens já existentes em Supabase, {file} para novos uploads ainda por subir
  galleryItems: [],
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
};

// ============================================================
// 3. LOAD DATA
// ============================================================
async function loadCategorias() {
  try {
    state.categorias = await api.listCategorias();
    renderCategoriesSelects();
    renderCategoriesView();
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
// BOOT
// ============================================================
checkAuth();
