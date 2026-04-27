# Podium — Plataforma Desportiva

Plataforma de notícias desportivas com site público, página de notícia dedicada e dashboard administrativo, integrada com Supabase.

## Estrutura do projecto

```
podium/
├── index.html              ← Site público (lista de notícias)
├── noticia.html            ← Página dedicada de cada notícia
├── styles.css              ← Estilos partilhados
├── script.js               ← Lógica do site público
├── noticia.js              ← Lógica da página de notícia
├── data.js                 ← Dados mock partilhados
├── supabase-config.js      ← ⚠ PREENCHER com URL + anon key
├── COMO-ARRANCAR.md        ← Como arrancar localmente (LER PRIMEIRO!)
│
├── admin/                  ← Dashboard administrativo
│   ├── index.html
│   ├── admin.css
│   └── admin.js
│
├── supabase/               ← Configuração da base de dados
│   ├── SETUP.md            ← Guia de setup passo-a-passo
│   ├── schema.sql          ← Schema completo (projectos novos)
│   ├── migration_001_imagens.sql  ← Migração de capa
│   ├── migration_002_galeria.sql  ← Migração de galeria múltipla
│   └── diagnostico_imagens.sql    ← SQL para debug
│
└── images/                 ← Placeholders para modo mock
    ├── README.md
    └── *.svg               ← 12 imagens placeholder
```

## Início rápido

### 1. Abrir o projecto localmente

⚠️ **Não funciona com duplo-clique** (`file://`). Veja `COMO-ARRANCAR.md`.

Resumo: terminal na pasta do projecto →
```
python3 -m http.server 8000
```
Depois abrir `http://localhost:8000/`.

### 2. Ligar ao Supabase

Veja `supabase/SETUP.md` para passo-a-passo.

Para projectos **existentes**, correr também:
- `supabase/migration_002_galeria.sql` (suporte de galerias múltiplas)

### 3. Aceder ao dashboard

- **Discreto**: ícone de cadeado no canto inferior direito do footer
- **Directo**: `http://localhost:8000/admin/`

## Funcionalidades principais

### Site público (`index.html`)
- Hero slider magazine com autoplay 3s
- Notícias dinâmicas com filtros e pesquisa
- Sistema de favoritos (localStorage)
- Ao clicar numa notícia → vai para `noticia.html?slug=<slug>`
- Ícone discreto de admin no footer

### Página de notícia (`noticia.html`)
- Hero magazine com imagem de capa em destaque
- Título grande + meta (data, autor, categoria)
- Drop cap no primeiro parágrafo
- **Galeria com lightbox**:
  - Grelha responsiva
  - Click abre lightbox fullscreen
  - Navegação com setas / teclado (←/→/Esc)
  - Caption com numeração ("1 / 5")
- Botões de partilha (Facebook, Twitter, WhatsApp, copiar link)
- Botão de favoritar sincronizado
- "Mais notícias desta categoria" (relacionadas)
- Página 404 quando slug não existe
- SEO: título dinâmico + Open Graph tags
- URL amigável: `noticia.html?slug=jovem-talentosa-liga-nacional`

### Dashboard admin (`admin/`)
- CRUD completo de notícias e categorias
- **Capa**: upload drag & drop (5 MB máximo)
- **Galeria**: upload múltiplo (drag & drop, 5 MB cada)
  - Thumbnails com remoção individual
  - Badge "NOVO" em imagens não guardadas
  - Mantém imagens existentes ao editar
- Toggle publicada / rascunho / destaque
- Pesquisa e filtros
- Mobile responsive

### Backend (Supabase)
- Tabelas: `categorias`, `noticias`, `admin_users`
- Coluna `imagens_galeria text[]` na tabela `noticias`
- Row Level Security em todas as tabelas
- Storage bucket público (5 MB max, MIME types validados)
- Triggers automáticos: slug único, `actualizada_em`
- View `noticias_publicas` com join completo
- Funções RPC: `incrementar_views`, `limpar_imagens_orfas`

## Stack técnica

- HTML5, CSS3, JavaScript (sem build step)
- Supabase JS SDK v2 (CDN)
- Vanilla JS modular (sem frameworks)
- Fontes: Bebas Neue + Barlow + Barlow Condensed (Google Fonts)
- Ícones: SVG inline + Font Awesome

## Documentação adicional

| Ficheiro | Conteúdo |
|---|---|
| `COMO-ARRANCAR.md` | Como servir o projecto localmente |
| `supabase/SETUP.md` | Setup completo do Supabase |
| `images/README.md` | Como substituir placeholders por fotos |

## Suporte para problemas

- **Dashboard fica em "A verificar sessão..."**: ver `COMO-ARRANCAR.md` (não usar file://)
- **"Invalid path specified"**: URL Supabase mal preenchido em `supabase-config.js`
- **Imagens não carregam**: correr `supabase/diagnostico_imagens.sql` no SQL Editor
- **Galeria não aparece**: correr `supabase/migration_002_galeria.sql` para adicionar a coluna
