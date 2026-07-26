// Guards against open redirects: only allow same-origin relative paths.
export function safeNext(next: string | null | undefined, fallback = "/"): string {
    if (!next) return fallback
    // must be a relative path ("/...") but not a protocol-relative "//host"
    if (next.startsWith("/") && !next.startsWith("//")) return next
    return fallback
}
