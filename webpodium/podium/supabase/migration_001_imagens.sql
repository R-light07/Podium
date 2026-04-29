-- ============================================================
-- PODIUM — MIGRATION 001: melhorias relacionadas com imagens
-- ============================================================
-- Migração SEGURA e IDEMPOTENTE: pode ser corrida múltiplas vezes
-- sem perder dados ou criar duplicados.
--
-- COMO CORRER:
--   Supabase Dashboard → SQL Editor → New query → colar tudo → Run
--
-- O QUE FAZ:
--   1. Restringe o bucket 'noticias-imagens' a 5 MB e só imagens
--   2. Adiciona índice para queries que filtram por imagem
--   3. Cria função `limpar_imagens_orfas()` para manutenção
--   4. Garante que o campo imagem_url existe (caso esquema antigo)
--
-- O QUE NÃO FAZ:
--   - Não apaga dados existentes
--   - Não altera notícias ou categorias
--   - Não mexe em utilizadores ou permissões
-- ============================================================

-- ============================================================
-- 1. Garantir que `imagem_url` existe na tabela noticias
--    (defesa para esquemas muito antigos — não faz nada se já existir)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'noticias'
      and column_name = 'imagem_url'
  ) then
    alter table public.noticias add column imagem_url text;
    raise notice 'Coluna imagem_url adicionada à tabela noticias';
  else
    raise notice 'Coluna imagem_url já existe — sem alterações';
  end if;
end $$;

-- ============================================================
-- 2. Índice para queries que filtram por presença de imagem
-- ============================================================
create index if not exists idx_noticias_com_imagem
  on public.noticias (data_publicacao desc)
  where imagem_url is not null;

-- ============================================================
-- 3. Garantir que o bucket 'noticias-imagens' existe e
--    está configurado com limites de segurança
-- ============================================================
-- 3.1 Criar bucket se não existir
insert into storage.buckets (id, name, public)
values ('noticias-imagens', 'noticias-imagens', true)
on conflict (id) do nothing;

-- 3.2 Aplicar limites: 5 MB max + só tipos de imagem
update storage.buckets
set
  file_size_limit       = 5242880,                                              -- 5 MB em bytes
  allowed_mime_types    = array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
where id = 'noticias-imagens';

-- ============================================================
-- 4. Função utilitária: limpar imagens órfãs no Storage
--    (imagens que já não pertencem a nenhuma notícia)
-- ============================================================
-- ATENÇÃO: só executa se for chamada manualmente. Não corre automaticamente.
-- Útil para limpeza periódica via cron job ou via Supabase Edge Functions.
create or replace function public.limpar_imagens_orfas()
returns table (filename text, deleted boolean)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  obj record;
  is_used boolean;
begin
  -- Só admins podem correr esta função
  if not public.is_admin() then
    raise exception 'Apenas administradores podem limpar imagens órfãs';
  end if;

  -- Para cada ficheiro no bucket, verificar se está referenciado
  for obj in
    select name from storage.objects where bucket_id = 'noticias-imagens'
  loop
    -- Verificar se alguma notícia usa esta imagem
    select exists (
      select 1 from public.noticias
      where imagem_url like '%/' || obj.name
    ) into is_used;

    if not is_used then
      -- Apagar do Storage
      delete from storage.objects
      where bucket_id = 'noticias-imagens' and name = obj.name;

      filename := obj.name;
      deleted := true;
      return next;
    end if;
  end loop;

  return;
end;
$$;

revoke all on function public.limpar_imagens_orfas() from public;
grant execute on function public.limpar_imagens_orfas() to authenticated;

-- ============================================================
-- 5. (Opcional) Corrigir storage policies caso estejam em falta
--    — só insere se não existirem, sem alterar policies existentes
-- ============================================================
do $$
begin
  -- Leitura pública
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_noticias_public_read'
  ) then
    create policy "storage_noticias_public_read"
      on storage.objects for select
      using (bucket_id = 'noticias-imagens');
  end if;

  -- Upload só admins
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_noticias_admin_write'
  ) then
    create policy "storage_noticias_admin_write"
      on storage.objects for insert
      with check (bucket_id = 'noticias-imagens' and public.is_admin());
  end if;

  -- Update só admins
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_noticias_admin_update'
  ) then
    create policy "storage_noticias_admin_update"
      on storage.objects for update
      using (bucket_id = 'noticias-imagens' and public.is_admin());
  end if;

  -- Delete só admins
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_noticias_admin_delete'
  ) then
    create policy "storage_noticias_admin_delete"
      on storage.objects for delete
      using (bucket_id = 'noticias-imagens' and public.is_admin());
  end if;
end $$;

-- ============================================================
-- VERIFICAÇÃO — Correr este SELECT depois para confirmar
-- ============================================================
-- Esperado:
--   • imagem_url existe ✓
--   • bucket configurado com limites ✓
--   • função criada ✓
--
-- select
--   (select count(*) from information_schema.columns
--    where table_name='noticias' and column_name='imagem_url') as coluna_imagem_url_existe,
--   (select file_size_limit from storage.buckets where id='noticias-imagens') as limite_tamanho_bytes,
--   (select array_length(allowed_mime_types, 1) from storage.buckets
--    where id='noticias-imagens') as numero_tipos_aceites;

-- ============================================================
-- COMO USAR `limpar_imagens_orfas()`:
-- ============================================================
-- Sempre que substitui ou apaga uma imagem dum artigo, o ficheiro
-- antigo fica no Storage (a ocupar espaço). Esta função apaga-os.
--
-- Correr manualmente quando quiser limpar:
--
--   select * from public.limpar_imagens_orfas();
--
-- Devolve uma lista dos ficheiros removidos.
-- ============================================================
