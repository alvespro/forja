// Mapa de ícones do FORJA (Material Symbols Outlined).
//
// O index.html baixa SÓ os ícones listados aqui (parâmetro `icon_names` do Google
// Fonts): a fonte variável completa tem vários MB, o subconjunto tem poucos KB.
// Ícone novo → adicionar aqui; o teste icons.test.ts aponta a URL a atualizar.

export const ICONS = {
  // Navegação
  hoje: 'home',
  treino: 'fitness_center',
  nutricao: 'restaurant',
  saude: 'monitor_heart',
  mais: 'grid_view',
  perfil: 'person',
  config: 'settings',
  sair: 'logout',
  corpo: 'accessibility_new',
  tarefas: 'checklist',
  habitos: 'task_alt',
  foco: 'center_focus_strong',
  diario: 'edit_note',
  financas: 'account_balance_wallet',
  crm: 'group',

  // Ações
  adicionar: 'add_circle',
  mais_simples: 'add',
  editar: 'edit',
  deletar: 'delete',
  salvar: 'save',
  buscar: 'search',
  filtrar: 'tune',
  camera: 'photo_camera',
  upload: 'upload',
  anexo: 'attach_file',
  sync: 'sync',
  fechar: 'close',
  voltar: 'arrow_back',
  avancar: 'arrow_forward',
  anterior: 'chevron_left',
  proximo: 'chevron_right',
  expandir: 'expand_more',
  play: 'play_arrow',
  pausa: 'pause',
  pular: 'skip_next',
  minimizar: 'close_fullscreen',
  sugestoes: 'auto_awesome',
  imprimir: 'print',

  // Treino
  peso: 'fitness_center',
  cronometro: 'timer',
  serie: 'repeat',
  pr: 'emoji_events',
  cardio: 'directions_run',
  mobilidade: 'self_improvement',
  musculos: 'accessibility_new',
  costas: 'rowing',
  pernas: 'directions_walk',
  bracos: 'sports_mma',
  triceps: 'front_hand',
  gluteo: 'airline_seat_recline_extra',
  antebraco: 'back_hand',
  ginastica: 'sports_gymnastics',

  // Saúde
  coracao: 'favorite',
  exame: 'biotech',
  composicao: 'scale',
  sono: 'bedtime',
  hidratacao: 'water_drop',
  protocolo: 'medication',
  alarme: 'alarm',
  notificacao: 'notifications',

  // Nutrição
  refeicao: 'lunch_dining',
  suplemento: 'medication_liquid',
  agua: 'local_drink',
  barcode: 'qr_code_scanner',

  // Desenvolvimento
  livro: 'menu_book',
  curso: 'school',
  habilidade: 'psychology',
  estrela: 'star',

  // Status
  check: 'check_circle',
  alerta: 'warning',
  info: 'info',
  fogo: 'local_fire_department',
  raio: 'bolt',
  meta: 'flag',
  ciclo: 'loop',
  seta_cima: 'trending_up',
  seta_baixo: 'trending_down',
  estavel: 'trending_flat',

  // Momentos do dia (ação principal)
  amanhecer: 'wb_twilight',
  dia: 'light_mode',
  noite: 'dark_mode',

  // Interface (substitutos dos ícones lucide)
  ok: 'check',
  carregando: 'progress_activity',
  reiniciar: 'restart_alt',
  relogio: 'schedule',
  subir: 'arrow_upward',
  descer: 'arrow_downward',
  menos: 'remove',
  caixa: 'inbox',
  ciencia: 'science',
  trabalho: 'work',
  video: 'videocam',
  expandir_tela: 'open_in_full',
  teclado: 'keyboard',
  cuidado: 'volunteer_activism',
  documento: 'description',
  link_externo: 'open_in_new',
  calendario: 'calendar_today',
  leitura_concluida: 'library_add_check',
  grafico: 'bar_chart',
  premio: 'workspace_premium',
  velocimetro: 'speed',
  ovo: 'egg',
  camadas: 'layers',
  esqueleto: 'skeleton',
  ampulheta: 'hourglass_empty',
  review: 'rate_review',
  injecao: 'vaccines',
} as const

export type IconKey = keyof typeof ICONS
export type IconName = (typeof ICONS)[IconKey]

/** Nomes únicos em ordem alfabética — o formato que o `icon_names` do Google Fonts exige. */
export function iconNamesParam(): string {
  return [...new Set(Object.values(ICONS))].sort().join(',')
}
