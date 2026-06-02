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

export default me
