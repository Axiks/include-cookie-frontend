import { randomBytes } from 'crypto'

// globalThis pattern — survives Next.js HMR and module isolation (see passkey-session.ts)
const g = globalThis as unknown as {
    _telegramSessionTokens?: Map<string, { userId: string; kratosId: string; expires: number }>
}

const tokens: Map<string, { userId: string; kratosId: string; expires: number }> =
    g._telegramSessionTokens ??= new Map()

export function storeTelegramToken(userId: string, kratosId: string): string {
    const token = randomBytes(32).toString('hex')
    const now = Date.now()
    for (const [k, v] of tokens) if (v.expires < now) tokens.delete(k)
    tokens.set(token, { userId, kratosId, expires: now + 5 * 60_000 }) // 5 min TTL
    return token
}

export function consumeTelegramToken(token: string): { userId: string; kratosId: string } | null {
    const entry = tokens.get(token)
    if (!entry || entry.expires < Date.now()) { tokens.delete(token); return null }
    tokens.delete(token)
    return { userId: entry.userId, kratosId: entry.kratosId }
}
