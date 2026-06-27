import {
  BookOpen,
  Dumbbell,
  HeartPulse,
  ListChecks,
  type LucideIcon,
  NotebookPen,
  PersonStanding,
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

// Seção 4 do SPEC — mapa de telas (sidebar no desktop, tab bar no mobile)
export const navItems: NavItem[] = [
  { to: '/', label: 'Hoje', icon: Sun },
  { to: '/goals', label: 'Metas', icon: Target },
  { to: '/workout', label: 'Treino', icon: Dumbbell },
  { to: '/health', label: 'Saúde', icon: HeartPulse },
  { to: '/body', label: 'Corpo', icon: PersonStanding },
  { to: '/meals', label: 'Refeições', icon: UtensilsCrossed },
  { to: '/habits', label: 'Hábitos', icon: ListChecks },
  { to: '/library', label: 'Biblioteca', icon: BookOpen },
  { to: '/focus', label: 'Foco', icon: Timer },
  { to: '/journal', label: 'Diário & Revisão', icon: NotebookPen },
  { to: '/finances', label: 'Finanças', icon: Wallet },
  { to: '/crm', label: 'CRM', icon: Users },
]
