# FORJA — Instruções para o Claude Code

Ler `docs/SPEC.md` primeiro. Fonte da verdade.

## Regras
- Construir por FASES (SPEC §9), uma por vez. Parar no fim de cada fase, pedir revisão.
- Stack obrigatória: §2. Não trocar tecnologia sem avisar.
- Código: identificadores em inglês snake_case. Interface: pt-BR.
- Segurança: RLS em todas tabelas; nunca expor service role no frontend.
- Após cada fase: lint/build + commit git com mensagem clara.
- Mexeu no banco → migrations SQL versionadas.
