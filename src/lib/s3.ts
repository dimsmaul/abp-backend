import { S3Client } from "@aws-sdk/client-s3"
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

export { r2Client }
