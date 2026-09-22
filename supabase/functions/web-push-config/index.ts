const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

/** Expõe apenas a chave VAPID pública necessária para o navegador assinar o dispositivo. */
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  if (!publicKey) return new Response(JSON.stringify({ error: 'web_push_not_configured' }), { status: 503, headers })
  return new Response(JSON.stringify({ public_key: publicKey }), { headers })
})
