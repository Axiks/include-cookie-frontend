import { kratosAdmin } from "@/lib/kratos"
import { prisma } from "@/lib/prisma"
import { absoluteAvatarUrl } from "@/lib/oauth/first-party"

export async function findOrCreateKratosIdentity(params: {
    tgId: string
    nickname: string
    avatarUrl?: string | null
}): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { tgId: params.tgId },
        select: { id: true, kratosId: true }
    })

    if (user?.kratosId) return user.kratosId

    const { data: identity } = await kratosAdmin.createIdentity({
        createIdentityBody: {
            schema_id: "default",
            traits: {
                telegram_id: params.tgId,
                nickname: params.nickname,
                avatar_url: absoluteAvatarUrl(params.avatarUrl),
            }
        }
    })

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { kratosId: identity.id }
        })
    }

    return identity.id
}

// Write-through of the shared profile subset to Kratos (the canonical store for
// cross-service claims). Merges traits so telegram_id is never clobbered.
export async function updateKratosTraits(
    kratosId: string,
    patch: { nickname?: string; avatarUrl?: string | null; about?: string | null }
): Promise<void> {
    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosId })
    const traits = { ...(identity.traits as Record<string, unknown>) }

    if (patch.nickname !== undefined) traits.nickname = patch.nickname
    if (patch.avatarUrl !== undefined) traits.avatar_url = absoluteAvatarUrl(patch.avatarUrl)
    if (patch.about !== undefined) traits.about = patch.about ?? undefined

    await kratosAdmin.updateIdentity({
        id: kratosId,
        updateIdentityBody: {
            schema_id: identity.schema_id,
            state: (identity.state ?? "active") as "active" | "inactive",
            traits,
        },
    })
}

export interface KratosTraits {
    telegram_id?: string
    nickname?: string
    avatar_url?: string
    about?: string
}

// Reads the canonical shared profile traits from Kratos.
export async function fetchKratosTraits(kratosId: string): Promise<KratosTraits> {
    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosId })
    return (identity.traits ?? {}) as KratosTraits
}

// Resolves the stable Kratos identity id for a local user. If the user has no
// kratosId yet (e.g. a past sync failure), it is created/backfilled here so the
// OAuth subject and the canonical profile store always exist.
export async function resolveKratosId(userId: string): Promise<string | null> {
    const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { kratosId: true, tgId: true, nickname: true },
    })
    if (u?.kratosId) return u.kratosId
    if (u?.tgId) {
        try {
            return await findOrCreateKratosIdentity({
                tgId: u.tgId,
                nickname: u.nickname ?? u.tgId,
                avatarUrl: null,
            })
        } catch (e) {
            console.error("[kratos-bridge] resolveKratosId backfill failed:", e)
            return null
        }
    }
    return null
}

// Reverse-sync: refresh the local cache from Kratos (the canonical store) so the
// projection stays authoritative. Only plain text fields (nickname, about) are
// pulled; the avatar stays one-way (pandc /cdn owns the bytes, Kratos the URL).
// Non-fatal — a Kratos hiccup must not break login.
export async function reconcileLocalProfile(userId: string, kratosId: string): Promise<void> {
    try {
        const traits = await fetchKratosTraits(kratosId)
        const data: { nickname?: string; about?: string } = {}
        if (traits.nickname !== undefined) data.nickname = traits.nickname
        if (traits.about !== undefined) data.about = traits.about
        if (Object.keys(data).length === 0) return
        await prisma.user.update({ where: { id: userId }, data })
    } catch (e) {
        console.warn("[kratos-bridge] reconcileLocalProfile failed (non-critical):", (e as Error)?.message)
    }
}
