import { describe, it, expect, beforeEach, vi } from "vitest"

// Scoped listing wrappers: catalog-client + UserService mocked like in
// rest-project.service.test.ts; community-scope mocked to drive the three filter states.
const catalogMock = vi.hoisted(() => ({ getJson: vi.fn() }))
vi.mock("@/lib/catalog-client", () => ({ catalog: catalogMock }))

const userMock = vi.hoisted(() => ({ getByKratosIdsLight: vi.fn().mockResolvedValue([]) }))
vi.mock("@/features/user/UserService", () => ({
  default: class { constructor() { return userMock as any } },
}))

const scopeMock = vi.hoisted(() => ({ getCommunityMemberSubs: vi.fn() }))
vi.mock("@/lib/community-scope", () => ({
  getCommunityMemberSubs: scopeMock.getCommunityMemberSubs,
  communityScopeEnabled: () => true,
}))

import {
  countScopedProjects,
  findScopedProjects,
  getLastScopedProjects,
} from "@/lib/catalog/community-projects"

const dto = (id: string, subs: string[]) => ({
  id,
  title: "Proj",
  synopsis: null,
  covers: [],
  tags: [],
  contributors: subs.map(sub => ({ sub })),
  links: [],
})

describe("community-projects — scoped listing wrappers", () => {
  beforeEach(() => {
    catalogMock.getJson.mockReset()
    scopeMock.getCommunityMemberSubs.mockReset()
    userMock.getByKratosIdsLight.mockResolvedValue([])
  })

  it("scope off (null): every project passes through", async () => {
    catalogMock.getJson.mockResolvedValue([dto("p1", ["a"]), dto("p2", ["b"])])
    scopeMock.getCommunityMemberSubs.mockResolvedValue(null)
    const projects = await findScopedProjects()
    expect(catalogMock.getJson).toHaveBeenCalledWith("/api/projects")
    expect(projects.map(p => p.id)).toEqual(["p1", "p2"])
  })

  it("scope on: keeps only projects with a member contributor", async () => {
    catalogMock.getJson.mockResolvedValue([
      dto("p1", ["member"]),
      dto("p2", ["outsider"]),
      dto("p3", ["outsider", "member"]),
    ])
    scopeMock.getCommunityMemberSubs.mockResolvedValue(new Set(["member"]))
    const projects = await findScopedProjects()
    expect(projects.map(p => p.id)).toEqual(["p1", "p3"])
  })

  it("fail-closed (empty set): empty list and zero count", async () => {
    catalogMock.getJson.mockResolvedValue([dto("p1", ["a"]), dto("p2", ["b"])])
    scopeMock.getCommunityMemberSubs.mockResolvedValue(new Set())
    expect(await findScopedProjects()).toEqual([])
    expect(await countScopedProjects()).toBe(0)
  })

  it("getLastScopedProjects filters BEFORE slicing (last N community projects)", async () => {
    catalogMock.getJson.mockResolvedValue([
      dto("p1", ["out"]),
      dto("p2", ["member"]),
      dto("p3", ["out"]),
      dto("p4", ["member"]),
    ])
    scopeMock.getCommunityMemberSubs.mockResolvedValue(new Set(["member"]))
    const projects = await getLastScopedProjects(2)
    expect(projects.map(p => p.id)).toEqual(["p2", "p4"])
  })

  it("countScopedProjects counts the filtered set", async () => {
    catalogMock.getJson.mockResolvedValue([
      dto("p1", ["member"]),
      dto("p2", ["out"]),
    ])
    scopeMock.getCommunityMemberSubs.mockResolvedValue(new Set(["member"]))
    expect(await countScopedProjects()).toBe(1)
  })
})
