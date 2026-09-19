-- Complementa as tabelas já criadas; tokens nunca são legíveis no navegador.
create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  access_token text not null, refresh_token text, expires_at timestamptz, scope text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  google_event_id text, titulo text not null, descricao text, inicio timestamptz not null, fim timestamptz,
  dia_inteiro boolean default false, local text, categoria text default 'pessoal', cor text,
  recorrente boolean default false, google_calendar_id text default 'primary',
  sincronizado boolean default false, criado_no_forja boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id, google_event_id)
);
alter table public.crm_clients add column if not exists telefone text;
alter table public.crm_clients add column if not exists email text;
alter table public.crm_clients add column if not exists cpf text;
alter table public.crm_clients add column if not exists produto text;
alter table public.crm_clients add column if not exists status text default 'lead';
alter table public.crm_clients add column if not exists valor_financiamento numeric;
alter table public.crm_clients add column if not exists proximo_contato date;
alter table public.crm_clients add column if not exists notas text;
alter table public.crm_clients add column if not exists calendar_event_id uuid;
alter table public.google_oauth_tokens add column if not exists last_synced_at timestamptz;
alter table public.google_oauth_tokens add column if not exists sync_lock_until timestamptz;
alter table public.calendar_events add column if not exists deleted_at timestamptz;
alter table public.calendar_events add column if not exists google_html_link text;
alter table public.calendar_events add column if not exists protocol_exam_id uuid references public.protocol_exams(id) on delete set null;
create unique index if not exists calendar_protocol_exam_unique on public.calendar_events(user_id, protocol_exam_id);
create index if not exists calendar_user_inicio on public.calendar_events(user_id, inicio);
alter table public.google_oauth_tokens enable row level security;
revoke all on public.google_oauth_tokens from anon, authenticated;
grant all on public.google_oauth_tokens to service_role;
alter table public.calendar_events enable row level security;
alter table public.crm_clients enable row level security;
-- Eventos são modificados apenas pela função autenticada (fila de sincronização).
revoke all on public.calendar_events from anon, authenticated;
grant select on public.calendar_events to authenticated;
grant all on public.calendar_events to service_role;
drop policy if exists calendar_read_own on public.calendar_events;
create policy calendar_read_own on public.calendar_events for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.google_oauth_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state text not null,
  redirect_uri text not null,
  expires_at timestamptz not null
);
alter table public.google_oauth_states enable row level security;
revoke all on public.google_oauth_states from anon, authenticated;
grant all on public.google_oauth_states to service_role;

-- Uma sincronização por usuário. Escritas locais ficam pendentes para a próxima.
create or replace function public.claim_calendar_sync(p_user_id uuid) returns boolean
language sql security definer set search_path = public as $$
  with claimed as (
    update google_oauth_tokens set sync_lock_until = now() + interval '2 minutes'
    where user_id = p_user_id and (sync_lock_until is null or sync_lock_until < now()) returning user_id
  ) select exists(select 1 from claimed);
$$;
revoke all on function public.claim_calendar_sync(uuid) from public, anon, authenticated;
grant execute on function public.claim_calendar_sync(uuid) to service_role;
