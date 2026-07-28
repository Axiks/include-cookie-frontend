import { NextRequest, NextResponse } from 'next/server'
import { parse } from '@tma.js/init-data-node'
import { authClient, AuthClientError } from '@/lib/auth-client'
import { getChatMembershipGate } from '@/features/auth/chat-gate'
import { storeTelegramToken } from '@/lib/telegram-session'

export async function POST(req: NextRequest) {
    const { initData } = await req.json()
    if (!initData) return NextResponse.json({ error: 'missing_init_data' }, { status: 400 })

    // `parse` does not check the signature — it's just a query-string parser, used here
    // only to read the (not-yet-verified) user id for the gate check. Actual HMAC
    // verification happens auth-service-side in telegramMiniappLogin below; no identity
    // is ever created unless that verification also succeeds.
    let tgUserId: number | undefined
    try {
        tgUserId = parse(initData).user?.id
    } catch {
        return NextResponse.json({ error: 'invalid_init_data' }, { status: 401 })
    }
    if (!tgUserId) return NextResponse.json({ error: 'no_user_in_init_data' }, { status: 400 })

    const gate = getChatMembershipGate()
    if (!await gate.checkAccess(tgUserId)) {
        return NextResponse.json({ error: 'access_denied' }, { status: 403 })
    }

    try {
        const { kratosId } = await authClient.telegramMiniappLogin(initData)
        const token = await storeTelegramToken(kratosId)
        return NextResponse.json({ token })
    } catch (e) {
        if (e instanceof AuthClientError && e.status === 401) {
            const code = (e.body as { error?: string } | undefined)?.error
            return NextResponse.json({ error: code ?? 'invalid_init_data' }, { status: 401 })
        }
        console.error('[telegram/miniapp] Error:', e)
        return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }
}
