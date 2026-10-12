import nodemailer from "nodemailer"

export function isGmailConfigured() {
  return Boolean(
    process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()
  )
}

export function appBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export type LateAlertMail = {
  to: string
  reasons: string[]
}

export async function sendLateAlertEmail({ to, reasons }: LateAlertMail) {
  const user = process.env.GMAIL_USER?.trim()
  const pass = process.env.GMAIL_APP_PASSWORD?.trim()
  if (!user || !pass) {
    throw new Error("Gmail is not configured")
  }

  const from = process.env.ALERT_EMAIL_FROM?.trim() || user
  const dashboardUrl = `${appBaseUrl()}/financials`
  const reasonLines =
    reasons.length > 0
      ? reasons.slice(0, 4).map((r) => `• ${r}`).join("\n")
      : "• Something on your plan is overdue"

  const text = [
    "Something important on your Financials plan is running late.",
    "",
    reasonLines,
    "",
    `Open Financials: ${dashboardUrl}`,
    "",
    "This email does not include crisis numbers or a data handoff. Open the app for that.",
  ].join("\n")

  const reasonHtml = reasons
    .slice(0, 4)
    .map(
      (r) =>
        `<li style="margin:0 0 6px;color:#3f3f46">${escapeHtml(r)}</li>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fafafa;font-family:system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:28px 24px">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#7c3aed">True Roof</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#18181b">Something important is late</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#52525b">
                Rent or a bill on your plan is overdue. Open Financials to mark it handled or get help.
              </p>
              ${
                reasonHtml
                  ? `<ul style="margin:0 0 20px;padding-left:18px">${reasonHtml}</ul>`
                  : ""
              }
              <a href="${dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:999px">
                Open Financials
              </a>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.45;color:#a1a1aa">
                This email does not include crisis numbers or a data handoff. Open the app for that.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: `True Roof <${from}>`,
    to,
    subject: "Something important is late on True Roof",
    text,
    html,
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
