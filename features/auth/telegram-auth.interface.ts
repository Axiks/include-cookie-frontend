/** Payload received from Telegram Login Widget (passed as query params to data-auth-url) */
export interface TelegramWidgetPayload {
    id: string
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: string
    hash: string
}

/** User object from Telegram Mini App initDataUnsafe.user */
export interface TelegramMiniAppUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    language_code?: string
    is_premium?: boolean
}

/** Unified verified identity — result of successful Telegram auth verification */
export interface TelegramVerifiedIdentity {
    tgId: string
    username?: string
    /** first_name (+ last_name) */
    displayName: string
    photoUrl?: string
}

/** Interface for restricting access based on Telegram chat membership */
export interface IChatMembershipGate {
    /**
     * Returns true if the user is allowed to login/register.
     * Always returns true when the gate is disabled.
     */
    checkAccess(tgId: string | number): Promise<boolean>
}

export interface ChatMembershipGateConfig {
    /** false = gate is disabled, everyone can login */
    enabled: boolean
    /** Telegram chat/channel/group ID, e.g. "-1001234567890" */
    chatId: string
}
