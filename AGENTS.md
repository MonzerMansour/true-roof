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

Column names live once in `lib/listings/columns.ts`. Adding a column is one edit there, not six select strings. Tiers are ordered widest first and the query falls through, so a database missing a migration still serves rows with those fields null.

Safe parking rows also carry what a lot is like to use: cost, screening, documents, facilities, security, max stay, waitlist, pets. Those are short published facts quoted from the operator, not enums, because flattening "free, it is temporary shelter not a rental" into an enum loses the thing that matters. The matcher never reads them.

## Places feed

`/places` is the seeker list (shelters and safe parking together). `/places/[id]` is the site page. Staff publish rows from `/portal`.

The matcher, as it actually is:

- `hard-filters.ts` removes a listing. The only thing that does. A null policy never excludes: it means the site has not published that rule, not that the answer is no.
- `categorical-score.ts` scores how far the structured fields agree. Display only; it does not reorder.
- `score-blend.ts` blends that with cosine similarity into the percentage people see. Text carries 65%, fields 35%.
- `rank.ts` calls the `match_listings` RPC for the embedding order, which is what actually sorts the feed.
- `phrase-similarity.ts` and `embed-limit.ts` support the text side.
- `household-split.ts` reuses `listingFitsNeeds` when a couple has no whole-household fit.

Do not build a second matcher. An earlier distance-plus-freshness ranker (`score.ts`, `vocabulary.ts`, `time.ts`) was dropped in favour of the embeddings one and no longer exists; this file described it for a while after it was deleted.

## Auth

Sign-in dialog: password, magic link, Google (`/auth/callback`). Session cookies refresh in `proxy.ts`. Profiles are created by `handle_new_user`. Google still needs the provider turned on in the Supabase dashboard.

## UI

Use shadcn components in `components/ui`. Add with `npx shadcn@latest add`. If a primitive does not exist, create one in that folder in the Nova/Base UI style. Tabler icons only. Theme tokens only.

## Now vs later

This phase includes marketing, sign-in, the seeker app (Dashboard, Places, Financials sidebar), and the staff portal. Do not invent extra matcher scoring. Letter parse, income cliffs, quiet mode, and Get Help are stub pages under `/financials/*`.
