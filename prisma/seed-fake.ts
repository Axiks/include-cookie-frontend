import { PrismaClient } from "../.generated/prisma"
import { faker } from "@faker-js/faker"
import { randomUUID } from "crypto"
import GroupService from "../features/tag-system/group/service/group.service"
import ItemRepository from "../features/tag-system/item/repository/item.repository"
import Tag from "../features/tag-system/_types/Tag"
import { saveFile, deleteFile } from "@/lib/shared/cdn/file.service"
import { TagService } from "../features/tag-system/tag/service/tag.service"

const prisma = new PrismaClient()
const FAKE_PREFIX = "FAKE_"
const USERS_COUNT = 25
const PROJECTS_COUNT = 12

async function downloadImage(url: string, subCatalog: string, retries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      const filename = randomUUID() + ".png"
      await saveFile(buffer, subCatalog, filename)
      return filename
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * attempt))
      } else {
        process.stderr.write(`  [warn] Failed to download image after ${retries} attempts: ${url}\n`)
        return null
      }
    }
  }
  return null
}

async function getTags(groupName: string): Promise<Tag[]> {
  const groupService = new GroupService()
  const groups = await groupService.find(groupName)
  if (groups.length === 0) return []
  return groups[0].items.map(i => i.object as Tag)
}

async function seedUsers(langTags: Tag[]) {
  const itemRepo = new ItemRepository()
  const created: { id: string; nickname: string | null; dgraphUid: string }[] = []

  console.log(`\nCreating ${USERS_COUNT} users...`)

  for (let i = 0; i < USERS_COUNT; i++) {
    const nickname = faker.internet.username().slice(0, 32)
    const avatarUrl = `https://api.dicebear.com/9.x/lorelei/png?seed=${encodeURIComponent(nickname)}&size=128`

    const user = await prisma.user.create({
      data: {
        nickname,
        about: faker.lorem.paragraph({ min: 1, max: 2 }),
        tgId: FAKE_PREFIX + faker.string.numeric(8),
      },
    })

    const avatarFilename = await downloadImage(avatarUrl, "avatars")
    if (avatarFilename) {
      const avatarImage = await prisma.image.create({ data: { src: avatarFilename } })
      await prisma.userAvatar.create({ data: { userId: user.id, imageId: avatarImage.id } })
    }

    const tagUids = langTags.length > 0
      ? faker.helpers
          .arrayElements(langTags, faker.number.int({ min: 1, max: 5 }))
          .map(t => t.uid)
      : []

    const userItem = await itemRepo.create({ objectId: user.id, objectType: "User", tagsUid: tagUids })

    if (faker.datatype.boolean(0.6)) {
      await prisma.userLink.create({
        data: { userId: user.id, name: "GitHub", url: `https://github.com/${nickname}` },
      })
    }

    created.push({ id: user.id, nickname: user.nickname, dgraphUid: userItem.uid })
    process.stdout.write(`  [${i + 1}/${USERS_COUNT}] ${nickname}\n`)
  }

  return created
}

async function seedProjects(
  users: { id: string; nickname: string | null; dgraphUid: string }[],
  devStageTags: Tag[],
  langTags: Tag[],
  openForColabTagUid: string | null,
) {
  const itemRepo = new ItemRepository()
  const fallbackStage = "idea"

  console.log(`\nCreating ${PROJECTS_COUNT} projects...`)

  for (let i = 0; i < PROJECTS_COUNT; i++) {
    const suffix = faker.helpers.arrayElement(["App", "Bot", "Tool", "Platform", "Hub", "API", "CLI"])
    const title = faker.company.buzzAdjective() + " " + suffix

    const devStageTag = devStageTags.length > 0
      ? faker.helpers.arrayElement(devStageTags)
      : null

    const isOpenForCollaboration = faker.datatype.boolean(0.35)

    const coverSeed = faker.string.alphanumeric(10)
    const coverUrl = `https://picsum.photos/seed/${coverSeed}/1280/400`
    const coverFilename = await downloadImage(coverUrl, "covers")

    const project = await prisma.project.create({
      data: {
        title,
        synopsis: faker.lorem.paragraph({ min: 1, max: 3 }),
        developmentStage: devStageTag?.uid ?? fallbackStage,
        covers: coverFilename,
      },
    })

    const projectItem = await itemRepo.create({ objectId: project.id, objectType: "Project" })

    // Dev stage tag
    if (devStageTag) {
      await itemRepo.linkTag(projectItem.uid, devStageTag.uid)
    }

    // Random language/tech tags (1–4)
    if (langTags.length > 0) {
      const pickedLangs = faker.helpers.arrayElements(langTags, faker.number.int({ min: 1, max: 4 }))
      for (const tag of pickedLangs) {
        await itemRepo.linkTag(projectItem.uid, tag.uid)
      }
    }

    // Open for collaboration tag
    if (isOpenForCollaboration && openForColabTagUid) {
      await itemRepo.linkTag(projectItem.uid, openForColabTagUid)
    }

    // Pick 1-2 fake users as contributors (same user can own multiple projects)
    const ownerCount = faker.number.int({ min: 1, max: 2 })
    const contributors = faker.helpers.arrayElements(users, ownerCount)
    for (const user of contributors) {
      await prisma.userProject
        .create({ data: { userId: user.id, projectId: project.id, roles: "owner" } })
        .catch(() => {})
      await itemRepo.linkItem(projectItem.uid, user.dgraphUid, { role: "owner" })
    }

    if (faker.datatype.boolean(0.65)) {
      await prisma.userLink.create({
        data: {
          projectId: project.id,
          name: "GitHub",
          url: `https://github.com/example/${title.toLowerCase().replace(/\s+/g, "-")}`,
        },
      })
    }

    process.stdout.write(`  [${i + 1}/${PROJECTS_COUNT}] ${title}\n`)
  }
}

