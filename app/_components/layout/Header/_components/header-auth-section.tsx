'use client'

import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { UserMenu } from './user-menu'
import { LanguageSwitcher } from './language-switcher'
import { LinkNeko } from '@/app/_components/ui/link-neko'

export function HeaderAuthSection() {
  const { data: session, status } = useSession()
  const t = useTranslations('nav')

  async function handleSignOut() {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return null
  }

  if (session?.user) {
    return (
      <UserMenu
        name={session.user.name ?? null}
        image={session.user.image ?? null}
        userId={session.user.id ?? null}
        signOutAction={handleSignOut}
      />
    )
  }

  return (
    <>
      <LanguageSwitcher />
      <LinkNeko href="/signin" name={t('signIn')} />
    </>
  )
}
