export type ForjaAgente =
  | 'treino'
  | 'biblioteca'
  | 'coach'
  | 'nutricao'
  | 'metas'
  | 'desenvolvimento'
  | 'protocolo'
  | 'estudos'
  | 'agenda'

export const MAX_AI_QUESTION = 6000

export const FORJA_AGENTES = [
  { value: 'coach', label: 'Coach', description: 'Organize o dia com uma prioridade possível.', context: 'Hábitos, diário, saúde e tarefas', area: 'mental', prompts: ['Qual deve ser minha prioridade hoje?', 'Ajude-me a retomar a rotina com uma ação de 15 minutos.'] },
  { value: 'treino', label: 'Treino', description: 'Entenda a evolução e prepare a próxima sessão.', context: 'Séries, cargas e sessões recentes', area: 'fisico', prompts: ['O que evoluiu nos meus últimos treinos?', 'Quais dados faltam para avaliar minha progressão?'] },
  { value: 'nutricao', label: 'Nutrição', description: 'Transforme os registros em escolhas práticas.', context: 'Refeições, composição e dieta ativa', area: 'fisico', prompts: ['Analise minhas refeições registradas e sugira uma melhoria.', 'Sugira uma refeição prática compatível com minha dieta.'] },
  { value: 'biblioteca', label: 'Biblioteca', description: 'Escolha o que ler e aplique o que aprendeu.', context: 'Leituras e metas ativas', area: 'mental', prompts: ['O que devo ler a seguir considerando minhas metas?', 'Como aplicar uma ideia da minha última leitura nesta semana?'] },
  { value: 'metas', label: 'Metas', description: 'Compare seus registros com os objetivos físicos.', context: 'Composição, dieta e treinos', area: 'fisico', prompts: ['Minha rotina registrada está alinhada ao objetivo atual?', 'Quais dados preciso registrar para acompanhar minha meta?'] },
  { value: 'desenvolvimento', label: 'Desenvolvimento', description: 'Converta aprendizado em habilidade praticável.', context: 'Habilidades, áreas, leituras, cursos e metas', area: 'mental', prompts: ['Qual habilidade devo praticar nesta semana?', 'Proponha um exercício de 15 minutos para minha principal lacuna.'] },
  { value: 'protocolo', label: 'Protocolo', description: 'Organize o acompanhamento e dúvidas para seu médico.', context: 'Exames, bem-estar e composição', area: 'fisico', prompts: ['Quais exames registrados estão pendentes?', 'Prepare perguntas para minha próxima consulta com base nos registros.'] },
  { value: 'estudos', label: 'Estudos', description: 'Revise e transforme conteúdo em retenção.', context: 'Flashcards, anotações e livros', area: 'mental', prompts: ['O que devo revisar hoje?', 'Como transformar este aprendizado em uma prática?'] },
] satisfies { value: ForjaAgente; label: string; description: string; context: string; area: string; prompts: string[] }[]
