import { auth } from "@/auth"

// Thin HTTP client for the Catalog service (pandc-side only). First-party internal
// auth: shared secret + X-On-Behalf-Of (the logged-in user's sub) for writes.
const BASE = process.env.CATALOG_API_URL?.replace(/\/$/, "")
const INTERNAL_KEY = process.env.CATALOG_INTERNAL_KEY

async function buildHeaders(withSub: boolean): Promise<Record<string, string>> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (INTERNAL_KEY) h["X-Internal-Key"] = INTERNAL_KEY
  if (withSub) {
    const session = await auth()
    const sub = session?.user?.kratosId
    if (sub) h["X-On-Behalf-Of"] = sub
  }
  return h
}

async function fetchRes(method: string, path: string, body: unknown, withSub: boolean): Promise<Response> {
  if (!BASE) throw new Error("CATALOG_API_URL not set")
  return fetch(`${BASE}${path}`, {
    method,
    headers: await buildHeaders(withSub),
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
    return (await ensureOk(await fetchRes("GET", path, undefined, false), "GET", path)).json()
  },
  async getJsonOrNull<T>(path: string): Promise<T | null> {
    const res = await fetchRes("GET", path, undefined, false)
    if (res.status === 404) return null
    return (await ensureOk(res, "GET", path)).json()
  },
  async postJson<T>(path: string, body?: unknown): Promise<T> {
    return (await ensureOk(await fetchRes("POST", path, body, true), "POST", path)).json()
  },
  async patchJson<T>(path: string, body?: unknown): Promise<T> {
    return (await ensureOk(await fetchRes("PATCH", path, body, true), "PATCH", path)).json()
  },
  async putJson<T>(path: string, body?: unknown): Promise<T> {
    return (await ensureOk(await fetchRes("PUT", path, body, true), "PUT", path)).json()
  },
  async post(path: string, body?: unknown): Promise<void> {
    await ensureOk(await fetchRes("POST", path, body, true), "POST", path)
  },
  async del(path: string): Promise<void> {
    await ensureOk(await fetchRes("DELETE", path, undefined, true), "DELETE", path)
  },
}
