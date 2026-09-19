-- Gasto de treino vem somente de estimativa MET ou edição manual.
alter table public.workout_sessions
  add column if not exists fonte_calorias text check (fonte_calorias in ('manual', 'estimativa_met'));

-- A integração antiga de Apple Watch/Health não é mais usada pelo app. As
-- tabelas legadas permanecem preservadas no banco até uma exclusão explícita.
