'use client'

import { useEffect, useState } from 'react'

export default function HideInMiniApp({ children }: { children: React.ReactNode }) {
    const [isMiniApp, setIsMiniApp] = useState(false)

    useEffect(() => {
        setIsMiniApp(!!(window as any).Telegram?.WebApp?.initData)
    }, [])

    if (isMiniApp) return null
    return <>{children}</>
}
