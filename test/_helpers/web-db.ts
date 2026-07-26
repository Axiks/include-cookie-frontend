// Integration-test DB helper for the web app (Prisma / SQLite, users/auth).
// Builds a schema'd template DB once per worker, then hands out cheap per-file copies.
// Set DATABASE_URL to the returned url BEFORE importing the prisma singleton.
import { execSync } from "node:child_process"
import { mkdtempSync, copyFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, "../..") // apps/web
const schemaDir = join(appRoot, "prisma") // multi-file schema (schema.prisma + models/)

let template: string | null = null

function ensureTemplate(): string {
  if (template) return template
  const f = join(mkdtempSync(join(tmpdir(), "web-tmpl-")), "template.db")
  execSync(`npx prisma db push --schema "${schemaDir}" --skip-generate`, {
    cwd: appRoot,
    env: { ...process.env, DATABASE_URL: `file:${f}` },
    stdio: "ignore",
  })
  template = f
  return f
}

/** Fresh, schema'd, empty web DB. Returns a `file:` url for DATABASE_URL. */
export function freshWebDbUrl(): string {
  const f = join(mkdtempSync(join(tmpdir(), "web-db-")), "cookie.db")
  copyFileSync(ensureTemplate(), f)
  return `file:${f}`
}

/** Wipe all rows between tests. FK checks are disabled for the wipe so order is moot. */
export async function resetWebDb(prisma: any): Promise<void> {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF")
  for (const t of [
    "userStackVote",
    "userAvatar",
    "userCover",
    "authenticator",
    "session",
    "account",
    "userLink",
    "image",
    "user",
    "stack",
  ]) {
    await prisma[t].deleteMany()
  }
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON")
}
