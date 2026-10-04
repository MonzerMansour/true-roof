import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const BUCKET = "site-photos"
// The portal shrinks photos to about 1600px JPEG before sending.
const MAX_DATA_URL_LENGTH = 4_000_000
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/

const NOT_READY =
  "The photo uploaded, but the database needs the listing_details migration before it can show. Ask the project owner to apply it."

type Params = { params: Promise<{ id: string }> }

/** The signed-in person, if they are active staff at the site's organization.
 * Uses their own session, so RLS decides what they can see. */
async function authorize(listingId: string) {
  const supabase = await createServerSupabaseClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (!supabase || !user) return { error: "Sign in first.", status: 401 } as const

  const { data: listing } = await supabase
    .from("listings")
    .select("id, organization_id")
    .eq("id", listingId)
    .maybeSingle()
  if (!listing) return { error: "Site not found.", status: 404 } as const

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", listing.organization_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()
  if (!membership) return { error: "Only this site's staff can change its photo.", status: 403 } as const

  return { supabase } as const
}

function revalidateSite(listingId: string) {
  revalidatePath(`/portal/sites/${listingId}/settings`)
  revalidatePath(`/places/${listingId}`)
  revalidatePath("/places")
  revalidatePath("/")
}

// Upload a new photo for the site. Replaces any earlier one.
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return NextResponse.json({ error: "Photo uploads are not set up on this server." }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as { image?: unknown } | null
  const image = typeof body?.image === "string" ? body.image : ""
  const match = image.length <= MAX_DATA_URL_LENGTH ? IMAGE_DATA_URL.exec(image) : null
  if (!match) {
    return NextResponse.json({ error: "That is not a photo we can use." }, { status: 400 })
  }

  const extension = match[1] === "jpeg" ? "jpg" : match[1]
  const path = `${id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(match[2], "base64"), {
      contentType: `image/${match[1]}`,
      upsert: false,
    })
  if (uploadError) {
    console.error("[site photo upload]", uploadError.message)
    return NextResponse.json({ error: "Could not upload the photo." }, { status: 502 })
  }

  const photoUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

  const { error } = await auth.supabase.from("listings").update({ photo_url: photoUrl }).eq("id", id)
  if (error) {
    await admin.storage.from(BUCKET).remove([path])
    const missing = error.message.includes("photo_url")
    return NextResponse.json({ error: missing ? NOT_READY : error.message }, { status: missing ? 409 : 500 })
  }

  // Old photos for this site are no longer shown anywhere.
  const { data: files } = await admin.storage.from(BUCKET).list(id)
  const stale = (files ?? []).map((f) => `${id}/${f.name}`).filter((p) => p !== path)
  if (stale.length) await admin.storage.from(BUCKET).remove(stale)

  revalidateSite(id)
  return NextResponse.json({ photoUrl })
}

// Remove the site's photo. The card goes back to a stock photo.
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { error } = await auth.supabase.from("listings").update({ photo_url: null }).eq("id", id)
  if (error) {
    const missing = error.message.includes("photo_url")
    return NextResponse.json({ error: missing ? NOT_READY : error.message }, { status: missing ? 409 : 500 })
  }

  const admin = createAdminSupabaseClient()
  const { data: files } = admin ? await admin.storage.from(BUCKET).list(id) : { data: null }
  if (admin && files?.length) await admin.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`))

  revalidateSite(id)
  return NextResponse.json({ photoUrl: null })
}
