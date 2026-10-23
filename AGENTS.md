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
- `contradictions.ts` finds where the two sides say opposite things in their own words ("No pets" in a site description, "no curfew please" in a person's note). Together with the Additional info comparisons in `categorical-score.ts`, each contradiction halves the match percent (`conflictPenalty` in `score-blend.ts`). It never hides a listing.
- `household-split.ts` reuses `listingFitsNeeds` when a couple has no whole-household fit.

Do not build a second matcher. An earlier distance-plus-freshness ranker (`score.ts`, `vocabulary.ts`, `time.ts`) was dropped in favour of the embeddings one and no longer exists; this file described it for a while after it was deleted.

## Auth

Sign-in dialog: password, magic link, Google (`/auth/callback`). Session cookies refresh in `proxy.ts`. Profiles are created by `handle_new_user`. Google still needs the provider turned on in the Supabase dashboard.

## Gmail late alerts (Financials)

Plan A: opt-in emails when a signed-in person opens Financials/home and risk is Act or critically overdue. Uses Gmail SMTP via `nodemailer` (`lib/email/gmail.ts`, `POST /api/alerts/email`). **Not Supabase SMTP.** Setup and publish checklist: `docs/gmail-alerts-setup.md`. Env: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, optional `ALERT_EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` (localhost in `.env.local` for now; set the real public URL on the host when you publish).

## UI

Use shadcn components in `components/ui`. Add with `npx shadcn@latest add`. If a primitive does not exist, create one in that folder in the Nova/Base UI style. Tabler icons only. Theme tokens only.

## Now vs later

This phase includes marketing, sign-in, the seeker app (Dashboard, Places, Financials sidebar), and the staff portal. Do not invent extra matcher scoring. There are no stub pages left: every route the app serves does something.

One-tap help, quiet mode, the income cliff check and the `/financials/letters` stub were removed, along with their marketing feature pages and nav entries. Do not re-add them. Reading a letter still works: `/api/scan` and `/api/deadlines/read` are the live path, reached from Financials. Crisis, DV and 988 numbers survive as plain `tel:` links in the app footer and on `/financials`; they are not a feature and they send nothing.

Each site has its own access code, not each organization.
`supabase/migrations/20261017000100_listing_access_codes.sql` adds
`listing_access_codes` and `listing_members`: a trigger gives every site a code
the moment it exists, and anyone entering that code at `/portal/join` can view
and edit that one site and sees it on their dashboard. It is sharing, not a
handover, and there is no approval step, because one site is a far smaller
thing to grant than the run of a whole organization, which is what the old
approval guarded. Only the owning organization can rotate a code.

The code is chosen when the site is made: the create form fills in a generated
one and lets staff type their own, validated by `set_listing_access_code`
(6 to 16 characters, letters and numbers, unique) with the same checks mirrored
in `lib/portal/access-code.ts` for the form. A guessable code warns rather than
being refused.

There is no `/portal/access` page any more. A code belonged to an organization
when there was one code; now it belongs to a site, so it is shown in the
**Access tab** of that site's settings and on its preview page. Requests are not there either: open ones are summarised at the
top of the portal dashboard across every site, and listed in full on each
site's page.

Pressing a site on the dashboard opens `/portal/sites/[id]`, the site as a
seeker sees it, not the settings form. `PlaceDetail` takes a `preview` prop
that drops the seeker's half: the match score, the fit against their answers
and asking for a bed. Editing is a button from there.

The code table has RLS on and no policies on purpose. `public.listings` is
readable by anon for every published row, so a code column there would hand
every site's key to anybody who asked PostgREST for it; everything goes
through `security definer` RPCs instead. The organization access code, its
card, and `requestJoinOrganization` are gone. `organization_members` stays: it
is still how ownership and the director and manager roles work.

A site can be deleted, by a director of the organization that owns it and
nobody else. `supabase/migrations/20261018000000_delete_listing.sql` adds the
`delete_listing` RPC: `public.listings` has policies for select, insert and
update and never had one for delete, so until now a site added by mistake
could only be unpublished. Everything referencing a listing cascades, so one
delete also takes its requests, reviews, embedding, access code and anybody's
shared access; the dialog counts those from the real rows and says so. A
shared editor can never delete, whatever their role elsewhere:
`lib/portal/can-delete.ts` owns that rule and is tested.

How full a site is: staff publish the most people it can hold (`total_beds`) and
how many are there now (`current_people`, added by
`20261022000000_listing_current_people.sql`). Spots left is the difference,
worked out in `lib/listings/availability.ts`, never a third stored number. At 5
spots left or fewer a seeker sees "Almost full", at none "Full", and a site
that has not published both shows nothing, because null is not zero. Both are
required to create a site and to publish a draft, and may stay blank on a site
that is already published (an imported site is never forced to invent a count).
A lot's `parking_status` is kept in step by the quick update on the site page,
and the settings save refuses an "open" lot with no spots left. The count is
not in the embedding text, so changing it never re-embeds.

Only one site can be a draft at a time. The Site settings tab in the portal
sidebar exists only while there is a draft, and opens it directly; once it is
published the tab goes, and a site's settings are reached from the site itself
(Edit details). `addSiteToOrganization` and `createOrganizationWithSite` refuse
a second draft. Unpublishing a site is never blocked, since taking a closed site
off the list is the safer direction, so an organization can still end up with
two; the tab then opens the oldest.

Guest mode is gone. There is no `true-roof-guest` cookie and no "Continue as a guest": somebody signed out simply browses, and every page except the questionnaire works for them. Do not add a guest flag back to gate a page; gate on a real session or do not gate.

Signing out asks whether to keep or remove what is on the phone. `lib/privacy/local-data.ts` owns the list of keys, split into the ones the account also holds and the ones only the phone holds. A feature that writes a new `true-roof:*` key belongs in that list.

Voice typing is back, as an accessibility setting only, off by default. Turning it on in Settings puts a mic in the bottom right corner that types speech into whichever text box is focused (`components/voice/voice-typing-button.tsx`), and adds a quick off switch to the seeker and portal sidebars. Four text boxes also have a "Say it instead" button (`components/voice/voice-textarea.tsx`). `/api/voice` only returns the words; it never proposes questionnaire answers, so `lib/voice/answer-rules.ts` stays removed. Transcription uses `OPENAI_API_KEY` with `TRANSCRIBE_MODEL` (default `whisper-1`).
