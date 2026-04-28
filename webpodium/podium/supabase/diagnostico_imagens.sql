-- ============================================================
-- PODIUM — DIAGNÓSTICO DE IMAGENS
-- ============================================================
-- Correr no Supabase SQL Editor para identificar porque as imagens
-- não estão a carregar no site público.
--
-- Cada query abaixo testa um aspecto diferente. Correr UMA DE CADA VEZ
-- e verificar o output.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TESTE 1: As notícias têm o campo imagem_url preenchido?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver os URLs das imagens. Se imagem_url for NULL ou vazio,
-- o problema é que ainda não foi feito upload via dashboard.
select
  id,
  titulo,
  imagem_url,
  case
    when imagem_url is null then '❌ SEM IMAGEM'
    when imagem_url = ''    then '❌ STRING VAZIA'
    when imagem_url not like 'https://%' then '⚠ URL INVÁLIDO'
    else '✓ OK'
  end as estado
from public.noticias
order by data_publicacao desc;


-- ────────────────────────────────────────────────────────────
-- TESTE 2: O bucket existe e está público?
-- ────────────────────────────────────────────────────────────
-- Esperado: 1 linha com public=true
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'noticias-imagens';


-- ────────────────────────────────────────────────────────────
-- TESTE 3: Há ficheiros realmente no bucket?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver os ficheiros uploaded pelo dashboard
select
  name,
  metadata->>'size' as tamanho_bytes,
  metadata->>'mimetype' as tipo,
  created_at
from storage.objects
where bucket_id = 'noticias-imagens'
order by created_at desc;


-- ────────────────────────────────────────────────────────────
-- TESTE 4: As policies de leitura pública estão activas?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver pelo menos a policy 'storage_noticias_public_read'
select
  policyname,
  cmd,
  qual::text as condicao
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like '%noticias%';


-- ────────────────────────────────────────────────────────────
-- TESTE 5: A view noticias_publicas devolve as imagens?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver os URLs no campo imagem_url
select
  id,
  titulo,
  imagem_url,
  categoria_slug
from public.noticias_publicas
limit 5;


-- ────────────────────────────────────────────────────────────
-- TESTE 6: O URL gerado tem o formato correcto?
-- ────────────────────────────────────────────────────────────
-- Um URL Supabase Storage válido tem este formato:
--   https://<projeto>.supabase.co/storage/v1/object/public/noticias-imagens/<ficheiro>
--
-- Se o URL na base de dados NÃO tiver "/storage/v1/object/public/",
-- foi guardado mal e precisa de ser regenerado.
select
  id,
  titulo,
  imagem_url,
  case
    when imagem_url is null then 'Sem imagem'
    when imagem_url like '%/storage/v1/object/public/noticias-imagens/%' then '✓ Formato correcto'
    else '❌ Formato inválido — URL não foi gerado pela API getPublicUrl()'
  end as diagnostico_url
from public.noticias
where imagem_url is not null;
