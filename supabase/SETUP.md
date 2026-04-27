# Podium — Setup do Supabase

Guia passo-a-passo para ligar o site público e o dashboard admin ao Supabase.

## Pré-requisitos

- Conta gratuita em [supabase.com](https://supabase.com)
- Os ficheiros do projecto (site público + dashboard admin) num servidor web ou acessíveis via `file://`

---

## 1. Criar projecto Supabase

1. Entre em https://supabase.com/dashboard
2. Clique em **"New project"**
3. Escolha um nome (ex: `podium-prod`), uma região próxima (ex: `eu-west-1`) e uma **database password** forte — guarde-a
4. Aguarde ~2 minutos pela criação

---

## 2. Executar o schema SQL

1. No dashboard Supabase, navegue para **SQL Editor** (ícone `{ }` na barra lateral)
2. Clique em **"New query"**
3. Abra o ficheiro `supabase/schema.sql` deste projecto
4. Copie todo o conteúdo e cole no editor
5. Clique em **"Run"** (ou `Ctrl+Enter`)
6. Deve ver `Success. No rows returned` — o schema foi criado

Isto cria:
- Tabelas: `categorias`, `noticias`, `admin_users`
- View `noticias_publicas` (usada pelo site público)
- Triggers para `actualizada_em` automático e geração de `slug`
- Função `is_admin()` para verificar permissões
- Row Level Security (RLS) em todas as tabelas
- Bucket de Storage `noticias-imagens` para upload de imagens
- Seed de 6 categorias + 3 notícias de exemplo

---

## 3. Obter as credenciais

1. No dashboard Supabase, vá a **Project Settings** (engrenagem) → **API**
2. Copie os dois valores seguintes:
   - **Project URL** → parece-se com `https://abcdefgh.supabase.co`
   - **Project API Keys → anon public** → começa com `eyJhbGc...`

> A *anon public* key é **segura no cliente** por design. As políticas RLS garantem que utilizadores anónimos só podem ler notícias publicadas, e que só administradores podem escrever.

> A *service_role* key **nunca** deve ser usada no frontend.

---

## 4. Configurar o projecto local

Abra o ficheiro **`supabase-config.js`** na raiz do projecto e substitua:

```js
window.PODIUM_CONFIG = {
  SUPABASE_URL:      'https://abcdefgh.supabase.co',      // ← o seu Project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',                      // ← a sua anon key
  STORAGE_BUCKET:    'noticias-imagens'                    // ← não mexer
};
```

---

## 5. Criar o primeiro administrador

### 5.1 Criar o utilizador

1. No dashboard Supabase → **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Introduza:
   - Email: `admin@podium.co.mz` (ou outro)
   - Password: escolha uma palavra-passe forte
   - **Auto Confirm User**: ✅ marcar (senão terá de confirmar email)
4. Clique em **"Create user"**
5. Copie o **User UID** (formato UUID, ex: `a1b2c3d4-e5f6-...`)

### 5.2 Atribuir role de admin

1. Volte ao **SQL Editor**
2. Execute:

```sql
insert into public.admin_users (user_id, role)
values ('COLE_O_UUID_AQUI', 'admin');
```

Confirme com:

```sql
select u.email, a.role
from auth.users u
join public.admin_users a on a.user_id = u.id;
```

Deve ver a lista com o seu email e role=`admin`.

---

## 6. Testar

### Site público

Abra `index.html` no browser. As 3 notícias do seed devem aparecer no hero e na lista.

> Se vir uma consola a dizer *"supabase-config.js ainda não foi configurado — a usar dados mock"*, verifique se preencheu o `supabase-config.js` correctamente.

### Dashboard admin

1. Abra `admin/index.html`
2. Introduza o email e password que criou no passo 5
3. Deve entrar no dashboard e ver:
   - **Notícias** (3 do seed) — pode editar, criar e eliminar
   - **Categorias** (6 do seed) — pode adicionar, editar e eliminar
   - **Destaques** — lista das notícias que aparecem no hero

Crie uma nova notícia, marque-a como destaque, e volte ao site público: deve aparecer no hero imediatamente (após reload).

---

## 7. Funcionalidades do dashboard

- **Notícias**
  - Criar / editar / eliminar
  - Upload de imagem (drag & drop ou click) — guardada no Supabase Storage
  - Marcar como **destaque** (aparece no hero slider, máx. 5 visíveis)
  - Alternar entre **publicada** e **rascunho**
  - Agendar data de publicação (datetime-local)
  - Filtrar tabela por categoria e estado
  - Pesquisar por título

- **Categorias**
  - Criar / editar / eliminar
  - Slug gerado automaticamente a partir do nome
  - Emoji e cor personalizáveis
  - Atenção: eliminar categoria → notícias dessa categoria ficam sem categoria (não são apagadas)

- **Destaques**
  - Lista visual das notícias em destaque
  - Remover destaque com um click
  - Editor acessível directamente da linha

---

## 8. Troubleshooting

### "Esta conta não tem permissões de administrador"
Está autenticado mas o utilizador não está na tabela `admin_users`. Volte ao passo 5.2.

### "new row violates row-level security policy"
Está autenticado mas a sessão expirou ou o `user_id` do `admin_users` não corresponde ao da sessão. Faça logout e login novamente, e verifique o UUID com:
```sql
select id, email from auth.users where email = 'admin@podium.co.mz';
```

### "Failed to upload image"
O bucket `noticias-imagens` não existe. Execute o schema outra vez ou crie manualmente em **Storage** → **Create bucket** → nome `noticias-imagens` → **Public bucket**: ✅

### Site público continua a mostrar dados mock
Verifique a consola do browser. Se vir "supabase-config.js ainda não foi configurado", é porque os valores em `supabase-config.js` ainda têm `XXXX` ou `SUBSTITUIR`.

### CORS / erros de fetch
O Supabase permite origin `*` por defeito. Se vir erros CORS, verifique em **Settings → API** se as configurações estão normais, e se o site está a ser servido via HTTP(S) e não `file://` (em `file://` algumas browsers bloqueiam pedidos a CDN).

---

## 9. Deploy em produção

1. Carregar todos os ficheiros para o servidor web (ex: Netlify, Vercel, Render, VPS):
   ```
   /
   ├── index.html
   ├── styles.css
   ├── script.js
   ├── supabase-config.js     ← configurado com valores reais
   └── admin/
       ├── index.html
       ├── admin.css
       └── admin.js
   ```

2. (Opcional) Restringir acesso ao `/admin/` via regras de servidor (ex: basic auth HTTP) para camada extra de segurança — a autenticação Supabase é suficiente, mas esconder a URL reduz a superfície de ataque.

3. (Recomendado) Adicionar um domínio próprio no Supabase e configurar **Site URL** em **Authentication → URL Configuration** com `https://seu-dominio.com` para evitar warnings.

4. (Opcional) Configurar um **SMTP** personalizado em **Authentication → Email Templates** para que emails de reset/invite saiam com o seu domínio.

---

## 10. Próximos passos sugeridos

- **Scheduled publishing**: adicionar um cron job (Supabase Edge Functions) que muda `publicada = true` quando `data_publicacao <= now()`
- **Views com autenticação** (dashboard com estatísticas de leitura)
- **Comentários** (tabela `comentarios` com RLS baseado em `auth.uid()`)
- **Full-text search** em português usando `to_tsvector('portuguese', titulo || resumo)`
- **Revisões** (tabela `noticias_revisoes` para histórico de edições)
