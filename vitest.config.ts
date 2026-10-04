import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Only the "@/" alias is needed. Tests import { describe, it, expect } from
// "vitest" explicitly rather than enabling globals, so tsconfig.json needs no
// "types" entry and no test exclusion, and `next build` stays untouched.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
})
