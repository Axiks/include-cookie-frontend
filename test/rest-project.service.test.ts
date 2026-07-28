import { describe, it, expect, beforeEach, vi } from "vitest"

// RestProjectService is a pure REST adapter over catalog-client; hydration uses kratos-identities.
const catalogMock = vi.hoisted(() => ({
  getJson: vi.fn(),
  getJsonOrNull: vi.fn(),
  postJson: vi.fn(),
  patchJson: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}))
vi.mock("@/lib/catalog-client", () => ({ catalog: catalogMock }))

const kratosMock = vi.hoisted(() => ({ getProfilesByKratosIds: vi.fn().mockResolvedValue(new Map()) }))
vi.mock("@/lib/kratos-identities", () => kratosMock)

import RestProjectService from "@/lib/catalog/RestProjectService"

const dto = (over: Partial<any> = {}) => ({
  id: "p1",
  title: "Proj",
  synopsis: null,
  covers: [],
  tags: [],
  contributors: [],
  links: [],
  ...over,
})

describe("RestProjectService — REST adapter", () => {
  let svc: RestProjectService
  beforeEach(() => {
    Object.values(catalogMock).forEach(f => f.mockReset())
    kratosMock.getProfilesByKratosIds.mockResolvedValue(new Map())
    svc = new RestProjectService()
  })

  it("find() GETs /api/projects and hydrates the DTOs", async () => {
    catalogMock.getJson.mockResolvedValue([dto({ id: "p1" }), dto({ id: "p2" })])
    const projects = await svc.find()
    expect(catalogMock.getJson).toHaveBeenCalledWith("/api/projects")
    expect(projects.map(p => p.id)).toEqual(["p1", "p2"])
  })

  it("getById() returns null when the catalog has no such project", async () => {
    catalogMock.getJsonOrNull.mockResolvedValue(null)
    expect(await svc.getById("missing")).toBeNull()
    expect(catalogMock.getJsonOrNull).toHaveBeenCalledWith("/projects/missing")
  })

  it("add() POSTs a sub-only contract body", async () => {
    catalogMock.postJson.mockResolvedValue(dto({ id: "new" }))
    await svc.add({
      title: "T",
      description: "d",
      covers: [{ src: "c.png" }],
      tags: [{ uid: "t1" }] as any,
      contributors: [],
      links: [{ name: "site", url: "https://x" }] as any,
    } as any)
    expect(catalogMock.postJson).toHaveBeenCalledWith("/api/projects", {
      title: "T",
      description: "d",
      covers: [{ src: "c.png" }],
      tags: [{ uid: "t1" }],
      links: [{ name: "site", url: "https://x" }],
    })
  })

  it("delete() DELETEs the project", async () => {
    await svc.delete("p1")
    expect(catalogMock.del).toHaveBeenCalledWith("/projects/p1")
  })

  it("linkTag() POSTs to the project's tags endpoint", async () => {
    await svc.linkTag("p1", { uid: "t9" } as any)
    expect(catalogMock.post).toHaveBeenCalledWith("/projects/p1/tags/t9")
  })
})
