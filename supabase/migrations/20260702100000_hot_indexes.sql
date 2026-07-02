-- Índices para os predicados quentes do app.
-- Toda query passa por RLS (auth.uid() = user_id), então (user_id, coluna-de-
-- ordenação/filtro) é o formato que o planner realmente usa. `if not exists`
-- torna a migration idempotente caso o init já cubra algum.

create index if not exists habit_logs_user_data on habit_logs (user_id, data);
create index if not exists tasks_user_data on tasks (user_id, data desc);
create index if not exists workout_sessions_user_performed on workout_sessions (user_id, performed_at desc);
create index if not exists supplement_logs_user_data on supplement_logs (user_id, data desc);
create index if not exists meal_logs_user_data on meal_logs (user_id, data);
create index if not exists body_metrics_user_medido on body_metrics (user_id, medido_em);
create index if not exists finances_user_data on finances (user_id, data desc);
create index if not exists health_metrics_user_chave on health_metrics (user_id, chave, measured_at);
create index if not exists journal_entries_user_data on journal_entries (user_id, data, tipo);

-- Módulo de protocolo: listas sempre filtradas por protocol_id
create index if not exists protocol_compounds_protocol on protocol_compounds (protocol_id, ordem);
create index if not exists protocol_exams_protocol on protocol_exams (protocol_id, semana_alvo);
create index if not exists protocol_logs_protocol_data on protocol_logs (protocol_id, data_aplicacao desc);
create index if not exists protocol_support_protocol on protocol_support (protocol_id);

-- Card de lembretes: só as não lidas, mais recentes primeiro
create index if not exists notifications_user_unread
  on notifications (user_id, created_at desc)
  where lida = false;
