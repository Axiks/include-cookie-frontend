'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Callout, Spinner } from '@radix-ui/themes'
import { TriangleAlertIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function TelegramMiniAppAuth() {
    const { data: session, status: sessionStatus } = useSession()
    const t = useTranslations('signin')
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

    useEffect(() => {
        if (sessionStatus === 'loading') return
        if (session?.user) return // already authenticated

        const tg = (window as any).Telegram?.WebApp
        if (!tg?.initData) return

        tg.ready()
        setStatus('loading')

        async function autoSignIn() {
            try {
                const res = await fetch('/api/auth/telegram/miniapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initData: tg.initData }),
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    console.error('[MiniApp] Auth failed:', err.error)
                    setStatus('error')
                    return
                }

                const { token } = await res.json()
                const result = await signIn('telegram', { verifyToken: token, redirect: false })
                if (result?.error) { setStatus('error'); return }
                // If a `next` return target is present (e.g. OAuth flow), go there; else reload.
                const next = new URLSearchParams(window.location.search).get('next')
                if (next && next.startsWith('/') && !next.startsWith('//')) {
                    window.location.replace(next)
                } else {
                    window.location.reload()
                }
            } catch {
                setStatus('error')
            }
        }

        autoSignIn()
    }, [session, sessionStatus])

    if (status === 'idle') return null

    if (status === 'loading') {
        return (
            <Callout.Root>
                <Callout.Icon><Spinner size="1" /></Callout.Icon>
                <Callout.Text>{t('miniAppSignIn')}</Callout.Text>
            </Callout.Root>
        )
    }

    return (
        <Callout.Root color="red">
            <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
            <Callout.Text>{t('errorTelegram')}</Callout.Text>
        </Callout.Root>
    )
}
