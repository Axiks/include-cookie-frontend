import { describe, it, expect } from "vitest"
import { mapTag, mapGroup, mapPopularity } from "@/lib/catalog/dto-map"

describe("catalog dto-map (REST DTO → domain)", () => {
  it("mapTag builds a Tag instance with name/description", () => {
    const t = mapTag({ uid: "u1", name: [{ body: "TypeScript" }], description: [{ body: "lang" }] })
    expect(t.uid).toBe("u1")
    expect(t.getMainName()).toBe("TypeScript")
    expect(t.description).toEqual([{ body: "lang" }])
  })

  it("mapTag tolerates a missing description (→ null)", () => {
    const t = mapTag({ uid: "u1", name: [{ body: "X" }] })
    expect(t.description).toBeNull()
  })

  it("mapGroup maps items to {object: Tag} and keeps meta", () => {
    const g = mapGroup({
      uid: "g1",
      name: "Languages",
      description: "desc",
      items: [{ uid: "t1", name: [{ body: "ts" }] }],
    })
    expect(g.uid).toBe("g1")
    expect(g.name).toBe("Languages")
    expect(g.description).toBe("desc")
    expect(g.items).toHaveLength(1)
    expect(g.items[0].object.uid).toBe("t1")
  })

  it("mapGroup tolerates missing items", () => {
    const g = mapGroup({ uid: "g1", name: "n", description: null, items: undefined as any })
    expect(g.items).toEqual([])
  })

  it("mapPopularity maps items to {tag: Tag, score}", () => {
    const p = mapPopularity({
      items: [{ tag: { uid: "t1", name: [{ body: "ts" }] }, score: 7 }],
    })
    expect(p.items).toHaveLength(1)
    expect(p.items[0].tag.uid).toBe("t1")
    expect(p.items[0].score).toBe(7)
  })
})
