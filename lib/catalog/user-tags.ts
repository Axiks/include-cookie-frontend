import Tag from "@/lib/shared/tag-system/_types/Tag"
import { catalog } from "@/lib/catalog-client"
import { mapTag, TagDto } from "./dto-map"

const enc = encodeURIComponent

// User skill tags live in the graph (Catalog-owned). UserService no longer carries
// them, so pandc reads/writes them here via the Catalog REST API.

export async function getUserTags(sub: string | null | undefined): Promise<Tag[]> {
  if (!sub) return []
  const dtos = await catalog.getJson<TagDto[]>(`/users/${enc(sub)}/tags`)
  return dtos.map(mapTag)
}

// Replace the acting user's skill set. The Catalog gates this to auth.sub == sub,
// so the on-behalf sub (from the session) must equal `sub`.
export async function setUserTags(sub: string, tagUids: string[]): Promise<Tag[]> {
  const dtos = await catalog.putJson<TagDto[]>(
    `/users/${enc(sub)}/tags`,
    tagUids.map(uid => ({ uid }))
  )
  return dtos.map(mapTag)
}
