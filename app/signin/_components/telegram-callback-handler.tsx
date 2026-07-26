'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Callout, Spinner } from '@radix-ui/themes'
import { TriangleAlertIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { safeNext } from '@/lib/safe-next'

export default function TelegramCallbackHandler() {
    const searchParams = useSearchParams()
    const t = useTranslations('signin')
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

    const tgToken = searchParams.get('tg_token')
    const nextParam = searchParams.get('next')

    useEffect(() => {
        if (!tgToken) return

        setStatus('loading')
        // `next` was stashed in sessionStorage by TelegramWidgetButton before the
        // Telegram round-trip; URL param kept as a fallback.
        const next = nextParam ?? sessionStorage.getItem('oauth_next')
        signIn('telegram', { verifyToken: tgToken, redirect: false })
            .then(result => {
                if (result?.error) { setStatus('error'); return }
                sessionStorage.removeItem('oauth_next')
                window.location.replace(safeNext(next))
            })
            .catch(() => setStatus('error'))
    }, [tgToken, nextParam])

    if (!tgToken || status === 'idle') return null

    if (status === 'loading') return (
        <Callout.Root>
            <Callout.Icon><Spinner size="1" /></Callout.Icon>
            <Callout.Text>{t('miniAppSignIn')}</Callout.Text>
        </Callout.Root>
    )

    return (
        <Callout.Root color="red">
            <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
            <Callout.Text>{t('errorTelegram')}</Callout.Text>
        </Callout.Root>
    )
}
