-- Conversas com os agentes de IA persistidas: habilita follow-up multi-turn
-- e permite ao coach cobrar amanhã o que sugeriu hoje. Antes, cada pergunta
-- partia do zero e a resposta evaporava ao fechar o chat.
create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  agente text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_user_agente
  on ai_messages (user_id, agente, created_at desc);

alter table ai_messages enable row level security;

create policy "ai_messages_select_own" on ai_messages
  for select using (auth.uid() = user_id);
create policy "ai_messages_insert_own" on ai_messages
  for insert with check (auth.uid() = user_id);
