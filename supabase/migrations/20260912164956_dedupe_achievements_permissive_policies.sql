-- Advisor 0006 multiple_permissive_policies: achievements had two identical
-- policies per action (achievements_*_own duplicated the own_* set). Keep the
-- consistent own_* set (which also covers delete/update) and drop the redundant
-- pair. Access is unchanged — the surviving policy is byte-identical.
drop policy if exists achievements_insert_own on public.achievements;
drop policy if exists achievements_select_own on public.achievements;
