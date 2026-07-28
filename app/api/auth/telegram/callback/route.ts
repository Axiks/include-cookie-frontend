import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { userRegisterViaWidget } from '@/features/auth/Auth'
import { getChatMembershipGate } from '@/features/auth/chat-gate'
import { storeTelegramToken } from '@/lib/telegram-session'
import type { TelegramWidgetPayload } from '@/features/auth/telegram-auth.interface'

/**
 * Verifies the hash sent by the Telegram Login Widget.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyWidgetHash(params: TelegramWidgetPayload, botToken: string): boolean {
    const rawParams = params as unknown as Record<string, string | undefined>
    const hash = rawParams['hash']
    if (!hash) return false
    const dataCheckString = Object.keys(rawParams)
        .filter(k => k !== 'hash' && rawParams[k] !== undefined)
        .sort()
        .map(k => `${k}=${rawParams[k]}`)
        .join('\n')
    const secretKey = createHash('sha256').update(botToken).digest()
    const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    return expected === hash
}

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

    const botToken = process.env.BOT_TOKEN
    if (!botToken || !verifyWidgetHash(params, botToken)) {
        return NextResponse.redirect(signinRedirect(origin, { error: 'invalid_telegram_hash' }, next))
    }

    // Reject stale auth data (older than 24 hours)
    if (Date.now() / 1000 - Number(params.auth_date) > 86400) {
        return NextResponse.redirect(signinRedirect(origin, { error: 'telegram_auth_expired' }, next))
    }

    const gate = getChatMembershipGate()
    if (!await gate.checkAccess(params.id)) {
        return NextResponse.redirect(signinRedirect(origin, { error: 'access_denied' }, next))
    }

    try {
        const user = await userRegisterViaWidget({
            tgId: params.id,
            username: params.username,
            displayName: [params.first_name, params.last_name].filter(Boolean).join(' '),
            photoUrl: params.photo_url,
        })

        const token = await storeTelegramToken(user.id, user.kratosId ?? '')
        return NextResponse.redirect(signinRedirect(origin, { tg_token: token }, next))
    } catch (e) {
        console.error('[telegram/callback] Error:', e)
        return NextResponse.redirect(signinRedirect(origin, { error: 'telegram_server_error' }, next))
    }
}
