'use client'

import { useEffect, useRef } from 'react'
import { Callout } from '@radix-ui/themes'
import { TriangleAlertIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
    access_denied: 'errorAccessDenied',
    invalid_telegram_hash: 'errorTelegram',
    invalid_telegram_data: 'errorTelegram',
    telegram_auth_expired: 'errorTelegram',
    telegram_server_error: 'errorTelegram',
}

export default function TelegramWidgetButton({
    botUsername,
}: {
    botUsername: string
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const t = useTranslations('signin')
    const searchParams = useSearchParams()
    const errorKey = searchParams.get('error')
    const errorMsgKey = errorKey ? ERROR_MESSAGES[errorKey] : null
    const next = searchParams.get('next')

    useEffect(() => {
        const container = containerRef.current
        if (!container || !botUsername) return

        // Stash `next` in sessionStorage rather than the callback query: Telegram's
        // data-auth-url does not reliably preserve a long extra param, and `next`
        // carries the ~2KB login_challenge. sessionStorage survives the round-trip to
        // Telegram and back (same tab) and is read by TelegramCallbackHandler.
        if (next) sessionStorage.setItem('oauth_next', next)

        // Clean callback URL — only Telegram's own params get appended.
        const authUrl = `${window.location.origin}/api/auth/telegram/callback`

        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.async = true
        script.setAttribute('data-telegram-login', botUsername)
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-auth-url', authUrl)
        script.setAttribute('data-request-access', 'write')
        container.appendChild(script)

        return () => { script.remove() }
    }, [botUsername, next])

    return (
        <div>
            <div ref={containerRef} />
            {errorMsgKey && (
                <Callout.Root color="red" mt="2">
                    <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
                    <Callout.Text>{t(errorMsgKey as any)}</Callout.Text>
                </Callout.Root>
            )}
        </div>
    )
}
