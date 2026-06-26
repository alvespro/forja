import { LogOut } from 'lucide-react'
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

import { Sidebar } from './sidebar'
import { TabBar } from './tab-bar'

export function AppShell() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-8">
          <span className="truncate text-sm text-muted-foreground">{user?.email}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <TabBar />
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
