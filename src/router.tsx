import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoginPage } from '@/pages/auth/login-page'
import { SignupPage } from '@/pages/auth/signup-page'
import { FocusPage } from '@/pages/focus-page'
import { GoalsPage } from '@/pages/goals-page'
import { HabitsPage } from '@/pages/habits-page'
import { HealthPage } from '@/pages/health-page'
import { JournalPage } from '@/pages/journal-page'
import { LibraryPage } from '@/pages/library-page'
import { TodayPage } from '@/pages/today-page'
import { WorkoutPage } from '@/pages/workout-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
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
        ],
      },
    ],
  },
])
