import { LogOut, Settings } from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'

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

      {/* min-w-0: sem isso a coluna flex cresce até a largura natural do conteúdo
          (ex.: fileiras com rolagem horizontal) e a página inteira estoura a tela. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-8">
          <span className="truncate text-sm text-muted-foreground">{user?.email}</span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/configuracoes">
                <Settings className="size-4" aria-hidden="true" />
                Importações
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </header>

        {/* Sem overflow aqui: quem rola é a janela. overflow-y-auto no <main> (que nunca
            rola) prendia todo position: sticky ao próprio main, e headers fixos não fixavam. */}
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
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
