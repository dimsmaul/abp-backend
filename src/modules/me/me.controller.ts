import { Context } from 'hono'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { MeModule } from './me.modul'
import { r2Client, r2KeyFromPublicUrl } from '../../lib/s3'
import { successResponse } from '../../lib/response'
import { MeRepository } from './me.repository'

export class MeController {
  private module = new MeModule()

  async updateProfile(c: Context) {
    const user = c.get('user')
    const body = await c.req.json()

    const result = await this.module.processUpdate(user.id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Profile updated'))
  }

  async uploadAvatar(c: Context) {
    const user = c.get('user')
    try {
      const body = await c.req.parseBody()
      const result = await this.module.processAvatarUpload(user.id, body)

      if (result.error) {
        return c.json(
          { message: result.error.message, error: result.error },
          result.status as any,
        )
      }

      return c.json(successResponse(result.data, 'Avatar updated'))
    } catch (e: any) {
      // Map upstream SDK / parseBody failures to a small, fixed set of safe
      // codes. The raw SDK message can echo back endpoints / signing details
      // and must NOT be returned to the client or written verbatim to logs.
      const code = classifyAvatarError(e)
      // Log only allow-listed fields. No `message` / `stack`.
      console.error('[me/avatar] upload failed', {
        userId: user?.id,
        code,
        errorName: e?.name,
        errorCode: e?.code,
        httpStatusCode: e?.$metadata?.httpStatusCode,
      })
      return c.json(
        { message: 'Failed to upload avatar', error: { code } },
        500,
      )
    }
  }

  /**
   * Stream the authenticated user's avatar bytes from R2 through this server.
   * Dart's HttpClient on Android can't get past Cloudflare's WAF on the
   * public r2.dev subdomain (TLS / JA3 fingerprint flagged as bot), so the
   * mobile client goes through us instead and gets the raw image bytes
   * over an already-authenticated channel.
   */
  async streamAvatar(c: Context) {
    const user = c.get('user')
    try {
      const repo = new MeRepository()
      const row = await repo.findById(user.id)
      const url = row?.image as string | null | undefined
      if (!url) {
        return c.json({ error: { code: 'NO_AVATAR' } }, 404)
      }
      const key = r2KeyFromPublicUrl(url)
      if (!key) {
        return c.json({ error: { code: 'INVALID_AVATAR_URL' } }, 500)
      }
      const obj = await r2Client.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        }),
      )
      const body = obj.Body as any
      if (!body) {
        return c.json({ error: { code: 'AVATAR_NOT_FOUND' } }, 404)
      }
      const arrayBuf = await body.transformToByteArray()
      return new Response(arrayBuf, {
        status: 200,
        headers: {
          'Content-Type': obj.ContentType ?? 'image/png',
          'Cache-Control': 'private, max-age=300',
        },
      })
    } catch (e: any) {
      console.error('[me/avatar/stream] failed', {
        userId: user?.id,
        errorName: e?.name,
        httpStatusCode: e?.$metadata?.httpStatusCode,
      })
      return c.json({ error: { code: 'STREAM_FAILED' } }, 500)
    }
  }
}

type AvatarErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'IMAGE_PROCESSING_FAILED'
  | 'INVALID_UPLOAD'
  | 'AVATAR_UPLOAD_FAILED'

function classifyAvatarError(e: any): AvatarErrorCode {
  const httpStatus = e?.$metadata?.httpStatusCode as number | undefined
  const name = (e?.name ?? '') as string
  const code = (e?.code ?? '') as string

  // S3/R2 errors expose $metadata + a fault tag.
  if (typeof httpStatus === 'number' || name.includes('S3') || e?.$fault) {
    return 'STORAGE_UNAVAILABLE'
  }
  if (name === 'TypeError' && /parseBody|FormData/i.test(String(e?.stack ?? ''))) {
    return 'INVALID_UPLOAD'
  }
  if (code === 'ERR_INVALID_ARG_TYPE' || /image|jpeg|png|sharp/i.test(name)) {
    return 'IMAGE_PROCESSING_FAILED'
  }
  return 'AVATAR_UPLOAD_FAILED'
}
