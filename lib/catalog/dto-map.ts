// Shared mapping of Catalog REST DTOs -> internal domain objects, used by the
// pandc-side Rest* adapters.
import Tag from "@/lib/shared/tag-system/_types/Tag"
import { Group } from "@/lib/shared/tag-system/group/service/group.service.interface"
import { PopularityInCategory } from "@/lib/shared/statistic/statistic.service.interface"

export interface PseudonymDto {
  body: string
  lang?: string | null
  isPrimary?: boolean
}
export interface TagDto {
  uid: string
  name: PseudonymDto[]
  description?: PseudonymDto[]
}
export interface GroupDto {
  uid: string
  name: string
  description: string | null
  items: TagDto[]
}
export interface PopularityDto {
  items: { tag: TagDto; score: number }[]
}

export function mapTag(t: TagDto): Tag {
  return new Tag(t.uid, t.name, t.description ?? null)
}

export function mapGroup(g: GroupDto): Group {
  return {
    uid: g.uid,
    name: g.name,
    description: g.description,
    items: (g.items ?? []).map(t => ({ object: mapTag(t), index: undefined })),
    lables: [],
  }
}

export function mapPopularity(p: PopularityDto): PopularityInCategory {
  return { items: (p.items ?? []).map(i => ({ tag: mapTag(i.tag), score: i.score })) }
}
