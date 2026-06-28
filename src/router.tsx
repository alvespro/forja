import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'

const LoginPage = lazy(() => import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/signup-page').then((m) => ({ default: m.SignupPage })))
const TodayPage = lazy(() => import('@/pages/today-page').then((m) => ({ default: m.TodayPage })))
const GoalsPage = lazy(() => import('@/pages/goals-page').then((m) => ({ default: m.GoalsPage })))
const WorkoutPage = lazy(() => import('@/pages/workout-page').then((m) => ({ default: m.WorkoutPage })))
const HealthPage = lazy(() => import('@/pages/health-page').then((m) => ({ default: m.HealthPage })))
const HabitsPage = lazy(() => import('@/pages/habits-page').then((m) => ({ default: m.HabitsPage })))
const LibraryPage = lazy(() => import('@/pages/library-page').then((m) => ({ default: m.LibraryPage })))
const FocusPage = lazy(() => import('@/pages/focus-page').then((m) => ({ default: m.FocusPage })))
const JournalPage = lazy(() => import('@/pages/journal-page').then((m) => ({ default: m.JournalPage })))
const FinancesPage = lazy(() => import('@/pages/finances-page').then((m) => ({ default: m.FinancesPage })))
const BodyPage = lazy(() => import('@/pages/body-page').then((m) => ({ default: m.BodyPage })))
const MealsPage = lazy(() => import('@/pages/meals-page').then((m) => ({ default: m.MealsPage })))
const CrmPage = lazy(() => import('@/pages/crm-page').then((m) => ({ default: m.CrmPage })))
const NutricaoPage = lazy(() => import('@/pages/nutricao-page').then((m) => ({ default: m.NutricaoPage })))
const SupplementsPage = lazy(() => import('@/pages/supplements-page').then((m) => ({ default: m.SupplementsPage })))

/** Páginas de auth ficam fora do AppShell, sem Suspense de layout — cada uma traz a própria. */
function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/signup', element: withSuspense(<SignupPage />) },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: 'goals', element: <GoalsPage /> },
          { path: 'workout', element: <WorkoutPage /> },
          { path: 'health', element: <HealthPage /> },
          { path: 'habits', element: <HabitsPage /> },
          { path: 'library', element: <LibraryPage /> },
          { path: 'focus', element: <FocusPage /> },
          { path: 'journal', element: <JournalPage /> },
          { path: 'finances', element: <FinancesPage /> },
          { path: 'body', element: <BodyPage /> },
          { path: 'meals', element: <MealsPage /> },
          { path: 'crm', element: <CrmPage /> },
          { path: 'nutricao', element: <NutricaoPage /> },
          { path: 'suplementos', element: <SupplementsPage /> },
        ],
      },
    ],
  },
])
