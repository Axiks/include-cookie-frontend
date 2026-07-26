// Use globalThis so these Maps survive Next.js HMR reloads and are shared
// across all module instances within the same Node.js process.
const g = globalThis as unknown as {
    _passkeySessionChallenges?: Map<string, { challenge: string; expires: number }>
    _passkeySessionTokens?: Map<string, { userId: string; kratosId: string; expires: number }>
}

const challenges: Map<string, { challenge: string; expires: number }> =
    g._passkeySessionChallenges ??= new Map()

const passkeyTokens: Map<string, { userId: string; kratosId: string; expires: number }> =
    g._passkeySessionTokens ??= new Map()

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

export function storePasskeyToken(token: string, userId: string, kratosId: string): void {
    const now = Date.now()
    for (const [k, v] of passkeyTokens) if (v.expires < now) passkeyTokens.delete(k)
    passkeyTokens.set(token, { userId, kratosId, expires: now + 60_000 })
}

export function consumePasskeyToken(token: string): { userId: string; kratosId: string } | null {
    const entry = passkeyTokens.get(token)
    if (!entry || entry.expires < Date.now()) { passkeyTokens.delete(token); return null }
    passkeyTokens.delete(token)
    return { userId: entry.userId, kratosId: entry.kratosId }
}
