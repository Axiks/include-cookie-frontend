import { SignJWT, jwtVerify, errors as joseErrors } from "jose"

// Use globalThis so this Map survives Next.js HMR reloads and is shared
// across all module instances within the same Node.js process.
const g = globalThis as unknown as {
    _passkeySessionChallenges?: Map<string, { challenge: string; expires: number }>
}

const challenges: Map<string, { challenge: string; expires: number }> =
    g._passkeySessionChallenges ??= new Map()

export function storeChallenge(id: string, challenge: string): void {
    const now = Date.now()
    for (const [k, v] of challenges) if (v.expires < now) challenges.delete(k)
    challenges.set(id, { challenge, expires: now + 5 * 60_000 })
}

export function consumeChallenge(id: string): string | null {
    const entry = challenges.get(id)
    if (!entry || entry.expires < Date.now()) { challenges.delete(id); return null }
    challenges.delete(id)
    return entry.challenge
}

// Stateless handshake token (post-verification) — same rationale as telegram-session.ts:
// signed JWS instead of an in-memory Map, so it survives restarts and works across instances.
const TOKEN_AUDIENCE = "passkey-login"
const TOKEN_TTL_SECONDS = 60

function key(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error("AUTH_SECRET is not configured")
    return new TextEncoder().encode(secret)
}

export async function storePasskeyToken(userId: string, kratosId: string): Promise<string> {
    return new SignJWT({ userId, kratosId })
        .setProtectedHeader({ alg: "HS256" })
        .setAudience(TOKEN_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
        .sign(key())
}

export async function consumePasskeyToken(token: string): Promise<{ userId: string; kratosId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, key(), { audience: TOKEN_AUDIENCE })
        if (typeof payload.userId !== "string" || typeof payload.kratosId !== "string") return null
        return { userId: payload.userId, kratosId: payload.kratosId }
    } catch (e) {
        if (e instanceof joseErrors.JOSEError) return null
        throw e
    }
}
