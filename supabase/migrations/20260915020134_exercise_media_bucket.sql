-- GIFs do ExerciseDB: a API clássica só entrega a imagem com a chave RapidAPI,
-- então a Edge Function baixa uma vez e guarda aqui (compartilhado entre
-- usuários, leitura pública — são demonstrações de exercício, não dado pessoal).
-- Escrita só pela Edge Function (service role); nenhuma policy de insert.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-media', 'exercise-media', true, 5242880, array['image/gif', 'image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
