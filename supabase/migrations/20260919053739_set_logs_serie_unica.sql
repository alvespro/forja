-- Séries duplicadas (retentativa de rede / toque duplo): mantém a primeira de cada
-- (sessão, exercício, série) e impede novas duplicatas.
delete from public.set_logs s
using public.set_logs o
where s.session_id = o.session_id
  and s.exercise_id = o.exercise_id
  and s.serie_num = o.serie_num
  and (o.created_at, o.id) < (s.created_at, s.id);

create unique index if not exists set_logs_sessao_exercicio_serie_uniq
  on public.set_logs (session_id, exercise_id, serie_num);
