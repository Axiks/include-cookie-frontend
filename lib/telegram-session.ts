import { SignJWT, jwtVerify, errors as joseErrors } from "jose"

// Stateless handshake token: previously an in-memory Map keyed by a random hex string,
// which loses all pending tokens on container restart and doesn't work across
// multiple instances (no shared state). Signing the payload into the token itself
// (JWS/HS256, keyed off AUTH_SECRET) removes the server-side store entirely, so it
// survives restarts/redeploys and scales to any number of instances. The short TTL
// stands in for single-use: the token is consumed immediately by the same browser
// in the same flow, so replay exposure is limited to that window.

const AUDIENCE = "tg-login"
const TTL_SECONDS = 5 * 60

function key(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error("AUTH_SECRET is not configured")
    return new TextEncoder().encode(secret)
}

export async function storeTelegramToken(userId: string, kratosId: string): Promise<string> {
    return new SignJWT({ userId, kratosId })
        .setProtectedHeader({ alg: "HS256" })
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${TTL_SECONDS}s`)
        .sign(key())
}

export async function consumeTelegramToken(token: string): Promise<{ userId: string; kratosId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, key(), { audience: AUDIENCE })
        if (typeof payload.userId !== "string" || typeof payload.kratosId !== "string") return null
        return { userId: payload.userId, kratosId: payload.kratosId }
    } catch (e) {
        if (e instanceof joseErrors.JOSEError) return null
        throw e
    }
}
