import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, type Location, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
  password: z.string().min(1, 'Informe sua senha'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { session, loading: sessionLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (!sessionLoading && session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  async function onSubmit(values: LoginForm) {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      setAuthError('Email ou senha incorretos.')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">FORJA</h1>
        <p className="mt-1 text-sm text-aco-texto">Entre na sua conta para continuar.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-alerta-texto">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-alerta-texto">{errors.password.message}</p>}
          </div>

          {authError && <p className="text-sm text-alerta-texto">{authError}</p>}

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-aco-texto">
          Ainda não tem conta?{' '}
          <Link to="/signup" className="font-semibold text-brasa underline underline-offset-2">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  )
}
