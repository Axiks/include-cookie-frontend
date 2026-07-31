// Thin HTTP client for the lumi-auth service. Login itself was removed from this app (see
// archive/login-features) — the only remaining use is batch profile lookup, which hydrates
// contributor nicknames/avatars on project cards (lib/kratos-identities.ts).
const BASE = process.env.AUTH_SERVICE_URL?.replace(/\/$/, "")
const INTERNAL_KEY = process.env.AUTH_INTERNAL_KEY

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE) throw new Error("AUTH_SERVICE_URL not set")
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (INTERNAL_KEY) h["X-Internal-Key"] = INTERNAL_KEY
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  const data = await res.json().catch(() => undefined)
  if (!res.ok) throw new Error(`[auth-client] ${method} ${path} -> ${res.status}`)
  return data as T
}

export interface KratosProfileLink {
  name: string
  url: string
}

export interface KratosIdentity {
  kratosId: string
  tgId: string | null
  nickname: string | null
  about: string | null
  avatarUrl: string | null
  coverUrl: string | null
  links: KratosProfileLink[]
}

export type WebUserSummary = KratosIdentity

export const authClient = {
  batchProfiles(ids: string[]): Promise<Record<string, WebUserSummary>> {
    return request("POST", "/identities/batch", { ids })
  },
}
