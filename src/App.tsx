import { lazy, Suspense } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppErrorBoundary } from '@/components/feedback/app-error-boundary'
import { UpdateBanner } from '@/components/UpdateBanner'
import { AuthProvider } from '@/components/auth/auth-provider'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

// Chat e upload só existem logado: carregados sob demanda, fora do bundle da tela de login.
const ForjaChat = lazy(() => import('@/components/ForjaChat').then((m) => ({ default: m.ForjaChat })))
const DocumentUpload = lazy(() => import('@/components/DocumentUpload').then((m) => ({ default: m.DocumentUpload })))

function FloatingTools() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <Suspense fallback={null}>
      <ForjaChat />
      <DocumentUpload />
    </Suspense>
  )
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <FloatingTools />
          <UpdateBanner />
        </AuthProvider>
        {/* Toast do design system: topo central, até 3, some em 3s, arrasta para cima para
            fechar; borda esquerda colorida por tipo (estilos em design-system.css → .forja-toast). */}
        <Toaster
          theme="dark"
          position="top-center"
          closeButton
          visibleToasts={3}
          duration={3000}
          swipeDirections={['top']}
          offset="calc(env(safe-area-inset-top, 0px) + 12px)"
          mobileOffset="calc(env(safe-area-inset-top, 0px) + 12px)"
          style={{ zIndex: 9999 }}
          toastOptions={{ classNames: { toast: 'forja-toast' } }}
        />
        <SpeedInsights />
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default App
