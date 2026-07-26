import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest"
import { freshWebDbUrl, resetWebDb } from "./_helpers/web-db"

let UserService: any
let prisma: any
let svc: any

beforeAll(async () => {
  process.env.DATABASE_URL = freshWebDbUrl()
  delete (global as any).prisma
  vi.resetModules()
  prisma = (await import("@/lib/prisma")).prisma
  UserService = (await import("@/features/user/UserService")).default
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  await resetWebDb(prisma)
  svc = new UserService()
})

const writeUser = (over: Partial<any> = {}) => ({
  tgId: "tg-1",
  nickname: "neko",
  about: "hello",
  avatars: [],
  links: [],
  tags: [],
  ...over,
})

describe("UserService — writes/reads against real SQLite", () => {
  it("add() persists a user (+ links) and returns the mapped User", async () => {
    const u = await svc.add(writeUser({ links: [{ name: "tg", url: "https://t.me/x" }] }))

    expect(u.id).toBeTruthy()
    expect(u.nickname).toBe("neko")
    expect(u.about).toBe("hello")
    expect(u.tgId).toBe("tg-1")
    expect(u.kratosId).toBeNull()
    expect(u.links).toHaveLength(1)
    expect(u.links[0].url).toBe("https://t.me/x")

    expect(await prisma.user.count()).toBe(1)
    expect(await prisma.userLink.count()).toBe(1)
  })

  it("getById() returns null for a missing user and reads back an existing one", async () => {
    expect(await svc.getById("nope")).toBeNull()
    const created = await svc.add(writeUser({ nickname: "readable" }))
    const got = await svc.getById(created.id)
    expect(got.nickname).toBe("readable")
  })

  it("edit() updates nickname and about", async () => {
    const created = await svc.add(writeUser())
    const edited = await svc.edit(created.id, { nickname: "renamed", about: "new bio" })
    expect(edited.nickname).toBe("renamed")
    const row = await prisma.user.findUnique({ where: { id: created.id } })
    expect(row.nickname).toBe("renamed")
    expect(row.about).toBe("new bio")
  })

  it("delete() removes the user", async () => {
    const created = await svc.add(writeUser())
    await svc.delete(created.id)
    expect(await prisma.user.count()).toBe(0)
  })

  it("addLink() then removeLink() persist and remove a link", async () => {
    const created = await svc.add(writeUser())
    await svc.addLink(created.id, { name: "site", url: "https://x.dev" })
    let links = await prisma.userLink.findMany({ where: { userId: created.id } })
    expect(links).toHaveLength(1)
    await svc.removeLink(created.id, links[0].id)
    links = await prisma.userLink.findMany({ where: { userId: created.id } })
    expect(links).toHaveLength(0)
  })

  it("addAvatar() stores an image and getById maps it under /cdn/avatars/", async () => {
    const created = await svc.add(writeUser())
    await svc.addAvatar(created.id, { src: "pic.png" })
    const got = await svc.getById(created.id)
    expect(got.avatars).toHaveLength(1)
    expect(got.avatars[0].src).toBe("/cdn/avatars/pic.png")
  })

  it("imageMapper passes through absolute http avatar urls unchanged", async () => {
    const created = await svc.add(writeUser())
    await svc.addAvatar(created.id, { src: "https://i.imgur.com/a.png" })
    const got = await svc.getById(created.id)
    expect(got.avatars[0].src).toBe("https://i.imgur.com/a.png")
  })

  it("addCover() stores a cover under /cdn/covers/", async () => {
    const created = await svc.add(writeUser())
    await svc.addCover(created.id, { src: "cov.png" })
    const got = await svc.getById(created.id)
    expect(got.covers).toHaveLength(1)
    expect(got.covers[0].src).toBe("/cdn/covers/cov.png")
  })

  it("getByKratosId() / getByKratosIdsLight() resolve users by sub", async () => {
    const created = await svc.add(writeUser({ nickname: "subbed" }))
    await prisma.user.update({ where: { id: created.id }, data: { kratosId: "sub-1" } })

    const one = await svc.getByKratosId("sub-1")
    expect(one.nickname).toBe("subbed")
    expect(one.kratosId).toBe("sub-1")

    const many = await svc.getByKratosIdsLight(["sub-1", "missing"])
    expect(many).toHaveLength(1)
    expect(many[0].kratosId).toBe("sub-1")
  })

  it("find(nickname) filters; getAll() returns everyone", async () => {
    await svc.add(writeUser({ nickname: "alpha", tgId: "a" }))
    await svc.add(writeUser({ nickname: "beta", tgId: "b" }))
    expect(await svc.find("alpha")).toHaveLength(1)
    expect(await svc.getAll()).toHaveLength(2)
  })
})
