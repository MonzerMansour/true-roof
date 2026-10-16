# Vercel go-live (True Roof)

Production URL: **https://true-roof.vercel.app**

Vercel project: `dinogamer123311-gmailcoms-projects/true-roof` (linked to `MonzerMansour/true-roof`).

## Already done

- GitHub `main` is connected; production deploys from that branch.
- Env on Vercel (Production + Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL` = `https://true-roof.vercel.app`
- Repo `supabase/config.toml` and `scripts/run-sql.mjs` list the production Auth redirects for the next `db:setup`.

## You still need to do (Supabase Dashboard)

CLI login for the Cong App org is blocked from this agent session. Finish these in the browser while signed into the Supabase account that owns `zavccmmtielxqwauvydm`.

### 1. Auth URL configuration

Open: https://supabase.com/dashboard/project/zavccmmtielxqwauvydm/auth/url-configuration

**Site URL**
```text
https://true-roof.vercel.app
```

**Redirect URLs** (add; keep localhost)
```text
http://localhost:3000
http://localhost:3000/**
http://localhost:3000/auth/callback
http://127.0.0.1:3000
http://127.0.0.1:3000/**
http://127.0.0.1:3000/auth/callback
https://true-roof.vercel.app
https://true-roof.vercel.app/**
https://true-roof.vercel.app/auth/callback
```

### 2. Pending SQL (parking operations)

Open: https://supabase.com/dashboard/project/zavccmmtielxqwauvydm/sql/new

Paste and run the contents of:
`supabase/migrations/20261006000000_parking_operations.sql`

Until that runs, the app falls back to a narrower listings select and some policy fields stay unpublished.

### 3. Google Cloud (only if Google sign-in is enabled)

Authorized JavaScript origins, add:
```text
https://true-roof.vercel.app
```

Authorized redirect URI stays:
```text
https://zavccmmtielxqwauvydm.supabase.co/auth/v1/callback
```

## Optional env (Vercel → Settings → Environment Variables)

Add these for full features, then redeploy:

| Variable | Needed for |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Portal re-embed, embed rate limit |
| `OPENAI_API_KEY` | Matching, letter reader, voice |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Late Financials email alerts |
| `ALERT_EMAIL_FROM` | Optional From line |

```bash
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add OPENAI_API_KEY production
npx vercel env add GMAIL_USER production
npx vercel env add GMAIL_APP_PASSWORD production
npx vercel deploy --prod
```

## Smoke checklist

1. https://true-roof.vercel.app loads.
2. Sign in (password / magic link / Google).
3. `/places` lists sites; open a site detail.
4. `/financials` works; late-email opt-in only after Gmail env is set.
5. Magic link and Google return to `https://true-roof.vercel.app/auth/callback`, not localhost.
