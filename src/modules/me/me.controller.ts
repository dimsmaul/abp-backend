import { Context } from 'hono'
import { MeModule } from './me.modul'
import { successResponse } from '../../lib/response'

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
