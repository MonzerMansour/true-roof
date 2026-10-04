import Link from "next/link"

/**
 * Says where the financial data actually lives.
 *
 * This replaced a sign-in wall whose copy claimed rent, bills and recerts were
 * "tied to your account". They are not. Everything in this flow is written to
 * localStorage by lib/obligations/storage.ts: there is no table for it, no API
 * route, and no network call anywhere in the flow. The wall asked people to
 * create an account to protect data the account never touched.
 *
 * The real tradeoff is worth stating plainly instead, because it cuts both
 * ways: nothing leaves the phone, and nothing survives clearing the browser.
 *
 * The one exception is the reader: tapping "Fill in for me" or "Read it"
 * sends that one sentence or photo to be read. Nothing is kept from it.
 */
export function LocalOnlyNotice({ className }: { className?: string }) {
  return (
    <p className={className}>
      Saved on this phone only, and you do not need an account. Nothing is sent
      anywhere unless you tap Fill in for me or Read it, which sends just that
      sentence or photo to be read and keeps nothing. Clearing your browser
      erases it, and you can delete it yourself any time in{" "}
      <Link href="/settings" className="font-medium underline">
        Settings
      </Link>
      .
    </p>
  )
}
