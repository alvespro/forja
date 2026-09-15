-- Desempate da busca: nome que começa pelo termo ("feijão…") vem antes de
-- nome que só contém o termo ("Baião de dois, arroz e feijão…").
create or replace function public.search_foods_cache(q text, p_fonte text default null, p_limit integer default 5)
returns setof public.foods_cache
language sql
stable
security invoker
set search_path = ''
as $$
  with termos as (
    select
      string_agg(t || ':*', ' & ') as tsq,
      (array_agg(t))[1] as primeiro
    from regexp_split_to_table(lower(public.f_unaccent(coalesce(q, ''))), '[^a-z0-9]+') as t
    where length(t) >= 2
  )
  select c.*
  from public.foods_cache c, termos
  where termos.tsq is not null
    and c.busca @@ to_tsquery('portuguese', termos.tsq)
    and (p_fonte is null or c.fonte = p_fonte)
  order by c.prioridade desc,
           (lower(public.f_unaccent(c.nome)) like termos.primeiro || '%') desc,
           ts_rank(c.busca, to_tsquery('portuguese', termos.tsq)) desc,
           length(c.nome) asc
  limit least(greatest(coalesce(p_limit, 5), 1), 50)
$$;

revoke execute on function public.search_foods_cache(text, text, integer) from anon;
