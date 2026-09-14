import {
  Brain,
  CheckSquare,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  ListChecks,
  type LucideIcon,
  NotebookPen,
  Pill,
  PersonStanding,
  Salad,
  Settings,
  Sun,
  Target,
  Timer,
  UtensilsCrossed,
  Wallet,
  Users,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export type NavGroup = {
  titulo: string
  itens: NavItem[]
}

/** Os quatro destinos fixos da tab bar (o quinto botão é "Mais"). */
export const primaryNavItems: NavItem[] = [
  { to: '/', label: 'Hoje', icon: Sun },
  { to: '/workout', label: 'Treino', icon: Dumbbell },
  { to: '/nutricao', label: 'Nutrição', icon: Salad },
  { to: '/health', label: 'Saúde', icon: HeartPulse },
]

/** Demais telas, agrupadas por contexto (folha "Mais" no mobile, seções na sidebar). */
export const secondaryNavGroups: NavGroup[] = [
  {
    titulo: 'Corpo',
    itens: [
      { to: '/body', label: 'Corpo', icon: PersonStanding },
      { to: '/protocolo', label: 'Protocolo', icon: FlaskConical },
      { to: '/suplementos', label: 'Suplementos', icon: Pill },
      { to: '/meals', label: 'Refeições', icon: UtensilsCrossed },
    ],
  },
  {
    titulo: 'Rotina',
    itens: [
      { to: '/tarefas', label: 'Tarefas', icon: CheckSquare },
      { to: '/habits', label: 'Hábitos', icon: ListChecks },
      { to: '/goals', label: 'Metas', icon: Target },
      { to: '/focus', label: 'Foco', icon: Timer },
      { to: '/journal', label: 'Diário', icon: NotebookPen },
    ],
  },
  {
    titulo: 'Crescimento',
    itens: [
      { to: '/desenvolvimento', label: 'Desenvolvimento', icon: Brain },
      { to: '/finances', label: 'Finanças', icon: Wallet },
      { to: '/crm', label: 'CRM', icon: Users },
    ],
  },
  {
    titulo: 'Conta',
    itens: [{ to: '/configuracoes', label: 'Importações', icon: Settings }],
  },
]

/** Todos os destinos, na ordem de exibição da sidebar. */
export const navItems: NavItem[] = [...primaryNavItems, ...secondaryNavGroups.flatMap((g) => g.itens)]

/** A rota atual pertence a um destino principal? (senão o "Mais" fica ativo na tab bar). */
export function isPrimaryPath(pathname: string): boolean {
  return primaryNavItems.some((item) =>
    item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`),
  )
}
