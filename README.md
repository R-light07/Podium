# Podium — Plataforma Desportiva

Plataforma de notícias desportivas com site público e dashboard administrativo, integrada com Supabase.

## Estrutura do projecto

```
podium/
├── index.html              ← Site público
├── styles.css              ← Estilos do site
├── script.js               ← Lógica do site (Supabase + fallback mock)
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
│   ├── schema.sql          ← Schema completo (para projectos novos)
│   ├── migration_001_imagens.sql  ← Migração para projectos existentes
│   └── diagnostico_imagens.sql    ← SQL para debug de imagens
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

Veja `supabase/SETUP.md` para o passo-a-passo completo.

Resumo:
1. Criar projecto em [supabase.com](https://supabase.com)
2. Correr `supabase/schema.sql` no SQL Editor
3. Preencher `supabase-config.js` com URL e anon key
4. Criar utilizador admin via Authentication → Users
5. Adicioná-lo a `admin_users` via SQL

### 3. Aceder ao dashboard

Após setup, abrir `http://localhost:8000/admin/` e fazer login com o utilizador criado.

## Funcionalidades

### Site público
- Hero slider com autoplay 3s, swipe mobile, navegação por dots/setas
- Notícias dinâmicas com filtros por categoria
- Pesquisa live com highlight
- Modal de notícia individual com partilha social (Facebook, Twitter, WhatsApp, copiar link)
- Sistema de favoritos (localStorage)
- Imagens magazine-style no hero, miniaturas nos cards
- Responsivo total (desktop, tablet, mobile)
- Acessibilidade (ARIA, skip links, prefers-reduced-motion)
- Fallback automático para dados mock se Supabase não configurado

### Dashboard admin
- Login Supabase Auth com verificação de role
- CRUD completo de notícias (criar, editar, eliminar)
- Upload de imagens drag & drop para Supabase Storage
- Gestão de categorias com slug auto-gerado, emoji e cor
- Gestor de destaques (ordem, remover do hero)
- Toggle publicada/rascunho
- Agendamento de data de publicação
- Filtros e pesquisa na tabela
- Mobile-friendly

### Backend (Supabase)
- Tabelas: `categorias`, `noticias`, `admin_users`
- Row Level Security em todas as tabelas
- Storage bucket público para imagens (5 MB max, só MIME types de imagem)
- Triggers automáticos: slug único, `actualizada_em`
- View `noticias_publicas` com join de categoria pré-feito
- Funções RPC: `incrementar_views`, `limpar_imagens_orfas`

## Stack técnica

- HTML5, CSS3, JavaScript (sem build step)
- Supabase JS SDK v2 (CDN)
- Sem frameworks (vanilla JS modular)
- Fontes: Bebas Neue + Barlow + Barlow Condensed (Google Fonts)
- Ícones: SVG inline (com fallback Font Awesome)

## Documentação adicional

| Ficheiro | Conteúdo |
|---|---|
| `COMO-ARRANCAR.md` | Como servir o projecto localmente |
| `supabase/SETUP.md` | Setup completo do Supabase |
| `images/README.md` | Como substituir placeholders por fotos próprias |

## Suporte para problemas

- **Dashboard fica em "A verificar sessão..."**: ver `COMO-ARRANCAR.md` (não usar file://)
- **"Invalid path specified"**: URL Supabase mal preenchido em `supabase-config.js`
- **Imagens não carregam**: correr `supabase/diagnostico_imagens.sql` no SQL Editor

## Licença

Projecto desenvolvido para a Podium.
