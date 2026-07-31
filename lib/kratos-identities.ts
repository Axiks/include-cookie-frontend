import { authClient, type WebUserSummary } from "@/lib/auth-client"

export type { WebUserSummary }

// Batch profile lookup by Kratos sub — feeds lib/catalog/project-hydrate.ts, the hot path
// behind every project-card render app-wide. lumi-auth is optional here: unset config or an
// unreachable service degrades to contributors without nickname/avatar instead of breaking
// project rendering (same pattern as the Catalog/Bot integrations).
export async function getProfilesByKratosIds(subs: string[]): Promise<Map<string, WebUserSummary>> {
    if (subs.length === 0) return new Map()
    if (!process.env.AUTH_SERVICE_URL) {
        console.warn("[kratos-identities] AUTH_SERVICE_URL not set — rendering contributors without profile info")
        return new Map()
    }
    try {
        const result = await authClient.batchProfiles(subs)
        return new Map(Object.entries(result))
    } catch (e) {
        console.warn("[kratos-identities] lumi-auth unavailable, rendering contributors without profile info:", (e as Error).message)
        return new Map()
    }
}
