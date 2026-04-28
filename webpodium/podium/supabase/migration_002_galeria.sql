-- ============================================================
-- PODIUM — MIGRATION 002: Galeria de imagens
-- ============================================================
-- Adiciona suporte para múltiplas imagens por notícia (galeria)
-- além da imagem de capa (imagem_url).
--
-- COMO CORRER:
--   Supabase Dashboard → SQL Editor → New query → colar tudo → Run
--
-- IDEMPOTENTE: pode correr múltiplas vezes sem problemas.
-- ============================================================

-- ============================================================
-- 1. Adicionar coluna `imagens_galeria` à tabela noticias
--    Tipo: text[] (array de URLs)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'noticias'
      and column_name = 'imagens_galeria'
  ) then
    alter table public.noticias
      add column imagens_galeria text[] default array[]::text[];
    raise notice 'Coluna imagens_galeria adicionada';
  else
    raise notice 'Coluna imagens_galeria já existe — sem alterações';
  end if;
end $$;

-- ============================================================
-- 2. Actualizar a view noticias_publicas para expor a galeria
-- ============================================================
create or replace view public.noticias_publicas as
select
  n.id,
  n.titulo,
  n.slug,
  n.resumo,
  n.conteudo,
  n.imagem_url,
  n.imagens_galeria,
  n.autor,
  n.destaque,
  n.data_publicacao,
  n.views,
  c.slug  as categoria_slug,
  c.nome  as categoria_nome,
  c.emoji as categoria_emoji,
  c.cor   as categoria_cor
from public.noticias n
left join public.categorias c on c.id = n.categoria_id
where n.publicada = true
order by n.data_publicacao desc;

grant select on public.noticias_publicas to anon, authenticated;

-- ============================================================
-- 3. Actualizar limpar_imagens_orfas() para considerar a galeria
--    (uma imagem está em uso se for capa OU se estiver na galeria)
-- ============================================================
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
  if not public.is_admin() then
    raise exception 'Apenas administradores podem limpar imagens órfãs';
  end if;

  for obj in
    select name from storage.objects where bucket_id = 'noticias-imagens'
  loop
    -- Verificar se a imagem está referenciada como capa OU na galeria
    select exists (
      select 1 from public.noticias
      where imagem_url like '%/' || obj.name
         or exists (
           select 1
           from unnest(coalesce(imagens_galeria, array[]::text[])) as g
           where g like '%/' || obj.name
         )
    ) into is_used;

    if not is_used then
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

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- Esperado: ver as 2 colunas (imagem_url e imagens_galeria)
select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'noticias'
  and column_name in ('imagem_url', 'imagens_galeria');
