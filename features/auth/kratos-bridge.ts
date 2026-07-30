import { authClient, type KratosIdentity, type KratosProfileLink } from "@/lib/auth-client"

export type { KratosIdentity, KratosProfileLink }

// Reads the full profile (nickname/about/links/avatar/cover) — the lumi-auth service is
// the sole owner of Kratos admin-API access now.
export async function fetchKratosIdentity(kratosId: string): Promise<KratosIdentity | null> {
    return authClient.getIdentity(kratosId)
}

// Write-through of the shared profile subset via the auth service.
export async function updateKratosTraits(
    kratosId: string,
    patch: {
        nickname?: string
        avatarUrl?: string | null
        coverUrl?: string | null
        about?: string | null
        links?: KratosProfileLink[]
    },
): Promise<void> {
    await authClient.updateTraits(kratosId, patch)
}
