-- Dia de descanso planejado: treino sai do denominador do score.
-- Sem isto o sistema pune recuperação (dia perfeito de recovery ≤ ~77%),
-- incentivo perverso para um programa de recomposição com protocolo ativo.
alter table daily_scores add column if not exists rest_day boolean not null default false;
