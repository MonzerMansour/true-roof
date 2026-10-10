import { redirect } from "next/navigation"

// Profile became Settings. Kept so old links and bookmarks still land.
export default function ProfilePage() {
  redirect("/portal/settings")
}
