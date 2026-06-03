import { OpenAPIHono } from '@hono/zod-openapi'
import { AnnouncementController } from './announcement.controller'
import { authGuard, roleGuard } from '../../lib/rbac'

const announcement = new OpenAPIHono()
const controller = new AnnouncementController()

// ── Web (admin/manager) ────────────────────────────────────────────
announcement.post('/web/announcements', roleGuard(['admin', 'manager']), (c) =>
  controller.create(c),
)
announcement.get('/web/announcements', roleGuard(['admin', 'manager']), (c) =>
  controller.findAllWeb(c),
)
announcement.get('/web/announcements/:id', roleGuard(['admin', 'manager']), (c) =>
  controller.findOne(c),
)
announcement.patch('/web/announcements/:id', roleGuard(['admin', 'manager']), (c) =>
  controller.update(c),
)
announcement.delete('/web/announcements/:id', roleGuard(['admin', 'manager']), (c) =>
  controller.delete(c),
)

// ── Mobile (any authenticated) ─────────────────────────────────────
announcement.get('/mobile/announcements', authGuard(), (c) =>
  controller.findAllMobile(c),
)
announcement.get('/mobile/announcements/:id', authGuard(), (c) => controller.findOne(c))

export default announcement
