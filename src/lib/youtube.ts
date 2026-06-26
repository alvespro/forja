// Seção 6.3 do SPEC: embed seguro de YouTube.
// Extrai e valida o ID a partir da URL; nunca renderiza HTML vindo do usuário.

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

const URL_PATTERNS = [
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /[?&]v=([A-Za-z0-9_-]{11})/,
  /\/embed\/([A-Za-z0-9_-]{11})/,
  /\/shorts\/([A-Za-z0-9_-]{11})/,
]

/** Extrai o ID de uma URL do YouTube (qualquer formato comum). Retorna null se não encontrar. */
export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (isValidYoutubeId(trimmed)) return trimmed

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function isValidYoutubeId(id: string): boolean {
  return VIDEO_ID_PATTERN.test(id)
}

export function youtubeNoCookieEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}
