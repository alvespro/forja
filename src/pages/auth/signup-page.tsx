import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

const signupSchema = z
  .object({
    nome: z.string().min(1, 'Informe seu nome'),
    email: z.string().min(1, 'Informe seu email').email('Email inválido'),
    password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type SignupForm = z.infer<typeof signupSchema>

export function SignupPage() {
  const { session, loading: sessionLoading } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  if (!sessionLoading && session) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: SignupForm) {
    setAuthError(null)
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { nome: values.nome } },
    })

    if (error) {
      setAuthError('Não foi possível criar a conta. Confira os dados e tente novamente.')
      return
    }

    // Sem confirmação de email habilitada, o cadastro já vem com sessão ativa.
    if (data.session) {
      navigate('/', { replace: true })
      return
    }

    setConfirmationSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">FORJA</h1>
        <p className="mt-1 text-sm text-aco-texto">Crie sua conta para começar.</p>

        {confirmationSent ? (
          <p className="mt-6 text-sm text-ok">
            Conta criada! Verifique seu email para confirmar o cadastro antes de entrar.
          </p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" autoComplete="name" aria-invalid={!!errors.nome} {...register('nome')} />
              {errors.nome && <p role="alert" className="text-xs text-alerta-texto">{errors.nome.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p role="alert" className="text-xs text-alerta-texto">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && <p role="alert" className="text-xs text-alerta-texto">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-alerta-texto">{errors.confirmPassword.message}</p>
              )}
            </div>

            {authError && <p role="alert" className="text-sm text-alerta-texto">{authError}</p>}

            <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? 'Criando conta…' : 'Criar conta'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-aco-texto">
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-brasa underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
