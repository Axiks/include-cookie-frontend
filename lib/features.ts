import { inDevEnvironment } from "@/lib/shared/utils/helpers"

// Temporary kill-switch for the "dynamic" (non-static) parts of the site: Members,
// Statistics, Profile/Configurator and Sign-in/Registration. (The read-only projects
// catalog has its own, more permissive gate — see projectsCatalogEnabled below.)
//
// These are hidden and their routes/APIs are blocked in production, but stay fully
// available during local development so we can keep working on them.
//
// Default: enabled only in local dev (NODE_ENV=development). Override in any
// environment with DYNAMIC_FEATURES=on | off.
export function dynamicFeaturesEnabled(): boolean {
  const override = process.env.DYNAMIC_FEATURES?.toLowerCase()
  if (override === "on" || override === "true" || override === "1") return true
  if (override === "off" || override === "false" || override === "0") return false
  return inDevEnvironment
}

// Route prefixes gated behind the dynamic-features flag. When the flag is off these
// are blocked in middleware (pages redirect home, API/oauth return 404).
export const DYNAMIC_ROUTE_PREFIXES = [
  "/project",
  "/user",
  "/statistic",
  "/signin",
  "/configurator",
  "/oauth",
  "/api/auth",
  "/api/kratos",
  "/api/passkey",
  "/api/dev",
] as const

export function isDynamicRoute(pathname: string): boolean {
  return DYNAMIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  )
}

// The read-only projects catalog (/project pages, the home projects block, the header
// link) ships ahead of the rest of the dynamic features: available everywhere —
// INCLUDING production — unless the kill-switch is explicitly off. Pages additionally
// hide it at runtime when the catalog service doesn't respond, so a broken backend
// degrades to the static site instead of erroring. Auth, Members, Statistics and the
// Configurator stay behind dynamicFeaturesEnabled().
export function projectsCatalogEnabled(): boolean {
  const override = process.env.DYNAMIC_FEATURES?.toLowerCase()
  if (override === "off" || override === "false" || override === "0") return false
  return true
}

export function isProjectsRoute(pathname: string): boolean {
  return pathname === "/project" || pathname.startsWith("/project/")
}
