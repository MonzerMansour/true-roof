import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { features } from "@/lib/features"
import {
  stepsForTour,
  tours,
  type TourAudience,
  type TourId,
} from "@/lib/tours/steps"

const roles: TourId[] = ["seeker", "provider", "features"]

describe("every step is well formed", () => {
  it("has a unique id, an internal path, and plain copy", () => {
    for (const role of roles) {
      const ids = new Set<string>()

      for (const step of tours[role].steps) {
        expect(ids.has(step.id), `${role}/${step.id} is duplicated`).toBe(false)
        ids.add(step.id)

        expect(step.path.startsWith("/"), step.id).toBe(true)
        expect(step.title.length).toBeGreaterThan(0)
        expect(step.body.length).toBeGreaterThan(0)
      }
    }
  })

  it("never uses an em dash, per no-em-dashes.mdc", () => {
    for (const role of roles) {
      for (const step of tours[role].steps) {
        for (const text of [step.title, step.body, step.action ?? ""]) {
          expect(text, `${role}/${step.id}`).not.toMatch(/[—–]/)
        }
      }
    }
  })

  it("does not name a feature that was removed", () => {
    // The tour is the one place in the app that describes every page in
    // order, so it is the easiest place for a removed feature to survive as
    // copy that promises something that is not there.
    const gone = /quiet mode|income cliff|hurt me|get help/i

    for (const role of roles) {
      for (const step of tours[role].steps) {
        const text = `${step.title} ${step.body} ${step.action ?? ""}`
        expect(text, `${role}/${step.id}`).not.toMatch(gone)
      }
    }
  })
})

