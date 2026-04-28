-- ============================================================
-- PODIUM — DIAGNÓSTICO DE GALERIA
-- ============================================================
-- Correr no Supabase SQL Editor para identificar porque as
-- imagens da galeria não aparecem na página da notícia.
--
-- Correr cada bloco SEPARADAMENTE.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TESTE 1: A coluna imagens_galeria existe na tabela noticias?
-- ────────────────────────────────────────────────────────────
-- Se devolver 0 linhas → migration_002_galeria.sql NÃO foi corrida.
-- Solução: executar esse ficheiro SQL.
select
  column_name,
  data_type,
  column_default,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'noticias'
  and column_name = 'imagens_galeria';


-- ────────────────────────────────────────────────────────────
-- TESTE 2: As notícias têm imagens na galeria?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver array com URLs nas notícias onde adicionou imagens.
-- Se imagens_galeria for sempre {} ou NULL, o dashboard não está
-- a guardar (ver TESTE 5).
select
  id,
  titulo,
  array_length(imagens_galeria, 1) as numero_imagens,
  imagens_galeria
from public.noticias
order by data_publicacao desc
limit 10;


-- ────────────────────────────────────────────────────────────
-- TESTE 3: A view noticias_publicas EXPÕE a coluna imagens_galeria?
-- ────────────────────────────────────────────────────────────
-- Se devolver 0 linhas → a view está desactualizada.
-- Solução: correr a migration_002_galeria.sql novamente, ou correr
-- só este bloco para recriar a view:
--
-- create or replace view public.noticias_publicas as
-- select n.id, n.titulo, n.slug, n.resumo, n.conteudo,
--        n.imagem_url, n.imagens_galeria, n.autor, n.destaque,
--        n.data_publicacao, n.views,
--        c.slug as categoria_slug, c.nome as categoria_nome,
--        c.emoji as categoria_emoji, c.cor as categoria_cor
-- from public.noticias n
-- left join public.categorias c on c.id = n.categoria_id
-- where n.publicada = true
-- order by n.data_publicacao desc;
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'noticias_publicas'
  and column_name = 'imagens_galeria';


-- ────────────────────────────────────────────────────────────
-- TESTE 4: A view devolve dados da galeria nesta notícia?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver as imagens da galeria nas notícias onde adicionou.
select
  id,
  titulo,
  slug,
  imagem_url,
  imagens_galeria,
  array_length(imagens_galeria, 1) as numero_imagens_galeria
from public.noticias_publicas
limit 10;


-- ────────────────────────────────────────────────────────────
-- TESTE 5: Os ficheiros foram realmente carregados para o Storage?
-- ────────────────────────────────────────────────────────────
-- Esperado: ver os ficheiros uploaded recentemente.
select
  name,
  created_at,
  metadata->>'size' as tamanho_bytes
from storage.objects
where bucket_id = 'noticias-imagens'
order by created_at desc
limit 20;


-- ────────────────────────────────────────────────────────────
-- TESTE 6 (se 1 e 2 estiverem OK mas 3 ou 4 falharem):
-- Recriar a view forçadamente
-- ────────────────────────────────────────────────────────────
-- Descomente e corra este bloco para corrigir:
--
-- drop view if exists public.noticias_publicas;
-- create view public.noticias_publicas as
-- select
--   n.id, n.titulo, n.slug, n.resumo, n.conteudo,
--   n.imagem_url, n.imagens_galeria,
--   n.autor, n.destaque, n.data_publicacao, n.views,
--   c.slug as categoria_slug, c.nome as categoria_nome,
--   c.emoji as categoria_emoji, c.cor as categoria_cor
-- from public.noticias n
-- left join public.categorias c on c.id = n.categoria_id
-- where n.publicada = true
-- order by n.data_publicacao desc;
--
-- grant select on public.noticias_publicas to anon, authenticated;
