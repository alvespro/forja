// Feedback háptico. O Safari do iOS não implementa navigator.vibrate —
// por isso tudo aqui é best-effort e nunca lança.

const PATTERNS = {
  /** Toque leve: check de hábito, série concluída. */
  light: 10,
  /** Duplo: PR batido, nível subindo. */
  double: [30, 10, 30],
  /** Forte: cronômetro de pausa zerou. */
  strong: 200,
  /** Suave: fim de um exercício de mobilidade (menor que o fim de pausa). */
  soft: 60,
} as const

export type HapticKind = keyof typeof PATTERNS

export function haptic(kind: HapticKind = 'light'): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(PATTERNS[kind] as number | number[])
    }
  } catch {
    // sem suporte ou bloqueado pelo navegador: ignora
  }
}
