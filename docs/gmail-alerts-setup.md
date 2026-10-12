# Gmail alerts setup (Plan A)

True Roof can email a signed-in person when they open Financials (or home) and their local plan is in **Act**, or something is critically overdue (3+ days). There is no cloud copy of their deadlines. If they never open the app, nothing is sent.

**Supabase is not involved.** Do not turn on Auth SMTP, SendGrid, or any email provider in the Supabase dashboard for this. Outbound late alerts go straight from the Next.js server through Gmail SMTP (`nodemailer` + App Password). Sign-in magic links still use whatever Supabase Auth already uses; that is separate.

## 1. Google App Password

1. Turn on 2-Step Verification for the Gmail account that will send mail.
2. Open [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create an app password named `True Roof`.
4. Copy the 16-character password (spaces optional).

Do not use your normal Gmail password. “Less secure apps” is not needed.

## 2. Env vars

Add to `.env.local` (never commit real values):

```bash
GMAIL_USER=emailing.services1@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
# Optional. Defaults to GMAIL_USER.
ALERT_EMAIL_FROM=emailing.services1@gmail.com
# Used for the Open Financials button in the email.
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart `npm run dev` after editing env.

Locally, `NEXT_PUBLIC_APP_URL=http://localhost:3000` is correct. The alert email button then opens the local Financials page.

## 3. Smoke test

1. Sign in with an account whose inbox you can open (the email goes **to the signed-in user**, not to `GMAIL_USER`).
2. Open Financials and turn on **Email me when something important is late**.
3. Make a deadline overdue (or set Act conditions) and reload Financials.
4. You should get one email with an **Open Financials** button.
5. Reloading the same day with the same overdue set should not send again.

## 4. When you publish (do this before go-live)

Hosting today is local Next.js (`npm run dev` / `npm run start` on the machine). Auth and data already use the Supabase project in `NEXT_PUBLIC_SUPABASE_URL`. Alert mail does not.

When you deploy to a public host (for example Vercel):

1. Set these **on the host** (Project Settings → Environment Variables), not only in `.env.local`:
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `ALERT_EMAIL_FROM` (optional)
   - `NEXT_PUBLIC_APP_URL` → the real public site URL, e.g. `https://your-app.vercel.app` or the custom domain
2. Redeploy so the server picks up the vars.
3. Confirm Supabase Auth redirect URLs still include the production callback (`https://<project-ref>.supabase.co/auth/v1/callback` stays the same; add your production site URL under Supabase Auth → URL configuration if you have not already).
4. Send one test late alert from a signed-in production account.

If `NEXT_PUBLIC_APP_URL` is left as localhost after publish, the email button will send people to the wrong place.

## Limits

- Opt-in defaults to off.
- Dedupes per day and overdue fingerprint in `localStorage`.
- Crisis numbers stay in the app, not in the email.
- Offline cron (email while the app is closed) needs a later sync of due dates only.
