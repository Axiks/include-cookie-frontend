import { getFileStream } from "@/lib/shared/cdn/file.service"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const obj = await getFileStream("avatars", id)
    return new Response(obj.Body as ReadableStream, {
      headers: { "Content-Type": obj.ContentType ?? "application/octet-stream" },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}