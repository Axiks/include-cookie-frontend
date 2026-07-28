import { unstable_cache } from "next/cache"
import { authClient, type WebUserSummary } from "@/lib/auth-client"

export type { WebUserSummary }

// Cache tag for the identity list/search calls. Invalidate with revalidateTag(KRATOS_IDENTITIES_TAG)
// whenever an identity's traits change (profile edit) or one is created/deleted.
export const KRATOS_IDENTITIES_TAG = "kratos:identities"

// Finds a Kratos identity by nickname trait (case-insensitive exact match).
export async function findIdentityByNickname(nickname: string): Promise<{ kratosId: string; tgId: string } | null> {
    return authClient.findByNickname(nickname)
}

// All users, for the user directory (/user). Cached 60s via the auth-service — this call
// itself is uncached network I/O, wrapped here the same way the direct-Kratos version was.
const listUsersCached = unstable_cache(
    async () => authClient.listOrSearch(),
    ["web-kratos-identities-list"],
    { tags: [KRATOS_IDENTITIES_TAG], revalidate: 60 },
)
export async function listUsers(): Promise<WebUserSummary[]> {
    return listUsersCached()
}

// Case-insensitive substring match on nickname — feeds the project-member autocomplete.
export async function searchUsersByNickname(query: string): Promise<WebUserSummary[]> {
    const q = query.trim()
    if (!q) return []
    return authClient.listOrSearch(q)
}

// Batch profile lookup by Kratos sub — feeds lib/catalog/project-hydrate.ts, the hot path behind
// every project-card render app-wide.
export async function getProfilesByKratosIds(subs: string[]): Promise<Map<string, WebUserSummary>> {
    if (subs.length === 0) return new Map()
    const result = await authClient.batchProfiles(subs)
    return new Map(Object.entries(result))
}
