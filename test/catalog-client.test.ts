import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest"

let catalog: typeof import("@/lib/catalog-client").catalog

beforeAll(async () => {
  process.env.CATALOG_API_URL = "http://catalog:3000"
  process.env.CATALOG_INTERNAL_KEY = "secret"
  vi.resetModules()
  catalog = (await import("@/lib/catalog-client")).catalog
})

beforeEach(() => {
  global.fetch = vi.fn() as any
})

const okJson = (data: any) => ({ ok: true, status: 200, json: async () => data })
const calls = () => (global.fetch as any).mock.calls

describe("catalog-client", () => {
  it("getJson issues a GET with the internal key and no on-behalf header", async () => {
    ;(global.fetch as any).mockResolvedValue(okJson([{ id: "p1" }]))
    const data = await catalog.getJson("/projects")
    expect(data).toEqual([{ id: "p1" }])
    const [url, opts] = calls()[0]
    expect(url).toBe("http://catalog:3000/projects")
    expect(opts.method).toBe("GET")
    expect(opts.headers["X-Internal-Key"]).toBe("secret")
    expect(opts.headers["X-On-Behalf-Of"]).toBeUndefined()
  })

  it("postJson serializes the body and never attaches X-On-Behalf-Of (login removed from this app)", async () => {
    ;(global.fetch as any).mockResolvedValue(okJson({ id: "new" }))
    await catalog.postJson("/projects", { title: "x" })
    const [, opts] = calls()[0]
    expect(opts.method).toBe("POST")
    expect(opts.headers["X-On-Behalf-Of"]).toBeUndefined()
    expect(JSON.parse(opts.body)).toEqual({ title: "x" })
  })

  it("getJsonOrNull returns null on 404", async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    expect(await catalog.getJsonOrNull("/projects/x")).toBeNull()
  })

  it("throws on a non-ok response (status surfaced)", async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: false, status: 500, text: async () => "boom" })
    await expect(catalog.getJson("/projects")).rejects.toThrow(/500/)
  })

  it("del() issues a DELETE", async () => {
    ;(global.fetch as any).mockResolvedValue({ ok: true, status: 204, text: async () => "" })
    await catalog.del("/projects/p1")
    expect(calls()[0][1].method).toBe("DELETE")
  })
})
