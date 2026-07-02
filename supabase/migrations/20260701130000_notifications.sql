-- Notificações in-app (lembretes de protocolo, exames, etc.)
-- Inserção feita pela edge function protocol-reminders (service role).

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null default 'protocolo',
  titulo text not null,
  corpo text,
  link text,
  dedupe_key text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

-- Evita lembretes duplicados (mesma chave lógica por usuário)
create unique index if not exists notifications_user_dedupe
  on notifications (user_id, dedupe_key);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id);

-- O INSERT fica restrito ao service role (edge function agendada);
-- nenhuma policy de insert para authenticated é criada de propósito.
