import { describe, expect, it } from "vitest"

import { extensionFor, isAllowedAudioType } from "@/lib/voice/transcribe"

describe("extensionFor", () => {
  it("names the file after what the phone actually recorded", () => {
    // iPhone Safari records mp4. Calling it .webm made transcription fail.
    expect(extensionFor("audio/mp4")).toBe("m4a")
    expect(extensionFor("audio/webm;codecs=opus")).toBe("webm")
    expect(extensionFor("audio/ogg")).toBe("ogg")
    expect(extensionFor("audio/mpeg")).toBe("mp3")
    expect(extensionFor("audio/wav")).toBe("wav")
  })

  it("covers every type the route accepts", () => {
    for (const type of ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"]) {
      expect(isAllowedAudioType(type)).toBe(true)
      expect(extensionFor(type)).not.toBe("")
    }
  })
})
