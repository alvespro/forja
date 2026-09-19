// Seção 6.4 do SPEC: alerta sonoro ao zerar o cronômetro (Web Audio, sem assets externos).

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  audioContext = new Ctor()
  return audioContext
}

/**
 * Desbloqueia o áudio durante um gesto explícito do usuário. Em Safari/iOS e
 * alguns navegadores Android, criar/retomar o AudioContext só quando o tempo
 * acaba é bloqueado por não haver mais uma interação ativa.
 */
export function prepareAudio(): void {
  const ctx = getAudioContext()
  if (!ctx || ctx.state !== 'suspended') return
  void ctx.resume().catch(() => {
    // Se o navegador ainda bloquear, o cronômetro continua funcional sem som.
  })
}

type BeepOptions = { frequency?: number; volume?: number; duration?: number }

export function playBeep({ frequency = 880, volume = 0.3, duration = 0.35 }: BeepOptions = {}) {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Web Audio indisponível neste navegador; ignora silenciosamente.
  }
}

/** Alerta inequívoco de fim do descanso: duas notas curtas, tocadas uma única vez. */
export function playRestCompleteAlert() {
  playBeep({ frequency: 880, volume: 0.36, duration: 0.18 })
  window.setTimeout(() => playBeep({ frequency: 1175, volume: 0.36, duration: 0.32 }), 190)
}

export function vibrate(pattern: number[] = [200, 100, 200]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    // navigator.vibrate pode lançar em alguns navegadores/contextos; ignora silenciosamente.
  }
}

/** Beep suave da mobilidade: mais grave, baixo e curto que o de fim de pausa. */
export function playSoftBeep() {
  playBeep({ frequency: 523, volume: 0.12, duration: 0.25 })
}
