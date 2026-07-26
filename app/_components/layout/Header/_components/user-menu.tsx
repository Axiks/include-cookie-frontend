'use client'

import { DropdownMenu, Avatar, Button, Text } from '@radix-ui/themes'
import { ChevronDownIcon, ExitIcon, MagicWandIcon, PersonIcon } from '@radix-ui/react-icons'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setUserLocale } from '@/i18n/locale'
import type { Locale } from '@/i18n/routing'

type Props = {
  name: string | null
  image: string | null
  userId: string | null
  signOutAction: () => Promise<void>
}

export function UserMenu({ name, image, userId, signOutAction }: Props) {
  const locale = useLocale()
  const t = useTranslations('nav')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchLocale(value: string) {
    startTransition(async () => {
      await setUserLocale(value as Locale)
      router.refresh()
    })
  }

  const avatarSrc = image ?? undefined
  const fallback = name?.slice(0, 2) ?? '?'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          variant="ghost"
          radius="large"
          style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s', gap: '8px' }}
        >
          <Avatar radius="full" size="1" src={avatarSrc} fallback={fallback} />
          <Text size="2">{name}</Text>
          <ChevronDownIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end">
        <DropdownMenu.RadioGroup value={locale} onValueChange={switchLocale}>
          <DropdownMenu.RadioItem value="uk">UA — Українська</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="en">EN — English</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>

        <DropdownMenu.Separator />

        {userId && (
          <DropdownMenu.Item onSelect={() => router.push(`/user/${userId}`)}>
            <PersonIcon />
            {t('myProfile')}
          </DropdownMenu.Item>
        )}

        <DropdownMenu.Item onSelect={() => router.push('/configurator')}>
          <MagicWandIcon />
          {t('config')}
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item
          color="red"
          onSelect={() => startTransition(async () => { await signOutAction() })}
        >
          <ExitIcon />
          {t('signOut')}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
