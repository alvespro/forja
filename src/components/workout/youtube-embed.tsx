import { isValidYoutubeId, youtubeNoCookieEmbedUrl } from '@/lib/youtube'

type YoutubeEmbedProps = {
  videoId: string
  title: string
}

/** Seção 6.3: só renderiza se o ID for válido; iframe puro via youtube-nocookie, nunca youtube.com. */
export function YoutubeEmbed({ videoId, title }: YoutubeEmbedProps) {
  if (!isValidYoutubeId(videoId)) return null

  return (
    <iframe
      src={youtubeNoCookieEmbedUrl(videoId)}
      title={title}
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      loading="lazy"
      className="block bg-black"
      style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, border: 0 }}
    />
  )
}
