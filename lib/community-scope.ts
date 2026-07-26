// Community scope for the public project listings. When COMMUNITY_TG_CHAT_ID is set,
// every listing shows only projects with at least one contributor who is a member of
// that Telegram community (membership lives in the bot service, apps/bot).
//
// Unlike the catalog's best-effort bot client (apps/catalog/lib/bot-api.ts, fail-open),
// this FAILS CLOSED: a bot outage or an unregistered chat hides everything rather than
// leaking non-community projects onto the community's site.
const CHAT_ID = process.env.COMMUNITY_TG_CHAT_ID?.trim() ?? ""
const BOT_API_URL = process.env.BOT_API_URL?.replace(/\/$/, "") ?? ""
const BOT_INTERNAL_KEY = process.env.BOT_INTERNAL_KEY ?? ""

export function communityScopeEnabled(): boolean {
  return CHAT_ID !== ""
}

// null = filtering off (COMMUNITY_TG_CHAT_ID unset). Set = active filter; an EMPTY set
// means fail-closed (bot unreachable / chat not registered) — callers show nothing.
export async function getCommunityMemberSubs(): Promise<Set<string> | null> {
  if (!communityScopeEnabled()) return null
  if (!BOT_API_URL || !BOT_INTERNAL_KEY) {
    console.warn(
      "[community-scope] COMMUNITY_TG_CHAT_ID is set but BOT_API_URL/BOT_INTERNAL_KEY are not — hiding all projects",
    )
    return new Set()
  }
  try {
    const res = await fetch(
      `${BOT_API_URL}/communities/by-chat/${encodeURIComponent(CHAT_ID)}/members`,
      {
        headers: { "x-internal-key": BOT_INTERNAL_KEY },
        // Listings render often; membership changes rarely — cache the member set for 5 min.
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) {
      console.warn(`[community-scope] bot returned ${res.status} for chat ${CHAT_ID} — hiding all projects`)
      return new Set()
    }
    const members = (await res.json()) as { sub: string }[]
    return new Set(members.map(x => x.sub).filter(Boolean))
  } catch (e) {
    console.warn("[community-scope] bot unreachable — hiding all projects:", e)
    return new Set()
  }
}
