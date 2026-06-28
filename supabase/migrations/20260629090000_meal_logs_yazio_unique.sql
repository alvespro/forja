-- Necessário para upsert idempotente no sync-yazio (ON CONFLICT precisa de constraint única).
-- NULL não conflita com NULL em UNIQUE, então registros manuais (yazio_sync_id = null) não são afetados.
alter table meal_logs add constraint meal_logs_yazio_sync_id_key unique (yazio_sync_id);
