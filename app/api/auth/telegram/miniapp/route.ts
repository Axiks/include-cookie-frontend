import { NextRequest, NextResponse } from 'next/server'
import { validate, parse } from '@tma.js/init-data-node'
import { userRegisterViaWidget } from '@/features/auth/Auth'
import { getChatMembershipGate } from '@/features/auth/chat-gate'
import { storeTelegramToken } from '@/lib/telegram-session'

export async function POST(req: NextRequest) {
    const { initData } = await req.json()
    if (!initData) return NextResponse.json({ error: 'missing_init_data' }, { status: 400 })

    const botToken = process.env.BOT_TOKEN
    if (!botToken) return NextResponse.json({ error: 'server_error' }, { status: 500 })

    try {
        // Validates HMAC and checks expiry (default 24h)
        validate(initData, botToken, { expiresIn: 86400 })
    } catch (e) {
        console.error('[miniapp] initData validation failed:', e)
        return NextResponse.json({ error: 'invalid_init_data' }, { status: 401 })
    }

    const data = parse(initData)
    const tgUser = data.user
    if (!tgUser) return NextResponse.json({ error: 'no_user_in_init_data' }, { status: 400 })

    const gate = getChatMembershipGate()
    if (!await gate.checkAccess(tgUser.id)) {
        return NextResponse.json({ error: 'access_denied' }, { status: 403 })
    }

    try {
        const user = await userRegisterViaWidget({
            tgId: String(tgUser.id),
            username: tgUser.username,
            displayName: [tgUser.firstName, tgUser.lastName].filter(Boolean).join(' '),
            photoUrl: tgUser.photoUrl as string | undefined,
        })

        const token = storeTelegramToken(user.id, user.kratosId ?? '')
        return NextResponse.json({ token })
    } catch (e) {
        console.error('[telegram/miniapp] Error:', e)
        return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }
}
