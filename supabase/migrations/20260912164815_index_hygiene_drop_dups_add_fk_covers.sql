-- Advisor 0009 duplicate_index: drop redundant copies, keep one identical index
-- per group (no FK loses coverage — the kept index has the same columns).
drop index if exists public.body_metrics_user_medido;
drop index if exists public.idx_body_metrics_user_data;
drop index if exists public.idx_cardio_sessions_date;
drop index if exists public.habit_logs_user_data;
drop index if exists public.health_metrics_user_chave;
drop index if exists public.idx_meal_logs_user_data;
drop index if exists public.idx_set_logs_exercise;
drop index if exists public.idx_workout_sessions_date;

-- Advisor 0001 unindexed_foreign_keys: add a covering index for each of the 40
-- FKs the linter flagged as uncovered. Columns are read from the catalog so the
-- index always matches the real FK definition.
do $$
declare
  fk   text;
  tbl  text;
  cols text;
  fknames text[] := array[
    'body_goals_cycle_id_fkey','courses_dev_area_id_fkey','dev_areas_user_id_fkey',
    'dev_media_dev_area_id_fkey','dev_media_user_id_fkey','dev_progress_skill_id_fkey',
    'dev_suggestions_dev_area_id_fkey','diet_plans_cycle_id_fkey','diet_plans_user_id_fkey',
    'document_imports_user_id_fkey','finance_goals_ciclo_id_fkey','focus_sessions_task_id_fkey',
    'food_substitutions_food_id_original_fkey','food_substitutions_food_id_substituto_fkey',
    'food_substitutions_user_id_fkey','foods_user_id_fkey','goals_cycle_id_fkey',
    'habits_user_id_fkey','key_results_goal_id_fkey','meal_logs_meal_slot_id_fkey',
    'meal_slots_diet_plan_id_fkey','meal_slots_user_id_fkey','meal_suggestions_meal_slot_id_fkey',
    'meal_suggestions_user_id_fkey','protocol_compounds_user_id_fkey','protocol_goals_protocol_id_fkey',
    'protocol_goals_user_id_fkey','protocol_logs_compound_id_fkey','protocol_support_user_id_fkey',
    'protocols_user_id_fkey','readings_dev_area_id_fkey','set_logs_exercise_id_fkey',
    'set_logs_session_id_fkey','skills_dev_area_id_fkey','skills_user_id_fkey',
    'supplements_user_id_fkey','workout_exercises_exercise_id_fkey','workout_exercises_workout_id_fkey',
    'workout_sessions_workout_id_fkey','xp_logs_user_id_fkey'
  ];
begin
  foreach fk in array fknames loop
    select c.conrelid::regclass::text,
           (select string_agg(quote_ident(a.attname), ', ' order by k.ord)
              from unnest(c.conkey) with ordinality k(attnum, ord)
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum)
      into tbl, cols
    from pg_constraint c
    where c.conname = fk and c.connamespace = 'public'::regnamespace and c.contype = 'f';

    if tbl is not null then
      execute format('create index if not exists %I on %s (%s)',
                     left(fk, 59) || '_idx', tbl, cols);
    end if;
  end loop;
end $$;
