import type { Identity } from "@ory/client"

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

export function absoluteAvatarUrl(raw: string | undefined | null): string | undefined {
    if (!raw) return undefined
    if (raw.startsWith("http")) return raw
    const path = raw.startsWith("/") ? raw : `/cdn/avatars/${raw}`
    return `${frontendOrigin()}${path}`
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

// Maps Kratos identity traits → OIDC claims for the ID token.
export function traitsToClaims(subject: string, identity: Identity): SharedProfileClaims {
    const traits = (identity.traits ?? {}) as {
        nickname?: string
        avatar_url?: string
        telegram_id?: string
        about?: string
    }
    const avatar = absoluteAvatarUrl(traits.avatar_url)
    return {
        sub: subject,
        nickname: traits.nickname,
        preferred_username: traits.nickname,
        name: traits.nickname,
        picture: avatar,
        avatar_url: avatar,
        telegram_id: traits.telegram_id,
        about: traits.about,
    }
}
