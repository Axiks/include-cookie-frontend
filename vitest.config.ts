import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  // Explicit "@" alias: vitest doesn't apply tsconfig "paths" on its own, so mirror
  // tsconfig.json's "@/*" → "./*" here.
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    pool: "forks",
  },
})
