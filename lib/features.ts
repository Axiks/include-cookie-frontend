// Kill-switch for the read-only projects catalog (/project pages, the home projects
// block, the header link) — shown everywhere including production unless explicitly off.
// Pages additionally hide it at runtime when the catalog service doesn't respond, so a
// broken backend degrades to the static site instead of erroring.
export function projectsCatalogEnabled(): boolean {
  const override = process.env.DYNAMIC_FEATURES?.toLowerCase()
  if (override === "off" || override === "false" || override === "0") return false
  return true
}

export function isProjectsRoute(pathname: string): boolean {
  return pathname === "/project" || pathname.startsWith("/project/")
}
