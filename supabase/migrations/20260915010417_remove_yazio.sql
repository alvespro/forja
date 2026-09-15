-- Remoção do Yazio (15/09/2026): registro de alimentos passa a ser só nativo
-- (FoodSearch multi-banco: TACO + Open Food Facts + USDA + IA).
-- Parte disto foi aplicado direto no banco; aqui fica versionado e idempotente.

drop table if exists public.yazio_sync_logs;

alter table public.meal_logs drop constraint if exists meal_logs_yazio_sync_id_key;
alter table public.meal_logs drop column if exists yazio_sync_id;

-- meal_logs.fonte: 'foods_cache' (busca multi-banco), 'ia_estimado' (estimativa por IA), 'manual'.
update public.meal_logs set fonte = 'manual' where fonte is null or fonte not in ('manual', 'foods_cache', 'ia_estimado');
alter table public.meal_logs drop constraint if exists meal_logs_fonte_check;
alter table public.meal_logs add constraint meal_logs_fonte_check
  check (fonte in ('manual', 'foods_cache', 'ia_estimado'));

update public.foods set fonte = 'manual' where fonte = 'yazio';
alter table public.foods drop constraint if exists foods_fonte_check;
alter table public.foods add constraint foods_fonte_check
  check (fonte in ('manual', 'off', 'taco', 'usda', 'ia_estimado'));
alter table public.foods drop column if exists yazio_id;
