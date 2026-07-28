import { SignJWT, jwtVerify, errors as joseErrors } from "jose"

// Stateless handshake token (post-verification) — same rationale as telegram-session.ts:
// signed JWS instead of an in-memory Map, so it survives restarts and works across instances.
const TOKEN_AUDIENCE = "passkey-login"
const TOKEN_TTL_SECONDS = 60

function key(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error("AUTH_SECRET is not configured")
    return new TextEncoder().encode(secret)
}

export async function storePasskeyToken(kratosId: string): Promise<string> {
    return new SignJWT({ kratosId })
        .setProtectedHeader({ alg: "HS256" })
        .setAudience(TOKEN_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
        .sign(key())
}

export async function consumePasskeyToken(token: string): Promise<{ kratosId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, key(), { audience: TOKEN_AUDIENCE })
        if (typeof payload.kratosId !== "string") return null
        return { kratosId: payload.kratosId }
    } catch (e) {
        if (e instanceof joseErrors.JOSEError) return null
        throw e
    }
}
