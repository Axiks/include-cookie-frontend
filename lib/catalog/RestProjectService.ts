import {
  IProjectService,
  Project,
  WriteProject,
  EditProject,
  Contributor,
} from "@/lib/shared/project/project.service.interface"
import { Sort } from "@/lib/shared/_enums/sort-enum"
import Image from "@/lib/shared/cdn/_types/Image"
import { Link } from "@/lib/shared"
import type Tag from "@/lib/shared/tag-system/_types/Tag"
import { catalog } from "@/lib/catalog-client"
import { hydrateProjects, ProjectDto } from "./project-hydrate"

const enc = encodeURIComponent

// pandc-side adapter implementing IProjectService over the Catalog REST API.
// Reads map the sub-only contract DTO back to internal Projects (see hydrateProjects).
export default class RestProjectService implements IProjectService {
  // ---- reads ----
  async find(q?: string, sort?: Sort): Promise<Project[]> {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (sort === Sort.OLDEST) params.set("sort", "OLDEST")
    const qs = params.toString()
    const dtos = await catalog.getJson<ProjectDto[]>(`/api/projects${qs ? `?${qs}` : ""}`)
    return hydrateProjects(dtos)
  }

  async getById(id: string): Promise<Project | null> {
    const dto = await catalog.getJsonOrNull<ProjectDto>(`/projects/${enc(id)}`)
    if (!dto) return null
    return (await hydrateProjects([dto]))[0]
  }

  async getLastProjects(count?: number): Promise<Project[]> {
    const dtos = await catalog.getJson<ProjectDto[]>(`/api/projects`)
    return hydrateProjects(dtos.slice(0, count ?? 10))
  }

  async countAll(): Promise<number> {
    const dtos = await catalog.getJson<ProjectDto[]>(`/api/projects`)
    return dtos.length
  }

  // ---- writes (on-behalf sub injected by the client from the session) ----
  async add(writeProject: WriteProject): Promise<Project> {
    const dto = await catalog.postJson<ProjectDto>(`/api/projects`, {
      title: writeProject.title,
      description: writeProject.description ?? undefined,
      covers: writeProject.covers.map(c => ({ src: c.src })),
      tags: writeProject.tags.map(t => ({ uid: t.uid })),
      links: writeProject.links.map(l => ({ name: l.name, url: l.url })),
    })
    return (await hydrateProjects([dto]))[0]
  }

  async edit(id: string, editProject: EditProject): Promise<Project> {
    const dto = await catalog.patchJson<ProjectDto>(`/projects/${enc(id)}`, {
      title: editProject.title,
      description: editProject.description ?? undefined,
      links: editProject.links?.map(l => ({ name: l.name, url: l.url })),
    })
    return (await hydrateProjects([dto]))[0]
  }

  async delete(id: string): Promise<void> {
    await catalog.del(`/projects/${enc(id)}`)
  }

  async linkTag(id: string, tag: Tag): Promise<void> {
    await catalog.post(`/projects/${enc(id)}/tags/${enc(tag.uid)}`)
  }

  async unlinkTag(id: string, tag: Tag): Promise<void> {
    await catalog.del(`/projects/${enc(id)}/tags/${enc(tag.uid)}`)
  }

  async addHrefLink(id: string, link: Link): Promise<void> {
    await catalog.post(`/projects/${enc(id)}/links`, { name: link.name, url: link.url })
  }

  async removeHrefLink(id: string, linkId: string): Promise<void> {
    await catalog.del(`/projects/${enc(id)}/links/${enc(linkId)}`)
  }

  async addCover(id: string, image: Image & { kind?: string }): Promise<void> {
    await catalog.post(`/projects/${enc(id)}/covers`, { src: image.src, kind: image.kind ?? "cover" })
  }

  async setCover(_id: string, _image: Image | null): Promise<void> {
    throw new Error("setCover not implemented")
  }

  async removeCover(_id: string, _image: Image): Promise<void> {
    throw new Error("removeCover not implemented")
  }

  async addContributor(projectId: string, contributor: Contributor): Promise<void> {
    await catalog.post(`/projects/${enc(projectId)}/contributors`, {
      sub: contributor.userId,
      roleTags: contributor.roleTags?.map(t => ({ uid: t.uid })),
    })
  }

  async updateContributor(_projectId: string, _contributor: Contributor): Promise<void> {
    throw new Error("updateContributor not implemented")
  }

  async removeContributor(projectId: string, contributorSub: string): Promise<void> {
    await catalog.del(`/projects/${enc(projectId)}/contributors/${enc(contributorSub)}`)
  }
}
