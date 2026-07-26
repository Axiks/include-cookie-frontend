import ITagService, { WriteTag } from "@/lib/shared/tag-system/tag/service/tag.service.interface"
import Tag from "@/lib/shared/tag-system/_types/Tag"
import { catalog } from "@/lib/catalog-client"
import { mapTag, TagDto } from "./dto-map"

const enc = encodeURIComponent
function ni(method: string): never {
  throw new Error(`RestTagService.${method} not implemented`)
}

// pandc-side adapter implementing ITagService over the Catalog REST API. Only the
// methods pandc calls through getCatalog() are wired; the rest throw.
export default class RestTagService implements ITagService {
  async add(model: WriteTag): Promise<Tag> {
    const dto = await catalog.postJson<TagDto>(`/tags`, {
      name: model.name,
      description: model.description ?? undefined,
      isPrimary: model.isPrimary,
    })
    return mapTag(dto)
  }

  async getByUid(uid: string): Promise<Tag | null> {
    const dto = await catalog.getJsonOrNull<TagDto>(`/tags/${enc(uid)}`)
    return dto ? mapTag(dto) : null
  }

  async getByName(name: string): Promise<Tag | null> {
    const dto = await catalog.getJsonOrNull<TagDto>(`/tags/by-name?name=${enc(name)}`)
    return dto ? mapTag(dto) : null
  }

  async find(query?: string): Promise<Tag[]> {
    const qs = query ? `?q=${enc(query)}` : ""
    const dtos = await catalog.getJson<TagDto[]>(`/tags${qs}`)
    return dtos.map(mapTag)
  }

  // --- not used by pandc via getCatalog() ---
  delete(): Promise<void> { return ni("delete") }
  setIcon(): Promise<void> { return ni("setIcon") }
  removeIcon(): Promise<void> { return ni("removeIcon") }
  union(): Promise<Tag> { return ni("union") }
  addPseudonymName(): Promise<void> { return ni("addPseudonymName") }
  deletePseudonymName(): Promise<void> { return ni("deletePseudonymName") }
  addPseudonymDescription(): Promise<void> { return ni("addPseudonymDescription") }
  deletePseudonymDescription(): Promise<void> { return ni("deletePseudonymDescription") }
  linkLabel(): Promise<void> { return ni("linkLabel") }
  unlinkLabel(): Promise<void> { return ni("unlinkLabel") }
}
