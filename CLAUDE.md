# FORJA — Instruções para o Claude Code

Leia `docs/SPEC.md` antes de tudo. É a fonte da verdade.

## Regras
- Construa pelas FASES da Seção 9 do SPEC, uma de cada vez. Pare ao fim de cada fase e peça revisão.
- Stack obrigatória: Seção 2. Não troque de tecnologia sem avisar.
- Identificadores de código em inglês snake_case; toda a interface em português do Brasil.
- Segurança: RLS em todas as tabelas; nunca exponha a service role no frontend.
- Após cada fase: rode lint/build e faça um commit git com mensagem clara.
- Sempre que mexer no banco, gere migrations SQL versionadas.
