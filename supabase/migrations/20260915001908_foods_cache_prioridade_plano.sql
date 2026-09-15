-- Alimentos do plano alimentar do usuário aparecem primeiro na busca (TACO).
-- Tapioca simples, macarrão de arroz e whey não existem na TACO (só
-- "Tapioca, com manteiga") — chegam pelo Open Food Facts/IA na cascata.
update public.foods_cache
set prioridade = 10
where fonte = 'taco'
  and taco_id in (
    '3',    -- Arroz, tipo 1, cozido
    '561',  -- Feijão, carioca, cozido
    '410',  -- Frango, peito, sem pele, grelhado
    '488',  -- Ovo, de galinha, inteiro, cozido/10minutos
    '489',  -- Ovo, de galinha, inteiro, cru
    '88',   -- Batata, doce, cozida
    '7',    -- Aveia, flocos, crua
    '182',  -- Banana, prata, crua
    '100',  -- Brócolis, cozido
    '260'   -- Azeite, de oliva, extra virgem
  );
