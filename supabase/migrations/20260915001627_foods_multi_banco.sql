-- Multi-banco de alimentos (14/09/2026): TACO → Open Food Facts → USDA → IA.
-- `off_foods_cache` foi renomeada para `foods_cache` direto no banco e as
-- colunas de fonte foram criadas sem migration; este arquivo versiona tudo de
-- forma idempotente, liga a busca sem acento e fecha a escrita do cache
-- (só a Edge Function search-food grava, com service role).

do $$
begin
  if to_regclass('public.off_foods_cache') is not null and to_regclass('public.foods_cache') is null then
    alter table public.off_foods_cache rename to foods_cache;
  end if;
end $$;

create table if not exists public.foods_cache (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  nome text not null,
  marca text,
  pais text default 'br',
  calorias_100g numeric,
  proteina_100g numeric,
  carbo_100g numeric,
  gordura_100g numeric,
  fibra_100g numeric,
  sodio_100g numeric,              -- gramas (padrão do OFF)
  acucar_100g numeric,
  gordura_saturada_100g numeric,
  nutriscore text,
  nova_group integer,
  imagem_url text,
  off_data jsonb,
  cached_at timestamptz default now()
);

alter table public.foods_cache
  add column if not exists fonte text default 'off',
  add column if not exists taco_id text,
  add column if not exists usda_fdc_id text,
  add column if not exists confianca text default 'alta',
  add column if not exists categoria text,
  -- Alimentos do plano do usuário sobem para o topo da busca.
  add column if not exists prioridade integer not null default 0,
  -- Estimativas de IA são reaproveitadas pelo termo buscado (normalizado).
  add column if not exists consulta text;

alter table public.foods_cache drop constraint if exists off_foods_cache_fonte_check;
alter table public.foods_cache drop constraint if exists foods_cache_fonte_check;
alter table public.foods_cache add constraint foods_cache_fonte_check
  check (fonte in ('taco', 'tbca', 'off', 'usda', 'ia_estimado'));
alter table public.foods_cache drop constraint if exists off_foods_cache_confianca_check;
alter table public.foods_cache drop constraint if exists foods_cache_confianca_check;
alter table public.foods_cache add constraint foods_cache_confianca_check
  check (confianca in ('alta', 'media', 'baixa', 'estimada'));

-- Busca sem acento: "feijao" encontra "Feijão".
create extension if not exists unaccent with schema extensions;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

alter table public.foods_cache
  add column if not exists busca tsvector
  generated always as (to_tsvector('portuguese', public.f_unaccent(nome))) stored;

-- Índices: remove os duplicados herdados do nome antigo.
drop index if exists public.idx_off_cache_barcode;       -- duplicava a unique de barcode
drop index if exists public.idx_off_cache_nome;          -- duplicava off_foods_cache_nome_fts
drop index if exists public.off_foods_cache_nome_fts;    -- substituído pelo índice em `busca`
drop index if exists public.idx_foods_cache_taco;
create index if not exists foods_cache_busca_idx on public.foods_cache using gin (busca);
create index if not exists idx_foods_cache_fonte on public.foods_cache (fonte);
create unique index if not exists foods_cache_taco_id_key on public.foods_cache (taco_id) where taco_id is not null;
create unique index if not exists foods_cache_usda_fdc_id_key on public.foods_cache (usda_fdc_id) where usda_fdc_id is not null;
create unique index if not exists foods_cache_ia_consulta_key on public.foods_cache (consulta) where fonte = 'ia_estimado';

-- Busca por prefixo ("frango gre" já acha "grelhado"), prioridade do plano primeiro.
create or replace function public.search_foods_cache(q text, p_fonte text default null, p_limit integer default 5)
returns setof public.foods_cache
language sql
stable
security invoker
set search_path = ''
as $$
  with termos as (
    select string_agg(t || ':*', ' & ') as tsq
    from regexp_split_to_table(lower(public.f_unaccent(coalesce(q, ''))), '[^a-z0-9]+') as t
    where length(t) >= 2
  )
  select c.*
  from public.foods_cache c, termos
  where termos.tsq is not null
    and c.busca @@ to_tsquery('portuguese', termos.tsq)
    and (p_fonte is null or c.fonte = p_fonte)
  order by c.prioridade desc,
           ts_rank(c.busca, to_tsquery('portuguese', termos.tsq)) desc,
           length(c.nome) asc
  limit least(greatest(coalesce(p_limit, 5), 1), 50)
$$;

revoke execute on function public.search_foods_cache(text, text, integer) from anon;

-- RLS: cache compartilhado é só leitura para usuários logados.
alter table public.foods_cache enable row level security;
drop policy if exists authenticated_insert on public.foods_cache;
drop policy if exists authenticated_update on public.foods_cache;
drop policy if exists authenticated_read on public.foods_cache;
create policy authenticated_read on public.foods_cache
  for select using ((select auth.role()) = 'authenticated');

-- `foods`: aceita as fontes da busca (antes só yazio/manual — o registro
-- vindo do Open Food Facts falhava no check) e guarda a referência externa.
alter table public.foods drop constraint if exists foods_fonte_check;
alter table public.foods add constraint foods_fonte_check
  check (fonte in ('yazio', 'manual', 'off', 'taco', 'usda', 'ia_estimado'));
alter table public.foods add column if not exists ref_externa text;   -- 'taco:3', 'usda:168917', 'off:789…', 'ia:<termo>'
create index if not exists foods_user_ref_externa_idx on public.foods (user_id, ref_externa);
