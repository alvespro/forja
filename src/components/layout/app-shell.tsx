import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'

import { Sidebar } from './sidebar'
import { TabBar } from './tab-bar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      {/* min-w-0: sem isso a coluna flex cresce até a largura natural do conteúdo
          (ex.: fileiras com rolagem horizontal) e a página inteira estoura a tela. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sem overflow aqui: quem rola é a janela. overflow-y-auto no <main> (que nunca
            rola) prendia todo position: sticky ao próprio main, e headers fixos não fixavam. */}
        <main className="flex-1 px-4 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+32px)] md:px-8 md:pb-8 md:pt-8">
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
