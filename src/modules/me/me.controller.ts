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
      // Surface the underlying cause (R2 creds, network, sharp, parseBody) so
      // the mobile client gets something actionable instead of a bare 500.
      console.error('[me/avatar] upload failed', {
        userId: user?.id,
        name: e?.name,
        message: e?.message,
        code: e?.code,
        stack: e?.stack,
      })
      return c.json(
        {
          message: 'Failed to upload avatar',
          error: {
            code: 'AVATAR_UPLOAD_FAILED',
            cause: e?.message ?? String(e),
          },
        },
        500,
      )
    }
  }
}
