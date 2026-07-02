-- Adiciona created_at em tasks para ordenação estável e histórico.
alter table tasks add column if not exists created_at timestamptz not null default now();
