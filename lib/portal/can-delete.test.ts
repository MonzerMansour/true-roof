import { describe, expect, it } from "vitest"

import { canDeleteListing } from "@/lib/portal/can-delete"

describe("canDeleteListing", () => {
  it("lets a director of the owning organization delete it", () => {
    expect(canDeleteListing({ isDirector: true, isShared: false })).toBe(true)
  })

  it("refuses anyone who is not a director", () => {
    // A manager can edit the site. Removing it is not the same kind of act.
    expect(canDeleteListing({ isDirector: false, isShared: false })).toBe(false)
  })

  it("refuses a shared editor even when they are a director elsewhere", () => {
    // They were let in with this site's code to help keep it current. An
    // invitation to help is not ownership, and this is the case most likely
    // to be got wrong by reading isDirector alone.
    expect(canDeleteListing({ isDirector: true, isShared: true })).toBe(false)
    expect(canDeleteListing({ isDirector: false, isShared: true })).toBe(false)
  })
})
