import type { NextRequest } from "next/server"

// Resolves the public-facing origin even behind a reverse proxy / Cloudflare
// tunnel, where req.url contains the internal address (127.0.0.1:3000).
export function getPublicOrigin(req: NextRequest): string {
    const forwardedHost = req.headers.get("x-forwarded-host")
    const proto = req.headers.get("x-forwarded-proto") ?? "https"
    if (forwardedHost) return `${proto}://${forwardedHost}`
    return req.nextUrl.origin
}
