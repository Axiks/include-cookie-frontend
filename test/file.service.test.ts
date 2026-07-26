import { describe, it, expect, beforeEach, vi } from "vitest"
import path from "node:path"

const writeFile = vi.hoisted(() => vi.fn())
vi.mock("fs", () => ({ promises: { writeFile } }))

import saveFileOnServer from "@/features/cdn/FileService"

describe("FileService.saveFileOnServer", () => {
  beforeEach(() => writeFile.mockReset())

  it("writes the buffer under <cwd>/public/<subCatalog>/<filename> and returns the path", async () => {
    const buf = Buffer.from("bytes")
    const result = await saveFileOnServer(buf as any, "avatars", "pic.png")

    expect(writeFile).toHaveBeenCalledTimes(1)
    const [writtenPath, writtenBuf] = writeFile.mock.calls[0]
    expect(writtenPath).toBe(path.join(process.cwd(), "public", "avatars", "pic.png"))
    expect(writtenBuf).toBe(buf)
    expect(result).toBe(writtenPath)
  })

  it("strips any directory components from the filename (basename only)", async () => {
    await saveFileOnServer(Buffer.from("x") as any, "covers", "../../etc/passwd")
    const [writtenPath] = writeFile.mock.calls[0]
    expect(writtenPath).toBe(path.join(process.cwd(), "public", "covers", "passwd"))
  })
})
