import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { RouteError } from '@/components/feedback/route-error'

const LoginPage = lazy(() => import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/signup-page').then((m) => ({ default: m.SignupPage })))
const TodayPage = lazy(() => import('@/pages/today-page').then((m) => ({ default: m.TodayPage })))
const GoalsPage = lazy(() => import('@/pages/goals-page').then((m) => ({ default: m.GoalsPage })))
const WorkoutPage = lazy(() => import('@/pages/workout-page').then((m) => ({ default: m.WorkoutPage })))
const HealthPage = lazy(() => import('@/pages/health-page').then((m) => ({ default: m.HealthPage })))
const HabitsPage = lazy(() => import('@/pages/habits-page').then((m) => ({ default: m.HabitsPage })))
const FocusPage = lazy(() => import('@/pages/focus-page').then((m) => ({ default: m.FocusPage })))
const JournalPage = lazy(() => import('@/pages/journal-page').then((m) => ({ default: m.JournalPage })))
const FinancesPage = lazy(() => import('@/pages/finances-page').then((m) => ({ default: m.FinancesPage })))
const BodyPage = lazy(() => import('@/pages/body-page').then((m) => ({ default: m.BodyPage })))
const MealsPage = lazy(() => import('@/pages/meals-page').then((m) => ({ default: m.MealsPage })))
const CrmPage = lazy(() => import('@/pages/crm-page').then((m) => ({ default: m.CrmPage })))
const NutricaoPage = lazy(() => import('@/pages/nutricao-page').then((m) => ({ default: m.NutricaoPage })))
const SupplementsPage = lazy(() => import('@/pages/supplements-page').then((m) => ({ default: m.SupplementsPage })))
const ConfiguracoesPage = lazy(() => import('@/pages/configuracoes-page').then((m) => ({ default: m.ConfiguracoesPage })))
const DesenvolvimentoPage = lazy(() => import('@/pages/desenvolvimento-page').then((m) => ({ default: m.DesenvolvimentoPage })))
const LivroDetalhePage = lazy(() => import('@/pages/livro-detalhe-page').then((m) => ({ default: m.LivroDetalhePage })))
const CursoDetalhePage = lazy(() => import('@/pages/curso-detalhe-page').then((m) => ({ default: m.CursoDetalhePage })))
const TarefasPage = lazy(() => import('@/pages/tarefas-page').then((m) => ({ default: m.TarefasPage })))
const ProtocoloPage = lazy(() => import('@/pages/protocolo-page').then((m) => ({ default: m.ProtocoloPage })))

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />), errorElement: <RouteError /> },
  { path: '/signup', element: withSuspense(<SignupPage />), errorElement: <RouteError /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: 'goals', element: <GoalsPage /> },
          { path: 'workout', element: <WorkoutPage /> },
          { path: 'health', element: <HealthPage /> },
          { path: 'tarefas', element: <TarefasPage /> },
          { path: 'protocolo', element: <ProtocoloPage /> },
          { path: 'habits', element: <HabitsPage /> },
          { path: 'library', element: <Navigate to="/desenvolvimento" replace /> },
          { path: 'desenvolvimento', element: <DesenvolvimentoPage /> },
          { path: 'biblioteca/livro/:id', element: <LivroDetalhePage /> },
          { path: 'desenvolvimento/curso/:id', element: <CursoDetalhePage /> },
          { path: 'focus', element: <FocusPage /> },
          { path: 'journal', element: <JournalPage /> },
          { path: 'finances', element: <FinancesPage /> },
          { path: 'body', element: <BodyPage /> },
          { path: 'meals', element: <MealsPage /> },
          { path: 'crm', element: <CrmPage /> },
          { path: 'nutricao', element: <NutricaoPage /> },
          { path: 'suplementos', element: <SupplementsPage /> },
          { path: 'configuracoes', element: <ConfiguracoesPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
