-- Favoritos de alimentos (Sub-passo 6 da integração Open Food Facts).
alter table foods add column if not exists favorito boolean not null default false;

-- Vincula a refeição registrada ao alimento do catálogo: sem isso não dá para
-- contar quantos ultraprocessados (NOVA 4) foram registrados no dia.
alter table meal_logs add column if not exists food_id uuid references foods on delete set null;
create index if not exists meal_logs_food_id_fkey_idx on meal_logs (food_id);

-- Busca textual em português no cache do OFF (modo "nome").
-- to_tsvector(regconfig, text) é immutable, então pode ser indexado.
create index if not exists off_foods_cache_nome_fts
  on off_foods_cache using gin (to_tsvector('portuguese', nome));
