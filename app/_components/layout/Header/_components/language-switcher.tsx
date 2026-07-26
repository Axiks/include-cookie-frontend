'use client'

import { Button } from '@radix-ui/themes'
import { Languages } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { setUserLocale } from '@/i18n/locale'
import { locales, type Locale } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Only two languages — clicking toggles straight to the other one instead of a menu.
  function toggleLocale() {
    const next = locales.find((l) => l !== locale) ?? locale
    startTransition(async () => {
      await setUserLocale(next)
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      onClick={toggleLocale}
      disabled={isPending}
      aria-label="Switch language"
      style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s', gap: '6px' }}
    >
      <Languages size={16} />
      <span>{locale === 'uk' ? 'UA' : 'EN'}</span>
    </Button>
  )
}
