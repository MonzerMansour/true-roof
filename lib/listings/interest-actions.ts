"use server"

import { revalidatePath } from "next/cache"

import {
  getMyInterest,
  getMyInterests,
  upsertInterest,
  withdrawInterest,
} from "@/lib/listings/interest"
import type { InterestKind } from "@/lib/listings/types"

export async function loadMyInterest(listingId: string) {
  return getMyInterest(listingId)
}

export async function loadMyInterests() {
  return getMyInterests()
}

export async function submitInterest(listingId: string, kind: InterestKind) {
  const result = await upsertInterest(listingId, kind)
  if (result.ok) {
    revalidatePath(`/places/${listingId}`)
    revalidatePath("/places")
    revalidatePath("/home")
    revalidatePath("/settings")
  }
  return result
}

export async function cancelInterest(listingId: string, kind: InterestKind) {
  const result = await withdrawInterest(listingId, kind)
  if (result.ok) {
    revalidatePath(`/places/${listingId}`)
    revalidatePath("/places")
    revalidatePath("/home")
    revalidatePath("/settings")
  }
  return result
}
