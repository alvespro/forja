import { SpeedInsights } from '@vercel/speed-insights/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppErrorBoundary } from '@/components/feedback/app-error-boundary'
import { AuthProvider } from '@/components/auth/auth-provider'
import { DocumentUpload } from '@/components/DocumentUpload'
import { ForjaChat } from '@/components/ForjaChat'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <ForjaChat />
          <DocumentUpload />
        </AuthProvider>
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'var(--aco)',
              border: '1px solid var(--linha)',
              color: 'var(--nevoa)',
            },
          }}
        />
        <SpeedInsights />
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default App
