-- Perfis que já existiam antes do onboarding são considerados concluídos:
-- o wizard só deve aparecer para novos cadastros (default false na coluna).
update profiles set onboarding_completo = true where onboarding_completo = false;