describe("the seeker tour needs no account", () => {
  it("gives a signed-out person a walkable tour with the account step swapped out", () => {
    const signedOut = stepsForTour("seeker", { signedIn: false })
    const ids = signedOut.map((step) => step.id)

    expect(signedOut.length).toBeGreaterThan(1)
    // The questionnaire is account-only, so somebody signed out must not be
    // sent to a page that would only redirect them back.
    expect(ids).not.toContain("match")
    // In its place, one step saying what signing in would add.
    expect(ids).toContain("signed-out")
  })

  it("swaps the other way once they are signed in", () => {
    const ids = stepsForTour("seeker", { signedIn: true }).map((s) => s.id)

    expect(ids).toContain("match")
    expect(ids).not.toContain("signed-out")
  })

  it("never offers the same explanation twice", () => {
    for (const signedIn of [true, false]) {
      const ids = stepsForTour("seeker", { signedIn }).map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe("the provider tour only offers pages the person can open", () => {
  it("hides staff access from someone who is not a director", () => {
    const staff = stepsForTour("provider", {
      signedIn: true,
      isDirector: false,
      hasOrganization: true,
      primaryListingId: "abc",
    })
    expect(staff.map((s) => s.id)).not.toContain("access")

    const director = stepsForTour("provider", {
      signedIn: true,
      isDirector: true,
      hasOrganization: true,
      primaryListingId: "abc",
    })
    expect(director.map((s) => s.id)).toContain("access")
  })

  it("fills a real listing id into the site steps", () => {
    const steps = stepsForTour("provider", {
      signedIn: true,
      isDirector: true,
      hasOrganization: true,
      primaryListingId: "site-7",
    })

    for (const step of steps) {
      // A step must never navigate to a path with a placeholder left in it.
      expect(step.path, step.id).not.toContain("[")
      expect(step.path.endsWith("/portal/sites"), step.id).toBe(false)
    }

    expect(steps.find((s) => s.id === "site-settings")?.path).toBe(
      "/portal/sites/site-7/settings"
    )
  })

  it("drops the site steps entirely when there is no site yet", () => {
    const ids = stepsForTour("provider", {
      signedIn: true,
      isDirector: true,
      hasOrganization: true,
      primaryListingId: null,
    }).map((s) => s.id)

    expect(ids).not.toContain("site-settings")
    expect(ids).not.toContain("description")
    // There is still something to walk, or the tour would offer itself and
    // then show nothing.
    expect(ids.length).toBeGreaterThan(0)
  })

  it("offers the create step only before there is an organization", () => {
    const fresh = stepsForTour("provider", {
      signedIn: true,
      hasOrganization: false,
    }).map((s) => s.id)
    expect(fresh[0]).toBe("create")

    const settled = stepsForTour("provider", {
      signedIn: true,
      hasOrganization: true,
      primaryListingId: "abc",
    }).map((s) => s.id)
    expect(settled).not.toContain("create")
  })
})

describe("no audience gets an empty tour", () => {
  it("has at least two steps for every combination that can occur", () => {
    const audiences = [
      { signedIn: false },
      { signedIn: true },
      { signedIn: true, hasOrganization: false },
      { signedIn: true, hasOrganization: true, primaryListingId: null },
      {
        signedIn: true,
        hasOrganization: true,
        primaryListingId: "x",
        isDirector: false,
      },
      {
        signedIn: true,
        hasOrganization: true,
        primaryListingId: "x",
        isDirector: true,
      },
    ]

    for (const role of roles) {
      for (const audience of audiences) {
        const steps = stepsForTour(role, audience)
        expect(
          steps.length,
          `${role} ${JSON.stringify(audience)}`
        ).toBeGreaterThan(1)
      }
    }
  })
})

describe("the features tour", () => {
  it("has a step for every feature, in the order the page lists them", () => {
    // Generated from lib/features.ts rather than written out again, so a
    // feature that is deleted cannot leave a step walking people to a page
    // that 404s. That is exactly how the nav entries for Get Help, the income
    // cliff check and quiet mode survived their own removal.
    const steps = stepsForTour("features", { signedIn: false })
    const featureSteps = steps.filter((step) => step.id.startsWith("feature-"))

    expect(featureSteps.map((step) => step.id)).toEqual(
      features.map((feature) => `feature-${feature.slug}`)
    )
    expect(featureSteps.map((step) => step.path)).toEqual(
      features.map((feature) => `/features/${feature.slug}`)
    )
  })

  it("opens on the index and ends on the real list", () => {
    const steps = stepsForTour("features", { signedIn: false })

    expect(steps[0]?.path).toBe("/features")
    expect(steps[steps.length - 1]?.path).toBe("/places")
  })

  it("shows the same steps whether or not somebody is signed in", () => {
    // None of these pages is gated, so filtering by account would only be a
    // way to get the count wrong.
    const out = stepsForTour("features", { signedIn: false }).map((s) => s.id)
    const inn = stepsForTour("features", { signedIn: true }).map((s) => s.id)
    expect(out).toEqual(inn)
  })
})

/** Every path the app actually serves, read off the filesystem. */
function servedRoutes(dir = "app", prefix = ""): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      // (groups) do not appear in the URL.
      const segment =
        entry.startsWith("(") && entry.endsWith(")") ? prefix : `${prefix}/${entry}`
      out.push(...servedRoutes(full, segment))
    } else if (entry === "page.tsx") {
      out.push(prefix === "" ? "/" : prefix)
    }
  }
  return out
}

function isServed(path: string, routes: string[]) {
  // A step may point at a tab, which is a query, not a route.
  const clean = path.split("?")[0].replace(/\/$/, "") || "/"
  if (routes.includes(clean)) return true
  return routes.some((route) =>
    route.includes("[")
      ? new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`).test(clean)
      : false
  )
}

describe("every step goes somewhere the app serves", () => {
  // The regression this exists for: the access step kept pointing at
  // /portal/access after that page was deleted, so taking the provider tour
  // ended on a 404. A step path is data, so the dead-link sweep over href=
  // and redirect( never saw it.
  const routes = servedRoutes()

  it("found the app's routes, so the rest of this test means something", () => {
    expect(routes).toContain("/places")
    expect(routes).toContain("/portal")
    expect(routes.length).toBeGreaterThan(15)
  })

  it("serves every path in every tour, for every audience", () => {
    const audiences: TourAudience[] = [
      { signedIn: false },
      { signedIn: true },
      { signedIn: true, hasOrganization: false },
      { signedIn: true, hasOrganization: true, primaryListingId: null },
      {
        signedIn: true,
        hasOrganization: true,
        primaryListingId: "11111111-1111-1111-1111-111111111111",
        isDirector: true,
      },
    ]

    for (const tour of roles) {
      for (const audience of audiences) {
        for (const step of stepsForTour(tour, audience)) {
          expect(
            isServed(step.path, routes),
            `${tour}/${step.id} points at ${step.path}, which the app does not serve`
          ).toBe(true)
        }
      }
    }
  })

  it("leaves no placeholder in a path it hands to the router", () => {
    for (const tour of roles) {
      for (const step of stepsForTour(tour, {
        signedIn: true,
        hasOrganization: true,
        primaryListingId: "abc",
        isDirector: true,
      })) {
        expect(step.path, step.id).not.toContain("[")
        expect(step.path, step.id).not.toContain(":id")
      }
    }
  })
})
