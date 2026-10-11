import { describe, expect, it } from "vitest"

import { stepsForTour, tours, type TourRole } from "@/lib/tours/steps"

const roles: TourRole[] = ["seeker", "provider"]

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
    const gone = /voice|quiet mode|income cliff|hurt me|get help/i

    for (const role of roles) {
      for (const step of tours[role].steps) {
        const text = `${step.title} ${step.body} ${step.action ?? ""}`
        expect(text, `${role}/${step.id}`).not.toMatch(gone)
      }
    }
  })
})

describe("the seeker tour needs no account", () => {
  it("gives a guest a walkable tour with the account step swapped out", () => {
    const guest = stepsForTour("seeker", { signedIn: false })
    const ids = guest.map((step) => step.id)

    expect(guest.length).toBeGreaterThan(1)
    // The questionnaire is account-only, so a guest must not be sent to a
    // page that would only redirect them back.
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
