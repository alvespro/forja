-- Cursos: formato do conteúdo (leitura, video-aula, capítulos/módulos, link, análise de área),
-- link de acesso e contagem de módulos. Colunas novas e opcionais: cursos existentes seguem iguais.
alter table public.courses
  add column if not exists formato text
    check (formato in ('leitura', 'video_aula', 'modulos', 'link', 'analise_area')),
  add column if not exists url text,
  add column if not exists modulos_total integer check (modulos_total >= 0),
  add column if not exists modulos_feitos integer check (modulos_feitos >= 0);

comment on column public.courses.formato is 'leitura | video_aula | modulos | link | analise_area';
comment on column public.courses.modulos_feitos is 'Capítulos/módulos concluídos (progresso = feitos / total).';
