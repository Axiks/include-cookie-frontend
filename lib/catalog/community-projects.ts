import { Project } from "@/lib/shared/project/project.service.interface"
import { Sort } from "@/lib/shared/_enums/sort-enum"
import { catalog } from "@/lib/catalog-client"
import { getCommunityMemberSubs } from "@/lib/community-scope"
import { hydrateProjects, ProjectDto } from "./project-hydrate"

// Community-scoped variants of the RestProjectService read paths, used by the public
// listings (/project, home recommendations, header counter). The filter runs at the DTO
// level so counting never pays contributor hydration and only visible projects hydrate.
// Writes and getById stay on IProjectService (RestProjectService) untouched.

async function scopedProjectDtos(q?: string, sort?: Sort): Promise<ProjectDto[]> {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (sort === Sort.OLDEST) params.set("sort", "OLDEST")
  const qs = params.toString()
  const dtos = await catalog.getJson<ProjectDto[]>(`/api/projects${qs ? `?${qs}` : ""}`)
  const subs = await getCommunityMemberSubs()
  if (subs === null) return dtos
  return dtos.filter(d => (d.contributors ?? []).some(c => subs.has(c.sub)))
}

export async function findScopedProjects(q?: string, sort?: Sort): Promise<Project[]> {
  return hydrateProjects(await scopedProjectDtos(q, sort))
}

// Filter BEFORE slice: "the last N community projects", not "community projects among
// the last N". Mirrors RestProjectService.getLastProjects otherwise (count ?? 10).
export async function getLastScopedProjects(count?: number): Promise<Project[]> {
  const dtos = await scopedProjectDtos()
  return hydrateProjects(dtos.slice(0, count ?? 10))
}

export async function countScopedProjects(): Promise<number> {
  return (await scopedProjectDtos()).length
}
