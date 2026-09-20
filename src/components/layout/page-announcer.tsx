import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES: Record<string, string> = {
  '/': 'Hoje', '/workout': 'Treino', '/nutricao': 'Nutrição', '/health': 'Saúde', '/agenda': 'Agenda', '/tarefas': 'Tarefas',
  '/habits': 'Hábitos', '/goals': 'Metas', '/focus': 'Foco', '/body': 'Corpo', '/meals': 'Refeições', '/desenvolvimento': 'Desenvolvimento',
  '/estudos': 'Estudos', '/finances': 'Finanças', '/crm': 'CRM', '/configuracoes': 'Configurações', '/protocolo': 'Protocolo', '/suplementos': 'Suplementos',
}

function pageTitle(pathname: string) {
  const match = Object.entries(TITLES).sort(([a], [b]) => b.length - a.length).find(([path]) => pathname === path || pathname.startsWith(`${path}/`))
  return match?.[1] ?? 'FORJA'
}

/** Anuncia cada troca de tela sem adicionar ruído visual para quem não usa leitor de tela. */
export function PageAnnouncer() {
  const { pathname } = useLocation()
  const [title, setTitle] = useState(() => pageTitle(pathname))
  useEffect(() => setTitle(pageTitle(pathname)), [pathname])
  return <p className="sr-only" aria-live="polite" aria-atomic="true">{title}</p>
}
