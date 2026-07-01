-- Módulo Desenvolvimento Pessoal
-- Tabelas já existem no remoto. Esta migration adiciona colunas faltantes e semeia dados.

-- ─── Colunas faltantes em dev_areas ──────────────────────────────────────────
alter table dev_areas
  add column if not exists ordem integer default 0;

-- ─── Colunas faltantes em skills ─────────────────────────────────────────────
alter table skills
  add column if not exists ordem integer default 0;

-- ─── Colunas faltantes em dev_media ──────────────────────────────────────────
alter table dev_media
  add column if not exists diretor_ou_host text,
  add column if not exists aplicacao_1     text,
  add column if not exists aplicacao_2     text,
  add column if not exists notas           text;

-- ─── Seed: 4 áreas + 5 skills cada ──────────────────────────────────────────
do $$
declare
  v_user_id  uuid;
  v_area_men uuid;
  v_area_int uuid;
  v_area_sft uuid;
  v_area_hrd uuid;
begin
  select id into v_user_id from auth.users limit 1;
  if v_user_id is null then return; end if;

  -- Upsert áreas (categoria = nome da área para compatibilidade com schema remoto)
  insert into dev_areas (user_id, nome, categoria, descricao, cor, nivel_atual, nivel_meta, ativo, ordem)
  values
    (v_user_id, 'Mentalidade',  'mentalidade',  'Crenças, comportamento, psicologia e autoconhecimento', '#F0A93B', 5.4, 8.0, true, 1),
    (v_user_id, 'Interpessoal', 'interpessoal', 'Habilidades de relacionamento, comunicação e liderança', '#5FA88C', 5.6, 8.0, true, 2),
    (v_user_id, 'Soft Skills',  'soft_skill',   'Habilidades transversais: gestão de tempo, foco, presença', '#8294B0', 7.0, 9.0, true, 3),
    (v_user_id, 'Hard Skills',  'hard_skill',   'Crédito, financeiro, imobiliário e tecnologia', '#CB6A4E', 7.2, 9.0, true, 4)
  on conflict do nothing;

  -- Atualizar metadados (se já existiam sem cor/ordem)
  update dev_areas set cor = '#F0A93B', nivel_atual = 5.4, nivel_meta = 8.0, ordem = 1
    where user_id = v_user_id and nome = 'Mentalidade';
  update dev_areas set cor = '#5FA88C', nivel_atual = 5.6, nivel_meta = 8.0, ordem = 2
    where user_id = v_user_id and nome = 'Interpessoal';
  update dev_areas set cor = '#8294B0', nivel_atual = 7.0, nivel_meta = 9.0, ordem = 3
    where user_id = v_user_id and nome = 'Soft Skills';
  update dev_areas set cor = '#CB6A4E', nivel_atual = 7.2, nivel_meta = 9.0, ordem = 4
    where user_id = v_user_id and nome = 'Hard Skills';

  select id into v_area_men from dev_areas where user_id = v_user_id and nome = 'Mentalidade' limit 1;
  select id into v_area_int from dev_areas where user_id = v_user_id and nome = 'Interpessoal' limit 1;
  select id into v_area_sft from dev_areas where user_id = v_user_id and nome = 'Soft Skills' limit 1;
  select id into v_area_hrd from dev_areas where user_id = v_user_id and nome = 'Hard Skills' limit 1;

  if v_area_men is null or v_area_int is null or v_area_sft is null or v_area_hrd is null then
    return;
  end if;

  -- Skills de Mentalidade (apenas se não houver nenhuma ainda)
  if not exists (select 1 from skills where user_id = v_user_id and dev_area_id = v_area_men) then
    insert into skills (user_id, dev_area_id, nome, nivel_atual, nivel_meta, ordem)
    values
      (v_user_id, v_area_men, 'Autoconhecimento', 5, 8, 1),
      (v_user_id, v_area_men, 'Regulação emocional', 4, 8, 2),
      (v_user_id, v_area_men, 'Mentalidade de crescimento', 6, 9, 3),
      (v_user_id, v_area_men, 'Resiliência', 6, 8, 4),
      (v_user_id, v_area_men, 'Identidade desacoplada de performance', 4, 8, 5);
  end if;

  if not exists (select 1 from skills where user_id = v_user_id and dev_area_id = v_area_int) then
    insert into skills (user_id, dev_area_id, nome, nivel_atual, nivel_meta, ordem)
    values
      (v_user_id, v_area_int, 'Escuta ativa', 5, 8, 1),
      (v_user_id, v_area_int, 'Comunicação assertiva', 6, 9, 2),
      (v_user_id, v_area_int, 'Liderança servidora', 5, 8, 3),
      (v_user_id, v_area_int, 'Gestão de conflitos', 5, 8, 4),
      (v_user_id, v_area_int, 'Vulnerabilidade genuína', 4, 8, 5);
  end if;

  if not exists (select 1 from skills where user_id = v_user_id and dev_area_id = v_area_sft) then
    insert into skills (user_id, dev_area_id, nome, nivel_atual, nivel_meta, ordem)
    values
      (v_user_id, v_area_sft, 'Gestão do tempo', 7, 9, 1),
      (v_user_id, v_area_sft, 'Foco profundo', 7, 9, 2),
      (v_user_id, v_area_sft, 'Planejamento estratégico', 7, 9, 3),
      (v_user_id, v_area_sft, 'Tomada de decisão', 7, 9, 4),
      (v_user_id, v_area_sft, 'Aprendizado contínuo', 7, 9, 5);
  end if;

  if not exists (select 1 from skills where user_id = v_user_id and dev_area_id = v_area_hrd) then
    insert into skills (user_id, dev_area_id, nome, nivel_atual, nivel_meta, ordem)
    values
      (v_user_id, v_area_hrd, 'Análise de crédito imobiliário', 8, 9, 1),
      (v_user_id, v_area_hrd, 'Gestão financeira', 7, 9, 2),
      (v_user_id, v_area_hrd, 'Marketing digital', 6, 8, 3),
      (v_user_id, v_area_hrd, 'Processos e automação', 7, 9, 4),
      (v_user_id, v_area_hrd, 'Tecnologia e IA', 7, 9, 5);
  end if;

end $$;
