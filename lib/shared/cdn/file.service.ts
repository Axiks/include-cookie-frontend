import {
  PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand,
} from "@aws-sdk/client-s3"
import { s3, S3_BUCKET } from "./s3-client"

function s3ErrorCode(e: unknown): string | undefined {
  const err = e as { name?: string; Code?: string } | null
  return err?.name ?? err?.Code
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

export function mimeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return MIME[ext] ?? "application/octet-stream"
}

export async function saveFile(
  buffer: Uint8Array,
  subCatalog: string,
  filename: string,
): Promise<string> {
  const put = () =>
    s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `${subCatalog}/${filename}`,
        Body: buffer,
        ContentType: mimeFromFilename(filename),
      }),
    )

  try {
    await put()
  } catch (e) {
    // Self-heal a fresh object store: create the bucket on first use, then retry once.
    if (s3ErrorCode(e) !== "NoSuchBucket") throw e
    try {
      await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
    } catch (ce) {
      const code = s3ErrorCode(ce)
      if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") throw ce
    }
    await put()
  }
  return filename
}

export async function getFileStream(subCatalog: string, filename: string) {
  return s3.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${subCatalog}/${filename}`,
    }),
  )
}

export async function deleteFile(subCatalog: string, filename: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${subCatalog}/${filename}`,
    }),
  )
}