async function cleanFakeData() {
  console.log("Cleaning up fake data...")

  const fakeUsers = await prisma.user.findMany({
    where: { tgId: { startsWith: FAKE_PREFIX } },
    select: { id: true },
  })
  const fakeUserIds = fakeUsers.map(u => u.id)

  // Find projects where ALL contributors are fake users (safe to delete)
  const projectsWithFakeUsers = await prisma.userProject.findMany({
    where: { userId: { in: fakeUserIds } },
    select: { projectId: true },
  })
  const candidateProjectIds = [...new Set(projectsWithFakeUsers.map(p => p.projectId))]

  const projectsWithRealUsers = await prisma.userProject.findMany({
    where: { projectId: { in: candidateProjectIds }, userId: { notIn: fakeUserIds } },
    select: { projectId: true },
  })
  const realUserProjectIds = new Set(projectsWithRealUsers.map(p => p.projectId))
  const fakeOnlyProjectIds = candidateProjectIds.filter(id => !realUserProjectIds.has(id))

  const fakeProjects = fakeOnlyProjectIds.length > 0
    ? await prisma.project.findMany({ where: { id: { in: fakeOnlyProjectIds } }, select: { id: true, covers: true } })
    : []

  // Delete fake-only projects
  if (fakeProjects.length > 0) {
    await prisma.userLink.deleteMany({ where: { projectId: { in: fakeOnlyProjectIds } } })
    await prisma.userProject.deleteMany({ where: { projectId: { in: fakeOnlyProjectIds } } })
    await prisma.project.deleteMany({ where: { id: { in: fakeOnlyProjectIds } } })
    await deleteLocalFiles(
      fakeProjects.map(p => p.covers).filter((c): c is string => c != null && !c.startsWith('http')),
      "covers"
    )
  }

  if (fakeUserIds.length > 0) {
    await prisma.userLink.deleteMany({ where: { userId: { in: fakeUserIds } } })
    await prisma.userProject.deleteMany({ where: { userId: { in: fakeUserIds } } })
    const avatarRecords = await prisma.userAvatar.findMany({
      where: { userId: { in: fakeUserIds } },
      select: { imageId: true },
    })
    const avatarImageIds = avatarRecords.map(a => a.imageId)
    const avatarImages = avatarImageIds.length > 0
      ? await prisma.image.findMany({ where: { id: { in: avatarImageIds } }, select: { src: true } })
      : []
    await prisma.userAvatar.deleteMany({ where: { userId: { in: fakeUserIds } } })
    if (avatarImageIds.length > 0) {
      await prisma.image.deleteMany({ where: { id: { in: avatarImageIds } } })
    }
    await deleteLocalFiles(avatarImages.map(i => i.src), "avatars")
  }

  await prisma.user.deleteMany({ where: { tgId: { startsWith: FAKE_PREFIX } } })

  console.log(`Deleted ${fakeUsers.length} fake users and ${fakeProjects.length} fake-only projects.`)
  console.log("Note: DGraph items are not removed. Re-run `npm run dgraph:init` to reset DGraph.")
}

async function deleteLocalFiles(filenames: string[], subCatalog: string) {
  for (const filename of filenames) {
    await deleteFile(subCatalog, filename).catch(() => {})
  }
}

async function main() {
  if (process.argv.includes("--clean")) {
    await cleanFakeData()
    return
  }

  console.log("Fetching DGraph tags...")
  const tagService = new TagService()
  const [langTags, devStageTags, openForColabTag] = await Promise.all([
    getTags("programming language"),
    getTags("development status"),
    tagService.getByName("Requires maintance"),
  ])
  console.log(`  programming language: ${langTags.length} tags`)
  console.log(`  development status:   ${devStageTags.length} tags`)
  console.log(`  open for colab tag:   ${openForColabTag?.uid ?? "not found"}`)

  const users = await seedUsers(langTags)
  await seedProjects(users, devStageTags, langTags, openForColabTag?.uid ?? null)

  console.log("\n✅ Done! Fake data seeded.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
