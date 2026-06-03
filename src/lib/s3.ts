import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const uploadToR2 = async (
  file: File | Blob | Buffer,
  key: string,
  contentType?: string,
) => {
  const body: any = file
  const resolvedContentType =
    contentType ?? ((file as any).type as string | undefined) ?? 'application/octet-stream'

  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: resolvedContentType,
    },
  })

  await upload.done()

  // Construct the public URL
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

/**
 * Best-effort delete. Swallows errors so the caller flow (e.g. a new upload
 * that succeeded) never fails on cleanup of the previous object.
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    )
  } catch (e) {
    console.warn('[r2] delete failed', { key, name: (e as any)?.name })
  }
}

/**
 * Extract the R2 object key from a public URL produced by `uploadToR2`.
 * Returns null if the URL doesn't belong to our public bucket.
 */
export function r2KeyFromPublicUrl(url: string): string | null {
  const pub = process.env.R2_PUBLIC_URL
  if (!pub || !url.startsWith(pub + '/')) return null
  return url.slice(pub.length + 1)
}

export { r2Client }
