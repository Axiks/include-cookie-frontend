import { IGroupService, Group } from "@/lib/shared/tag-system/group/service/group.service.interface"
import { catalog } from "@/lib/catalog-client"
import { mapGroup, GroupDto } from "./dto-map"

const enc = encodeURIComponent
function ni(method: string): never {
  throw new Error(`RestGroupService.${method} not implemented`)
}

// pandc-side adapter implementing IGroupService over the Catalog REST API.
export default class RestGroupService implements IGroupService {
  async find(q?: string): Promise<Group[]> {
    const qs = q ? `?q=${enc(q)}` : ""
    const dtos = await catalog.getJson<GroupDto[]>(`/groups${qs}`)
    return dtos.map(mapGroup)
  }

  async getByUid(uid: string): Promise<Group | null> {
    const dto = await catalog.getJsonOrNull<GroupDto>(`/groups/${enc(uid)}`)
    return dto ? mapGroup(dto) : null
  }

  // --- not used by pandc via getCatalog() ---
  add(): Promise<Group> { return ni("add") }
  edit(): Promise<Group> { return ni("edit") }
  delete(): Promise<void> { return ni("delete") }
  link(): Promise<void> { return ni("link") }
  unlink(): Promise<void> { return ni("unlink") }
  setNameTranslation(): Promise<void> { return ni("setNameTranslation") }
}
