-- Teardown do Apple Health (decisão de 04/07/2026): integração removida,
-- nenhuma tela lia estas tabelas. O schema de criação fica no git
-- (20260702110000) caso a integração volte um dia.
drop table if exists apple_health_imports;
drop table if exists sleep_logs;
drop table if exists activity_logs;
