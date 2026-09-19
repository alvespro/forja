# FORJA

Sistema pessoal de alta performance para treino, saúde, nutrição, foco,
desenvolvimento, finanças e rotina. A interface é em pt-BR e o app é uma PWA.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v7 e
Supabase (Auth, Postgres, RLS, Storage e Edge Functions).

## Executar localmente

1. Instale o Node.js compatível com o projeto e rode `npm install`.
2. Crie `.env.local` com:

   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   VITE_YOUTUBE_API_KEY=...
   ```

3. Rode `npm run dev`.

## Validação

```bash
npm test
npm run lint
npm run build
```

## Segurança e backend

As migrations em `supabase/migrations` são a fonte de verdade do banco. As
Edge Functions agendadas exigem `CRON_SECRET` no ambiente remoto e o header
`x-cron-secret`; não devem ser expostas ao cliente.

Consulte [a especificação](docs/SPEC.md), [a arquitetura](docs/ARQUITETURA.md)
e [o plano de refatoração](docs/REFATORACAO.md) antes de mudanças estruturais.
