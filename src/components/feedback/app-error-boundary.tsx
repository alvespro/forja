import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Último nível de defesa: captura erros fora do router
 * (providers, chat, upload) para o app nunca virar tela branca.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app-error-boundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: 'var(--meia-noite, #0b1220)',
          color: 'var(--nevoa, #eae5d8)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <p style={{ fontSize: 40 }}>⚒️</p>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>O FORJA tropeçou.</p>
          <p style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
            O erro foi registrado no console. Recarregue para continuar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            border: 0,
            background: 'var(--brasa, #f0a93b)',
            color: '#0b1220',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Recarregar
        </button>
      </div>
    )
  }
}
