-- Check diário do "Suporte do ciclo" (protocol_support) no mesmo log dos suplementos.
-- Cada linha marca OU um suplemento comum OU um item de suporte do protocolo.
alter table public.supplement_logs
  alter column supplement_id drop not null,
  add column if not exists protocol_support_id uuid references public.protocol_support(id) on delete cascade;

alter table public.supplement_logs
  drop constraint if exists supplement_logs_um_alvo,
  add constraint supplement_logs_um_alvo check ((supplement_id is null) <> (protocol_support_id is null));

-- Um registro por item de suporte por dia (upsert do toggle).
alter table public.supplement_logs
  drop constraint if exists supplement_logs_protocol_support_id_data_key,
  add constraint supplement_logs_protocol_support_id_data_key unique (protocol_support_id, data);
