// Thin HTTP client for the lumi-auth service — centralizes the Kratos-admin/Telegram-Bot-API/
// WebAuthn-bridging backend logic that used to live directly in this app. Mirrors
// lib/catalog-client.ts's shape (internal shared-secret auth, no cookies).
const BASE = process.env.AUTH_SERVICE_URL?.replace(/\/$/, "")
const INTERNAL_KEY = process.env.AUTH_INTERNAL_KEY

export class AuthClientError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`[auth-client] request failed: ${status}`)
  }
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (INTERNAL_KEY) h["X-Internal-Key"] = INTERNAL_KEY
  return h
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE) throw new Error("AUTH_SERVICE_URL not set")
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => undefined)
  if (!res.ok) throw new AuthClientError(res.status, data)
  return data as T
}

async function requestOrNull<T>(method: string, path: string): Promise<T | null> {
  try {
    return await request<T>(method, path)
  } catch (e) {
    if (e instanceof AuthClientError && e.status === 404) return null
    throw e
  }
}

// Passthrough for the passkey registration-flow proxy — Kratos's own status/body (validation
// errors etc.) must reach the browser as-is, not be swallowed into a generic thrown error.
async function requestRaw(method: string, path: string, body?: unknown): Promise<{ status: number; data: unknown }> {
  if (!BASE) throw new Error("AUTH_SERVICE_URL not set")
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  const data = await res.json().catch(() => undefined)
  return { status: res.status, data }
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

export interface KratosPasskey {
  id: string
  display_name: string
  added_at: string
}

export interface HydraLoginRequest {
  skip: boolean
  subject: string
  client?: { client_id?: string }
  requested_scope?: string[]
}

export interface HydraConsentRequest {
  subject?: string
  client?: { client_id?: string }
  requested_scope?: string[]
  requested_access_token_audience?: string[]
}

export interface HydraRedirect {
  redirect_to: string
}

export const authClient = {
  telegramWidgetLogin(params: Record<string, string>): Promise<{ kratosId: string; isNew: boolean }> {
    return request("POST", "/telegram/widget-login", { params })
  },
  telegramMiniappLogin(initData: string): Promise<{ kratosId: string; isNew: boolean }> {
    return request("POST", "/telegram/miniapp-login", { initData })
  },
  async getChatMember(chatId: string, userId: string): Promise<string | null> {
    const { status } = await request<{ status: string | null }>(
      "GET",
      `/telegram/chat-member?chatId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(userId)}`,
    )
    return status
  },
  getIdentity(id: string): Promise<KratosIdentity | null> {
    return requestOrNull("GET", `/identities/${encodeURIComponent(id)}`)
  },
  updateTraits(id: string, patch: {
    nickname?: string
    about?: string | null
    avatarUrl?: string | null
    coverUrl?: string | null
    links?: KratosProfileLink[]
  }): Promise<void> {
    return request("PATCH", `/identities/${encodeURIComponent(id)}`, patch)
  },
  findByNickname(nickname: string): Promise<{ kratosId: string; tgId: string } | null> {
    return requestOrNull("GET", `/identities/by-nickname/${encodeURIComponent(nickname)}`)
  },
  listOrSearch(q?: string): Promise<WebUserSummary[]> {
    return request("GET", `/identities${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  },
  batchProfiles(ids: string[]): Promise<Record<string, WebUserSummary>> {
    return request("POST", "/identities/batch", { ids })
  },
  listPasskeys(kratosId: string): Promise<KratosPasskey[]> {
    return request("GET", `/identities/${encodeURIComponent(kratosId)}/passkeys`)
  },
  passkeyRegistrationFlowInit(kratosId: string): Promise<{ flow: unknown; token: string }> {
    return request("GET", `/passkey/registration-flow?kratosId=${encodeURIComponent(kratosId)}`)
  },
  passkeyRegistrationFlowSubmit(params: { flowId: string; token: string; body: Record<string, unknown> }) {
    return requestRaw("POST", "/passkey/registration-flow", params)
  },
  passkeyRegistrationRemove(kratosId: string, credentialId: string) {
    return requestRaw("POST", "/passkey/registration-remove", { kratosId, credentialId })
  },
  hydraGetLoginRequest(challenge: string): Promise<HydraLoginRequest> {
    return request("GET", `/hydra/login/${encodeURIComponent(challenge)}`)
  },
  hydraAcceptLoginRequest(challenge: string, body: {
    subject: string
    remember?: boolean
    remember_for?: number
  }): Promise<HydraRedirect> {
    return request("POST", `/hydra/login/${encodeURIComponent(challenge)}/accept`, body)
  },
  hydraGetConsentRequest(challenge: string): Promise<HydraConsentRequest> {
    return request("GET", `/hydra/consent/${encodeURIComponent(challenge)}`)
  },
  hydraAcceptConsentRequest(challenge: string, body: {
    grant_scope?: string[]
    grant_access_token_audience?: string[]
    remember?: boolean
    remember_for?: number
    session?: { id_token?: Record<string, unknown> }
  }): Promise<HydraRedirect> {
    return request("POST", `/hydra/consent/${encodeURIComponent(challenge)}/accept`, body)
  },
  hydraRejectConsentRequest(challenge: string, body: {
    error?: string
    error_description?: string
  }): Promise<HydraRedirect> {
    return request("POST", `/hydra/consent/${encodeURIComponent(challenge)}/reject`, body)
  },
  hydraAcceptLogoutRequest(challenge: string): Promise<HydraRedirect> {
    return request("POST", `/hydra/logout/${encodeURIComponent(challenge)}/accept`)
  },
}
