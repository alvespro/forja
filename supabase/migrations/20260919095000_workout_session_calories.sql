alter table public.workout_sessions
  add column if not exists calorias_estimadas integer check (calorias_estimadas is null or calorias_estimadas >= 0);
