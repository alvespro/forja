# Agenda e CRM Prime

## Configuração

- Ative a Google Calendar API no projeto Google Cloud e use um cliente OAuth do tipo Web.
- Cadastre os redirects exatos: `http://localhost:5173/auth/google/callback` e
  `https://forja-chi.vercel.app/auth/google/callback`.
- Secrets da função: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Opcional no frontend: `VITE_GOOGLE_CLIENT_ID`. Sem ele, a função fornece o Client ID público.
- Para outro domínio, configure `GOOGLE_REDIRECT_ORIGINS` (origens separadas por vírgula)
  e cadastre o redirect correspondente também no Google Cloud.
- Em modo de teste do consentimento Google, inclua a conta nos usuários de teste.

Entre no FORJA e abra Configurações → Google Calendar → Conectar. O consentimento
usa apenas o escopo de eventos. OAuth state é vinculado à conta autenticada,
consumido uma vez e expira em dez minutos. Tokens não são retornados ao navegador,
inclusive na ação `refresh_token`, que apenas confirma a renovação.

## Comportamento

- Agenda em São Paulo: mês, semana e dia; eventos de dia inteiro usam fim exclusivo.
- A criação aparece no cache local imediatamente. A função salva o registro e tenta
  enviar ao Google. Falha externa mantém a alteração pendente para nova sincronização.
- Sync Google importa de sete dias atrás até sessenta dias à frente, com paginação.
  Eventos conhecidos movidos ou excluídos são conferidos individualmente.
- Alterações locais pendentes são enviadas primeiro; elas prevalecem sobre mudanças
  concorrentes no Google. Uma sincronização por usuário é permitida de cada vez.
- Exclusões usam tombstones internos para não ressuscitar um evento enquanto o Google
  estiver indisponível. O evento deixa de aparecer na UI imediatamente.
- Reuniões do modal de cliente ficam vinculadas por `calendar_event_id`. O CRM mantém
  os campos legados de fase/valor/data alinhados com o novo funil.
- Exames: ao agendar uma data no Protocolo, selecione “Adicionar ao Google Calendar?”.
  O formulário permite confirmar horário e descrição antes de compartilhar com Google.
- Arraste de clientes funciona no desktop; o seletor de status atende toque e teclado.
  Eventos são movidos pelo formulário de edição. Não há drag no calendário.
- O sync é manual e após gravações; não há webhook ou atualização instantânea vinda do Google.

## Publicação e validação

Migration: `supabase/migrations/20260919022352_calendar_sync.sql`.
A função valida a sessão com `auth.getUser()` em cada requisição antes de usar service
role; o deploy desativa apenas a validação JWT legada do gateway para aceitar as chaves
publishable modernas. Não remover a validação interna.

Testes: `npm test`, `npm run lint`, `npm run build`. A suíte verifica intervalos,
categorias, dias inteiros, isolamento por usuário e state OAuth. O teste completo de
criar/editar/excluir nos dois sentidos exige consentimento de uma conta Google real.

Referências: [OAuth Google](https://developers.google.com/identity/protocols/oauth2/web-server)
e [listagem de eventos](https://developers.google.com/calendar/api/v3/reference/events/list).
