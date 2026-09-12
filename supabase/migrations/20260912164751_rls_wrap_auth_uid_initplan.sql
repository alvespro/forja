-- Advisor 0003 auth_rls_initplan (209 policies): wrap bare auth.uid() in a
-- scalar subselect so Postgres evaluates it once per query instead of per row.
-- ALTER POLICY preserves each policy's command and roles; we only rewrite the
-- USING / WITH CHECK expressions. Idempotent: skips already-wrapped policies.
do $$
declare
  r record;
  nq text;
  nw text;
  stmt text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null       and qual like '%auth.uid()%'       and qual not like '%(select auth.uid())%')
        or
        (with_check is not null  and with_check like '%auth.uid()%' and with_check not like '%(select auth.uid())%')
      )
  loop
    stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.qual is not null then
      nq := replace(r.qual, 'auth.uid()', '(select auth.uid())');
      stmt := stmt || format(' using (%s)', nq);
    end if;
    if r.with_check is not null then
      nw := replace(r.with_check, 'auth.uid()', '(select auth.uid())');
      stmt := stmt || format(' with check (%s)', nw);
    end if;
    execute stmt;
  end loop;
end $$;
