<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# True Roof

True Roof is a Next.js app (App Router) with shadcn Nova. People looking for housing are the primary audience. Shelter and parking staff are secondary.

## What to read first

Project rules live in `.cursor/rules/`. They always apply for product, language, shadcn, accessibility, marketing, listings schema, and auth.

## Data

Canonical SQL is `supabase/migrations/20260918000000_listings.sql` (mirrored in `supabase/seed.sql`). Apply with `npm run db:setup` or the Supabase SQL editor. Homepage cards come from `public.listings` via `lib/listings/queries.ts`, with `lib/listings/seed.ts` as fallback. One row per physical site; enums only.

## Auth

Sign-in dialog: password, magic link, Google (`/auth/callback`). Session cookies refresh in `proxy.ts`. Profiles are created by `handle_new_user`. Google still needs the provider turned on in the Supabase dashboard.

## UI

Use shadcn components in `components/ui`. Add with `npx shadcn@latest add`. If a primitive does not exist, create one in that folder in the Nova/Base UI style. Tabler icons only. Theme tokens only.

## Now vs later

This phase is marketing pages and the sign-in dialog (Supabase). Do not implement matcher logic, document parsing, or the provider dashboard until asked.
