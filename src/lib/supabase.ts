import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  // O callback do Calendar pertence ao Google; um erro OAuth ali não deve
  // ser interpretado como falha de login do Supabase e apagar a sessão do app.
  auth: { detectSessionInUrl: typeof window === 'undefined' || window.location.pathname !== '/auth/google/callback' },
})
