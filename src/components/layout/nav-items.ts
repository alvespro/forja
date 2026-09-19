import type { IconName } from '@/lib/icons'

export type NavItem = {
  to: string
  label: string
  /** Material Symbol (ver lib/icons.ts). */
  icon: IconName
  /** Sub-telas sem item próprio que acendem este destino (ex.: /sono dentro de Saúde). */
  ativoEm?: string[]
}

export type NavGroup = {
  titulo: string
  itens: NavItem[]
}

/** Os quatro destinos fixos da tab bar (o quinto botão é "Mais"). */
export const primaryNavItems: NavItem[] = [
  { to: '/', label: 'Hoje', icon: 'home' },
  { to: '/workout', label: 'Treino', icon: 'fitness_center', ativoEm: ['/mobilidade'] },
  { to: '/nutricao', label: 'Nutrição', icon: 'restaurant' },
  { to: '/health', label: 'Saúde', icon: 'monitor_heart', ativoEm: ['/sono'] },
]

/** Demais telas, agrupadas por contexto (folha "Mais" no mobile, seções na sidebar). */
export const secondaryNavGroups: NavGroup[] = [
  {
    titulo: 'Corpo',
    itens: [
      { to: '/body', label: 'Corpo', icon: 'accessibility_new' },
      { to: '/protocolo', label: 'Protocolo', icon: 'medication' },
      { to: '/suplementos', label: 'Suplementos', icon: 'medication_liquid' },
      { to: '/meals', label: 'Refeições', icon: 'lunch_dining' },
    ],
  },
  {
    titulo: 'Rotina',
    itens: [
      { to: '/agenda', label: 'Agenda', icon: 'calendar_today' },
      { to: '/tarefas', label: 'Tarefas', icon: 'checklist' },
      { to: '/habits', label: 'Hábitos', icon: 'task_alt' },
      { to: '/goals', label: 'Metas', icon: 'flag' },
      { to: '/focus', label: 'Foco', icon: 'center_focus_strong' },
      { to: '/journal', label: 'Diário', icon: 'edit_note' },
    ],
  },
  {
    titulo: 'Crescimento',
    itens: [
      { to: '/desenvolvimento', label: 'Desenvolvimento', icon: 'psychology' },
      { to: '/finances', label: 'Finanças', icon: 'account_balance_wallet' },
      { to: '/crm', label: 'CRM', icon: 'group' },
    ],
  },
  {
    titulo: 'Conta',
    itens: [{ to: '/configuracoes', label: 'Configurações', icon: 'settings' }],
  },
]

/** Todos os destinos, na ordem de exibição da sidebar. */
export const navItems: NavItem[] = [...primaryNavItems, ...secondaryNavGroups.flatMap((g) => g.itens)]

/** A rota atual pertence a um destino principal? (senão o "Mais" fica ativo na tab bar). */
export function isPrimaryPath(pathname: string): boolean {
  return primaryNavItems.some((item) => isItemActive(item, pathname))
}

/** O destino está ativo na rota atual (inclui as sub-telas listadas em `ativoEm`)? */
export function isItemActive(item: NavItem, pathname: string): boolean {
  const casa = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
  if (item.to === '/') return pathname === '/'
  return casa(item.to) || (item.ativoEm ?? []).some(casa)
}
