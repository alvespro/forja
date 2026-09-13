import { Navigate, Outlet } from 'react-router-dom'

import { useProfile } from '@/hooks/use-profile'

/**
 * Redireciona para /onboarding quando o perfil ainda não concluiu o onboarding.
 * Fail-open: enquanto carrega, ou se a leitura falhar/não existir, deixa passar —
 * nunca prende o usuário fora do app por causa deste gate.
 */
export function OnboardingGate() {
  const profile = useProfile()

  if (profile.isLoading) return <Outlet />
  if (profile.data && profile.data.onboarding_completo === false) {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}
