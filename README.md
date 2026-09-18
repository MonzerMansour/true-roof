# True Roof

Get a home. Stay housed.

Marketing site for people looking for shelter or safe parking (primary) and for the staff who run those sites (secondary).

## Stack

- Next.js App Router
- shadcn Nova (preset `b13sSJqA6M`, mauve / violet, Tabler icons)
- Supabase auth and listings

## Local setup

Copy `.env.example` to `.env.local` and add the project URL and anon key.

```bash
npm install
cp .env.example .env.local
npm run db:setup
npm run dev
```

`npm run db:setup` needs `npx supabase login` (already done here) or a paste of `supabase/seed.sql` in the SQL editor.

Google Sign-In: add a Web client in Google Cloud. Authorized redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`. Then enable Google under Auth > Providers in the Supabase dashboard. Local callbacks already include `http://localhost:3000/auth/callback`.

## Adding UI

```bash
npx shadcn@latest add [component]
```

Project rules for other agents live in `.cursor/rules/` and `AGENTS.md`.
