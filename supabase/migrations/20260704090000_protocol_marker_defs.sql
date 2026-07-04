-- Defs para os marcadores registrados pelo módulo de protocolo.
-- Sem def, o valor é gravado em health_metrics mas fica invisível na página
-- Saúde (que só renderiza cards de health_metric_defs). Seed por usuário
-- existente; upsert simples evita duplicar quando a def já existe.

insert into health_metric_defs (user_id, chave, label, unidade, direcao, valor_meta)
select u.id, m.chave, m.label, m.unidade, m.direcao::text, m.valor_meta
from auth.users u
cross join (
  values
    ('hematocrito',        'Hematócrito',         '%',      'menor_melhor', 52),
    ('hemoglobina',        'Hemoglobina',         'g/dL',   'menor_melhor', 18),
    ('hdl',                'HDL',                 'mg/dL',  'maior_melhor', 40),
    ('tgo',                'TGO/AST',             'U/L',    'menor_melhor', 40),
    ('tgp',                'TGP/ALT',             'U/L',    'menor_melhor', 45),
    ('estradiol',          'Estradiol',           'pg/mL',  'menor_melhor', 60),
    ('testosterona_total', 'Testosterona Total',  'ng/dL',  'maior_melhor', null),
    ('psa',                'PSA',                 'ng/mL',  'menor_melhor', 4),
    ('creatinina',         'Creatinina',          'mg/dL',  'menor_melhor', 1.3),
    ('lh',                 'LH',                  'mUI/mL', 'maior_melhor', null),
    ('fsh',                'FSH',                 'mUI/mL', 'maior_melhor', null)
) as m(chave, label, unidade, direcao, valor_meta)
where not exists (
  select 1 from health_metric_defs d
  where d.user_id = u.id and d.chave = m.chave
);
