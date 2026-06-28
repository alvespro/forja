import { SpeedInsights } from '@vercel/speed-insights/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/components/auth/auth-provider'
import { ForjaChat } from '@/components/ForjaChat'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ForjaChat />
      </AuthProvider>
      <SpeedInsights />
    </QueryClientProvider>
  )
}

export default App
