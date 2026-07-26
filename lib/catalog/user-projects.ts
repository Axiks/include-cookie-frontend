import { Project } from "@/lib/shared/project/project.service.interface"
import { catalog } from "@/lib/catalog-client"
import { hydrateProjects, ProjectDto } from "./project-hydrate"

const enc = encodeURIComponent

// Projects a user contributes to — via the Catalog (GET /projects?ownerSub=), replacing
// the old local UserService.getProjects (which read the project graph directly).
export async function getUserProjects(sub: string | null | undefined): Promise<Project[]> {
  if (!sub) return []
  const dtos = await catalog.getJson<ProjectDto[]>(`/api/projects?ownerSub=${enc(sub)}`)
  return hydrateProjects(dtos)
}
