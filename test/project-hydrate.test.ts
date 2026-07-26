import { describe, it, expect, beforeEach, vi } from "vitest"

// project-hydrate news up a UserService to resolve contributor display by sub.
const userMock = vi.hoisted(() => ({ getByKratosIdsLight: vi.fn() }))
vi.mock("@/features/user/UserService", () => ({
  default: class { constructor() { return userMock as any } },
}))

import { hydrateProjects } from "@/lib/catalog/project-hydrate"

describe("hydrateProjects — Catalog DTO → internal Project", () => {
  beforeEach(() => userMock.getByKratosIdsLight.mockReset())

  it("maps the DTO and hydrates contributor nickname/avatar by sub", async () => {
    userMock.getByKratosIdsLight.mockResolvedValue([
      { kratosId: "sub-1", nickname: "Neko", avatars: [{ src: "/cdn/avatars/a.png" }] },
    ])
    const dtos = [
      {
        id: "p1",
        title: "Proj",
        synopsis: "s",
        covers: [{ src: "c.png" }],
        tags: [{ uid: "t1", name: [{ body: "ts" }] }],
        contributors: [{ sub: "sub-1", roleTags: [{ uid: "r1", name: [{ body: "owner" }] }] }],
        links: [{ id: "l1", name: "site", url: "https://x" }],
      },
    ]

    const [p] = await hydrateProjects(dtos as any)

    expect(p.id).toBe("p1")
    expect(p.title).toBe("Proj")
    expect(p.synopsis).toBe("s")
    expect(p.covers).toEqual([{ src: "c.png" }])
    expect(p.tags[0].uid).toBe("t1")
    expect(p.contributor[0].userId).toBe("sub-1")
    expect(p.contributor[0].nickname).toBe("Neko")
    expect(p.contributor[0].avatar).toEqual({ src: "/cdn/avatars/a.png" })
    expect(p.links).toEqual([{ id: "l1", name: "site", url: "https://x" }])
    expect(userMock.getByKratosIdsLight).toHaveBeenCalledWith(["sub-1"])
  })

  it("leaves display blank for a sub not present in the local cache", async () => {
    userMock.getByKratosIdsLight.mockResolvedValue([])
    const dtos = [
      { id: "p1", title: "P", synopsis: null, covers: [], tags: [], contributors: [{ sub: "ghost" }], links: [] },
    ]
    const [p] = await hydrateProjects(dtos as any)
    expect(p.contributor[0]).toMatchObject({ userId: "ghost", nickname: "" })
    expect(p.contributor[0].avatar).toBeUndefined()
  })

  it("does not query users when there are no contributors", async () => {
    const dtos = [
      { id: "p1", title: "P", synopsis: null, covers: [], tags: [], contributors: [], links: [] },
    ]
    const [p] = await hydrateProjects(dtos as any)
    expect(p.contributor).toEqual([])
    expect(userMock.getByKratosIdsLight).not.toHaveBeenCalled()
  })
})
