import { NextRequest, NextResponse } from 'next/server'
import { authClient, AuthClientError } from '@/lib/auth-client'
import { getChatMembershipGate } from '@/features/auth/chat-gate'
import { storeTelegramToken } from '@/lib/telegram-session'
import type { TelegramWidgetPayload } from '@/features/auth/telegram-auth.interface'

// Resolves the public-facing origin even behind a reverse proxy / Cloudflare tunnel.
// req.url contains the internal address (127.0.0.1:3000); we need the real domain.
function getPublicOrigin(req: NextRequest): string {
    const forwardedHost = req.headers.get('x-forwarded-host')
    const proto = req.headers.get('x-forwarded-proto') ?? 'https'
    if (forwardedHost) return `${proto}://${forwardedHost}`
    return req.nextUrl.origin
}

// Builds a /signin redirect, preserving the optional `next` return target.
function signinRedirect(origin: string, params: Record<string, string>, next: string | null): URL {
    const url = new URL('/signin', origin)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    if (next) url.searchParams.set('next', next)
    return url
}

// Telegram sends user data as query params after widget auth (data-auth-url mode)
export async function GET(req: NextRequest) {
    const origin = getPublicOrigin(req)

    // `next` is OUR param (from data-auth-url) — it is NOT part of Telegram's hash,
    // so it must be stripped before hash verification, then carried through.
    const next = req.nextUrl.searchParams.get('next')
    const params = Object.fromEntries(req.nextUrl.searchParams.entries()) as unknown as TelegramWidgetPayload
    delete (params as unknown as Record<string, unknown>).next

    if (!params.hash || !params.id || !params.auth_date) {
        return NextResponse.redirect(signinRedirect(origin, { error: 'invalid_telegram_data' }, next))
    }

    // Hash/expiry verification now happens auth-service-side (it also holds BOT_TOKEN).
    // The gate check runs on the not-yet-verified id first — harmless (it's a read-only
    // Telegram API call), and no identity is ever created unless the login call below
    // also succeeds, which requires a genuinely valid hash.
    const gate = getChatMembershipGate()
    if (!await gate.checkAccess(params.id)) {
        return NextResponse.redirect(signinRedirect(origin, { error: 'access_denied' }, next))
    }

    try {
        const { kratosId } = await authClient.telegramWidgetLogin(params as unknown as Record<string, string>)
        const token = await storeTelegramToken(kratosId)
        return NextResponse.redirect(signinRedirect(origin, { tg_token: token }, next))
    } catch (e) {
        if (e instanceof AuthClientError && e.status === 401) {
            const code = (e.body as { error?: string } | undefined)?.error
            const error = code === 'expired' ? 'telegram_auth_expired'
                : code === 'no_user' ? 'invalid_telegram_data'
                : 'invalid_telegram_hash'
            return NextResponse.redirect(signinRedirect(origin, { error }, next))
        }
        console.error('[telegram/callback] Error:', e)
        return NextResponse.redirect(signinRedirect(origin, { error: 'telegram_server_error' }, next))
    }
}
