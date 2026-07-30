// Thin HTTP client for the Catalog service (pandc-side only). Shared-secret internal auth.
// Write methods no longer attach X-On-Behalf-Of (used to come from the NextAuth session) --
// login is removed from this app, so there's no signed-in user to attribute writes to; these
// methods are kept for interface compatibility but have no caller left in this app.
const BASE = process.env.CATALOG_API_URL?.replace(/\/$/, "")
const INTERNAL_KEY = process.env.CATALOG_INTERNAL_KEY

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (INTERNAL_KEY) h["X-Internal-Key"] = INTERNAL_KEY
  return h
}

async function fetchRes(method: string, path: string, body: unknown): Promise<Response> {
  if (!BASE) throw new Error("CATALOG_API_URL not set")
  return fetch(`${BASE}${path}`, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
}

async function ensureOk(res: Response, method: string, path: string): Promise<Response> {
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`[catalog] ${method} ${path} -> ${res.status} ${text}`)
  }
  return res
}

export const catalog = {
  async getJson<T>(path: string): Promise<T> {
    return (await ensureOk(await fetchRes("GET", path, undefined), "GET", path)).json()
  },
  async getJsonOrNull<T>(path: string): Promise<T | null> {
    const res = await fetchRes("GET", path, undefined)
    if (res.status === 404) return null
    return (await ensureOk(res, "GET", path)).json()
  },
  async postJson<T>(path: string, body?: unknown): Promise<T> {
    return (await ensureOk(await fetchRes("POST", path, body), "POST", path)).json()
  },
  async patchJson<T>(path: string, body?: unknown): Promise<T> {
    return (await ensureOk(await fetchRes("PATCH", path, body), "PATCH", path)).json()
  },
  async putJson<T>(path: string, body?: unknown): Promise<T> {
    return (await ensureOk(await fetchRes("PUT", path, body), "PUT", path)).json()
  },
  async post(path: string, body?: unknown): Promise<void> {
    await ensureOk(await fetchRes("POST", path, body), "POST", path)
  },
  async del(path: string): Promise<void> {
    await ensureOk(await fetchRes("DELETE", path, undefined), "DELETE", path)
  },
}
