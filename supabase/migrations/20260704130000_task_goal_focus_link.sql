-- Fecha o ciclo meta→tarefa→foco:
-- tasks.goal_id liga a tarefa à meta RPM (antes só coincidiam por string de área);
-- focus_sessions.task_id liga o pomodoro à tarefa real (antes era texto livre).
alter table tasks add column if not exists goal_id uuid references goals on delete set null;
alter table focus_sessions add column if not exists task_id uuid references tasks on delete set null;

create index if not exists tasks_goal on tasks (goal_id) where goal_id is not null;
