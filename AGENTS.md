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

Canonical SQL is `supabase/migrations/`. Apply with `npm run db:setup` or `npx supabase db query --linked --project-ref`. Homepage cards and `/places` come from `public.listings` via `lib/listings/queries.ts`, with `lib/listings/seed.ts` as fallback. One row per physical site; enums only.

Real Santa Clara County data lives in `lib/listings/sources/`: shelters from the HUD 2025 Housing Inventory Count for CoC CA-500, safe parking from each city's own program page. Both the SQL and the seed array derive from those two files, so edit a source file and run `npm run inventory:sql`, never the generated migration. HUD publishes no pets, ID, couples, curfew, check-in or max-stay rules, so those columns are null on imported rows. Null means "not published", never "no". Do not guess a policy to fill a gap.

Column names live once in `lib/listings/columns.ts`. Adding a column is one edit there, not six select strings.

## Places feed

`/places` is the seeker list (shelters and safe parking together). `/places/[id]` is the site page. Staff publish rows from `/portal`.

The matcher is four files and no more: `hard-filters.ts` removes, `score.ts` orders by distance plus freshness, `vocabulary.ts` translates between the seeker and site vocabularies, `time.ts` does clock arithmetic. `rank.ts` still calls `match_listings` for an embedding order, which now breaks ties inside the score rather than being discarded. Do not build a second matcher.

## Auth

Sign-in dialog: password, magic link, Google (`/auth/callback`). Session cookies refresh in `proxy.ts`. Profiles are created by `handle_new_user`. Google still needs the provider turned on in the Supabase dashboard.

## UI

Use shadcn components in `components/ui`. Add with `npx shadcn@latest add`. If a primitive does not exist, create one in that folder in the Nova/Base UI style. Tabler icons only. Theme tokens only.

## Now vs later

This phase includes marketing, sign-in, the seeker app (Dashboard, Places, Financials sidebar), and the staff portal. Do not invent extra matcher scoring. Letter parse, income cliffs, quiet mode, and Get Help are stub pages under `/financials/*`.
