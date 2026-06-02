import { Hono } from 'hono'
import { MeController } from './me.controller'
import { roleGuard } from '../../lib/rbac'

const me = new Hono()
const controller = new MeController()

me.patch('/mobile/me', roleGuard(['employee', 'manager', 'admin']), (c) =>
  controller.updateProfile(c),
)

me.post('/mobile/me/avatar', roleGuard(['employee', 'manager', 'admin']), (c) =>
  controller.uploadAvatar(c),
)

export default me
