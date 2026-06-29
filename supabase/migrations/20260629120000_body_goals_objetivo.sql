-- Fase: Metas personalizáveis por ciclo + análise de adequação da dieta.
-- body_metrics e body_goals já existiam (criadas fora do histórico local de migrations,
-- ver migrations 20260628131449/20260628222325 — agora reconciliadas). Este migration só
-- adiciona o que falta: objetivo do ciclo em body_goals e meta de músculo em percentual
-- (a coluna existente `massa_muscular_meta_kg` é em kg, não em %).

alter table body_goals
  add column if not exists objetivo text default 'recomposicao'
    check (objetivo in ('ganho_massa', 'recomposicao', 'perda_peso', 'definicao', 'performance')),
  add column if not exists musculo_pct_meta numeric;

create index if not exists body_goals_user_cycle_idx on body_goals (user_id, cycle_id);

-- Garante o Ciclo 01 — Recomposição (90 dias a partir de 29/06/2026) e a meta correspondente
-- para o usuário único do sistema, sem duplicar se já existirem (idempotente).
do $$
declare
  v_user_id uuid;
  v_cycle_id uuid;
begin
  select id into v_user_id from auth.users limit 1;
  if v_user_id is null then
    return;
  end if;

  select id into v_cycle_id from cycles
  where user_id = v_user_id and nome = 'Ciclo 01 — Recomposição'
  limit 1;

  if v_cycle_id is null then
    insert into cycles (user_id, nome, data_inicio, data_fim, ativo)
    values (v_user_id, 'Ciclo 01 — Recomposição', '2026-06-29', '2026-06-29'::date + 90, true)
    returning id into v_cycle_id;
  end if;

  if not exists (select 1 from body_goals where user_id = v_user_id and cycle_id = v_cycle_id) then
    insert into body_goals (
      user_id, cycle_id, objetivo,
      peso_meta_kg, gordura_meta_pct, musculo_pct_meta, gordura_visceral_meta
    ) values (
      v_user_id, v_cycle_id, 'recomposicao',
      75, 14, 60, 5
    );
  end if;

  if not exists (select 1 from body_metrics where user_id = v_user_id and medido_em = '2026-06-29') then
    insert into body_metrics (user_id, peso_kg, gordura_pct, musculo_pct, medido_em)
    values (v_user_id, 84.4, 22.1, 57.3, '2026-06-29');
  end if;
end $$;
