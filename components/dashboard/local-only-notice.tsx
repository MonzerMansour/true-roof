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
 */
export function LocalOnlyNotice({ className }: { className?: string }) {
  return (
    <p className={className}>
      Saved on this phone only. None of this is sent anywhere, and you do not
      need an account. Clearing your browser erases it, and you can delete it
      yourself any time in{" "}
      <Link href="/settings" className="font-medium underline">
        Settings
      </Link>
      .
    </p>
  )
}
