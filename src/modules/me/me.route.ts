import { Hono } from 'hono'
import { MeController } from './me.controller'
import { authGuard } from '../../lib/rbac'

const me = new Hono()
const controller = new MeController()

me.patch('/mobile/me', authGuard(), (c) =>
  controller.updateProfile(c),
)

me.post('/mobile/me/avatar', authGuard(), (c) =>
  controller.uploadAvatar(c),
)

me.post('/mobile/me/face', authGuard(), (c) => controller.enrollFace(c))

// FCM token registration — mobile uploads the device token on first launch
// and after token refresh. Upserts by (userId, platform).
me.post('/mobile/me/device', authGuard(), (c) => controller.registerDevice(c))

// Image proxy: mobile hits this to grab the user's current avatar bytes
// without going to R2's CDN directly (which Cloudflare WAF gates on TLS
// fingerprint, locking Dart's HttpClient out).
me.get('/mobile/me/avatar', authGuard(), (c) => controller.streamAvatar(c))

export default me
