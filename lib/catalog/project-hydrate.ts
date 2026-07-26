import { Project, Contributor } from "@/lib/shared/project/project.service.interface"
import { Link } from "@/lib/shared"
import UserService from "@/features/user/UserService"
import { mapTag, TagDto } from "./dto-map"

// ---- Catalog REST project DTOs (the subset we consume) ----
export interface ContributorDto {
  sub: string
  roleTags?: TagDto[]
}
export interface ProjectDto {
  id: string
  title: string
  synopsis: string | null
  body?: string | null
  covers: { src: string }[]
  tags: TagDto[]
  contributors: ContributorDto[]
  links: { id?: string; name: string; url: string }[]
}

// Maps the sub-only contract DTOs to internal Projects, HYDRATING contributor display
// (nickname/avatar) from the local user cache by kratosId in one batched lookup, so the
// existing pandc UI is unchanged. Shared by RestProjectService and getUserProjects.
export async function hydrateProjects(dtos: ProjectDto[]): Promise<Project[]> {
  const userService = new UserService()
  const subs = [...new Set(dtos.flatMap(d => d.contributors.map(c => c.sub)))].filter(Boolean)
  const users = subs.length ? await userService.getByKratosIdsLight(subs) : []
  const bySub = new Map(users.filter(u => u.kratosId).map(u => [u.kratosId!, u]))

  return dtos.map(d => ({
    id: d.id,
    title: d.title,
    synopsis: d.synopsis ?? null,
    body: d.body ?? null,
    covers: (d.covers ?? []).map(c => ({ src: c.src })),
    tags: (d.tags ?? []).map(mapTag),
    contributor: (d.contributors ?? []).map(c => {
      const u = bySub.get(c.sub)
      const contr: Contributor = {
        userId: c.sub,
        nickname: u?.nickname ?? "",
        avatar: u?.avatars?.[0],
        roleTags: c.roleTags?.map(mapTag),
      }
      return contr
    }),
    links: (d.links ?? []).map(l => ({ id: l.id, name: l.name, url: l.url }) as Link),
  }))
}
