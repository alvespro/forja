-- Unicidade de taco_id / usda_fdc_id / consulta sem predicado: o upsert via
-- PostgREST (on_conflict=coluna) não infere índice parcial. NULLs continuam
-- distintos, então linhas de outras fontes não colidem.
drop index if exists public.foods_cache_taco_id_key;
drop index if exists public.foods_cache_usda_fdc_id_key;
drop index if exists public.foods_cache_ia_consulta_key;
create unique index if not exists foods_cache_taco_id_key on public.foods_cache (taco_id);
create unique index if not exists foods_cache_usda_fdc_id_key on public.foods_cache (usda_fdc_id);
create unique index if not exists foods_cache_consulta_key on public.foods_cache (consulta);
