import { isValidYoutubeId, youtubeNoCookieEmbedUrl } from '@/lib/youtube'

type YoutubeEmbedProps = {
  videoId: string
  title: string
}

/** Seção 6.3: só renderiza se o ID for válido; iframe puro, sem dangerouslySetInnerHTML. */
export function YoutubeEmbed({ videoId, title }: YoutubeEmbedProps) {
  if (!isValidYoutubeId(videoId)) return null

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
      <iframe
        className="size-full"
        src={youtubeNoCookieEmbedUrl(videoId)}
        title={title}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
}
