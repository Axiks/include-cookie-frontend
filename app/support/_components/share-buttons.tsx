'use client'

import { Button, Flex } from '@radix-ui/themes'
import { Send, MessageCircle, Twitter, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function ShareButtons() {
  const t = useTranslations('support')
  const [copied, setCopied] = useState(false)

  function shareUrl() {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }

  function openShare(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function shareTelegram() {
    const url = encodeURIComponent(shareUrl())
    const text = encodeURIComponent(t('shareText'))
    openShare(`https://t.me/share/url?url=${url}&text=${text}`)
  }

  function shareTwitter() {
    const url = encodeURIComponent(shareUrl())
    const text = encodeURIComponent(t('shareText'))
    openShare(`https://twitter.com/intent/tweet?url=${url}&text=${text}`)
  }

  // Discord has no web share intent — copy the link so it can be pasted into any channel.
  async function shareDiscord() {
    try {
      await navigator.clipboard.writeText(`${t('shareText')} ${shareUrl()}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      openShare('https://discord.gg/6Q6C6gBc')
    }
  }

  return (
    <Flex gap="2" wrap="wrap" align="center">
      <Button variant="soft" onClick={shareTelegram} style={{ gap: '6px' }}>
        <Send size={16} /> Telegram
      </Button>
      <Button variant="soft" onClick={shareDiscord} style={{ gap: '6px' }}>
        {copied ? <Check size={16} /> : <MessageCircle size={16} />}
        {copied ? t('shareCopied') : 'Discord'}
      </Button>
      <Button variant="soft" onClick={shareTwitter} style={{ gap: '6px' }}>
        <Twitter size={16} /> Twitter
      </Button>
    </Flex>
  )
}
