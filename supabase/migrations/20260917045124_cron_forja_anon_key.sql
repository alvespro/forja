-- O segredo da anon key foi cadastrado no Vault como 'forja_anon_key' (não 'supabase_anon_key').
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
  select decrypted_secret into v_anon from vault.decrypted_secrets where name = 'forja_anon_key';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'cron_secret';

  if v_anon is null or v_segredo is null then
    raise warning 'invocar_funcao_agendada(%): faltam segredos no Vault (forja_anon_key / cron_secret)', nome;
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
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function private.invocar_funcao_agendada(text) from public, anon, authenticated;
