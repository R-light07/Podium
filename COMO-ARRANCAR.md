# Como arrancar o Podium localmente

⚠️ **O dashboard NÃO funciona com duplo-clique** (`file://`).

Os browsers bloqueiam Supabase, autenticação e CDNs externos quando os ficheiros são abertos directamente. Tem de servir o projecto através de HTTP.

---

## Opção 1 — Python (Linux / macOS / Windows com Python)

Abrir um terminal **na pasta do projecto** (a pasta que contém `index.html`) e correr:

```bash
python3 -m http.server 8000
```

Se estiver em Windows e `python3` não funcionar, tente:

```bash
python -m http.server 8000
```

Depois abrir no browser:

- **Site público** → http://localhost:8000/
- **Dashboard** → http://localhost:8000/admin/

Para parar: `Ctrl + C` no terminal.

---

## Opção 2 — Node.js (qualquer SO)

```bash
npx serve
```

Vai mostrar um URL (geralmente http://localhost:3000). Abrir no browser e adicionar `/admin/` para o dashboard.

---

## Opção 3 — VS Code (mais simples)

1. Instalar a extensão **"Live Server"** (Ritwick Dey)
2. Clique direito em `index.html` → "Open with Live Server"
3. Para o dashboard, navegar para `http://127.0.0.1:5500/admin/`

---

## Opção 4 — Publicar online (recomendado para uso real)

### Netlify (grátis)

1. Criar conta em https://netlify.com
2. **Sites** → arrastar a pasta inteira do projecto para o Netlify
3. Aguardar ~30s — vai dar um URL tipo `magnificent-spaceship-12345.netlify.app`
4. O dashboard fica em `<URL>/admin/`

### Vercel (grátis)

1. Criar conta em https://vercel.com
2. Drag & drop da pasta no dashboard ou via `npx vercel` no terminal

---

## Verificar que está a funcionar

1. Abra a **consola do browser** (F12)
2. Recarregue a página
3. Se o Supabase **não** estiver configurado:
   - Site público mostra dados mock e na consola: *"supabase-config.js ainda não foi configurado — a usar dados mock"* ✅ (normal, é fallback)
   - Dashboard mostra mensagem vermelha clara com instruções
4. Se o Supabase **estiver** configurado mas o utilizador não for admin:
   - Login aceita as credenciais mas mostra "Esta conta não tem permissões de administrador"
5. Se tudo OK:
   - Site público mostra notícias reais do Supabase
   - Dashboard mostra a tabela de notícias

---

## Troubleshooting

### "Failed to fetch" / "NetworkError"
Provavelmente está em `file://`. Use uma das opções acima.

### Dashboard fica em "A verificar sessão..." para sempre
Está em `file://` ou o SDK do Supabase não carregou. Abra a consola (F12) e verá um erro descritivo.

### "Esta conta não tem permissões de administrador"
A conta foi criada mas não foi adicionada à tabela `admin_users`. Volte ao **passo 5.2** do `supabase/SETUP.md`.

### Página em branco no dashboard
Limpe o cache do browser (Ctrl+Shift+R) e tente em janela anónima.
