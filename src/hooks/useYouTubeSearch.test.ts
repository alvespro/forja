import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { decodificarEntidades, lerResultadosYoutube, motivoErroYoutube, precisaBuscarVideo } from './useYouTubeSearch'

describe('YouTube Data API v3', () => {
  it('lê search.list: nocookie, thumbnail high → default, descarta item sem videoId', () => {
    const videos = lerResultadosYoutube({
      items: [
        {
          id: { videoId: 'abcdefghijk' },
          snippet: {
            title: 'Supino Reto: forma &quot;perfeita&quot; &amp; dicas',
            description: 'Como fazer',
            channelTitle: 'Canal &#39;Força&#39;',
            thumbnails: { default: { url: 'https://i.ytimg.com/d.jpg' } },
          },
        },
        { id: { kind: 'youtube#channel' }, snippet: { title: 'Canal' } },
        { id: { videoId: 'curto' }, snippet: {} },
      ],
    })
    expect(videos).toEqual([
      {
        id: 'abcdefghijk',
        titulo: 'Supino Reto: forma "perfeita" & dicas',
        descricao: 'Como fazer',
        thumbnail: 'https://i.ytimg.com/d.jpg',
        canal: "Canal 'Força'",
        embedUrl: 'https://www.youtube-nocookie.com/embed/abcdefghijk',
      },
    ])
    expect(lerResultadosYoutube({})).toEqual([])
  })

  it('entidades HTML viram texto', () => {
    expect(decodificarEntidades('a &lt;b&gt; &amp;amp;')).toBe('a <b> &amp;')
  })

  it('erros legíveis: cota, API desativada, chave', () => {
    const erro = (reason: string) => ({ error: { errors: [{ reason }] } })
    expect(motivoErroYoutube(403, erro('quotaExceeded'))).toMatch(/Cota/)
    expect(motivoErroYoutube(403, erro('accessNotConfigured'))).toMatch(/não está ativada/)
    expect(motivoErroYoutube(400, erro('keyInvalid'))).toMatch(/inválida/)
    expect(motivoErroYoutube(500, null)).toMatch(/indisponível/)
  })

  it('cache no banco: não busca com vídeo próprio ou ID salvo', () => {
    expect(precisaBuscarVideo({ video_url: null, youtube_video_id: null })).toBe(true)
    expect(precisaBuscarVideo({ video_url: null, youtube_video_id: 'abcdefghijk' })).toBe(false)
    expect(precisaBuscarVideo({ video_url: 'https://cdn/x.mp4', youtube_video_id: null })).toBe(false)
  })
})
