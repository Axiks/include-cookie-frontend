import { authClient } from '@/lib/auth-client'
import type { IChatMembershipGate, ChatMembershipGateConfig } from './telegram-auth.interface'

const ALLOWED_STATUSES = ['member', 'administrator', 'creator']

export class ChatMembershipGate implements IChatMembershipGate {
    constructor(private config: ChatMembershipGateConfig) {}

    async checkAccess(tgId: string | number): Promise<boolean> {
        if (!this.config.enabled || !this.config.chatId) return true

        try {
            const status = await authClient.getChatMember(this.config.chatId, String(tgId))
            return !!status && ALLOWED_STATUSES.includes(status)
        } catch (e) {
            console.error('[ChatGate] Membership check failed for tgId:', tgId, e)
            return false
        }
    }
}

// Singleton configured from env vars
// CHAT_GATE_ENABLED=true|false
// CHAT_GATE_CHAT_ID=-1001234567890
const _gate = new ChatMembershipGate({
    enabled: process.env.CHAT_GATE_ENABLED === 'true',
    chatId: process.env.CHAT_GATE_CHAT_ID ?? '',
})

export function getChatMembershipGate(): IChatMembershipGate {
    return _gate
}
