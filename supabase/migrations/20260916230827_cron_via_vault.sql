-- Crons das Edge Functions agendadas, com credenciais lidas do Vault na hora da execução.
--
-- Antes: protocol-reminders era chamado sem cabeçalho nenhum e levava 401 todo dia
-- (verify_jwt no gateway + CRON_SECRET na função); daily-briefing e weekly-suggestions
-- não tinham cron. Agora os três passam por private.invocar_funcao_agendada(), que manda
--   Authorization: Bearer <anon key>   (passa o verify_jwt do gateway)
--   x-cron-secret: <CRON_SECRET>       (passa o guard da função)
-- Os valores NÃO ficam neste arquivo: vêm dos segredos do Vault 'supabase_anon_key' e
-- 'cron_secret'. Enquanto algum faltar, a função só registra um aviso e não chama nada.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.invocar_funcao_agendada(nome text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anon text;
  v_segredo text;
begin
  select decrypted_secret into v_anon from vault.decrypted_secrets where name = 'supabase_anon_key';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'cron_secret';

  if v_anon is null or v_segredo is null then
    raise warning 'invocar_funcao_agendada(%): faltam segredos no Vault (supabase_anon_key / cron_secret)', nome;
    return null;
  end if;

  return net.http_post(
    url := 'https://devwqshyiatvhwrudfpa.supabase.co/functions/v1/' || nome,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon,
      'x-cron-secret', v_segredo
    ),
    body := '{}'::jsonb,
    -- As funções chamam o Claude e levam segundos; 1 s cortava a resposta.
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function private.invocar_funcao_agendada(text) from public, anon, authenticated;

-- Recria os jobs de forma idempotente.
do $$
begin
  perform cron.unschedule(jobname) from cron.job
  where jobname in ('protocol-reminders-diario', 'daily-briefing-5am', 'weekly-suggestions-segunda');
end;
$$;

-- 08h BRT (11h UTC), todo dia.
select cron.schedule('protocol-reminders-diario', '0 11 * * *', $$select private.invocar_funcao_agendada('protocol-reminders')$$);
-- Mentor 5AM: 05h BRT (08h UTC), todo dia.
select cron.schedule('daily-briefing-5am', '0 8 * * *', $$select private.invocar_funcao_agendada('daily-briefing')$$);
-- Segunda-feira 08h BRT (11h UTC).
select cron.schedule('weekly-suggestions-segunda', '0 11 * * 1', $$select private.invocar_funcao_agendada('weekly-suggestions')$$);
