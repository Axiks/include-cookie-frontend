import type { KratosIdentity } from "@/lib/auth-client"

// First-party OAuth2 clients skip the consent screen (Google-style SSO across
// our own services). Configure via FIRST_PARTY_CLIENT_IDS (comma-separated).
export function isFirstPartyClient(clientId: string | undefined): boolean {
    if (!clientId) return false
    const allow = (process.env.FIRST_PARTY_CLIENT_IDS ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    return allow.includes(clientId)
}

// Absolute base URL of this frontend — avatars must be absolute to be usable
// by other services consuming the claims.
function frontendOrigin(): string {
    return (process.env.FRONTEND_URL ?? process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
}

export function absoluteFileUrl(raw: string | undefined | null, subCatalog: "avatars" | "covers"): string | undefined {
    if (!raw) return undefined
    if (raw.startsWith("http")) return raw
    const path = raw.startsWith("/") ? raw : `/cdn/${subCatalog}/${raw}`
    return `${frontendOrigin()}${path}`
}

export function absoluteAvatarUrl(raw: string | undefined | null): string | undefined {
    return absoluteFileUrl(raw, "avatars")
}

export interface SharedProfileClaims {
    sub: string
    nickname?: string
    preferred_username?: string
    name?: string
    picture?: string
    avatar_url?: string
    telegram_id?: string
    about?: string
}

// Maps a Kratos identity (as returned by the auth-service) → OIDC claims for the ID token.
export function traitsToClaims(subject: string, identity: KratosIdentity): SharedProfileClaims {
    const avatar = absoluteAvatarUrl(identity.avatarUrl)
    return {
        sub: subject,
        nickname: identity.nickname ?? undefined,
        preferred_username: identity.nickname ?? undefined,
        name: identity.nickname ?? undefined,
        picture: avatar,
        avatar_url: avatar,
        telegram_id: identity.tgId ?? undefined,
        about: identity.about ?? undefined,
    }
}
