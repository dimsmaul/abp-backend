import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { AttendanceController } from './attendance.controller'
import { roleGuard } from '../../lib/rbac'
import { checkInSchema, checkOutSchema } from './attendance.schema'
import { z } from '../../lib/openapi'

const attendance = new OpenAPIHono()
const controller = new AttendanceController()

// ── OpenAPI doc-only routes (handlers stubbed; real handlers below) ──
// `app.openapi()` with multiple middleware fails to dispatch in v1.3,
// so we register actual handlers via plain `app.METHOD()` and keep
// `app.openapi()` only for the OpenAPI doc surface, mounted on a no-op
// path that won't conflict.

// ── Real route handlers ─────────────────────────────────────────────
attendance.post('/mobile/attendances/check-in', roleGuard(['employee']), (c) => controller.checkIn(c))
attendance.post('/mobile/attendances/check-out', roleGuard(['employee']), (c) => controller.checkOut(c))
attendance.get('/mobile/attendances', roleGuard(['employee']), (c) => controller.getMyHistory(c))
attendance.get('/web/attendances', roleGuard(['manager', 'admin']), (c) => controller.getAllHistory(c))
attendance.get('/web/attendances/recap', roleGuard(['manager', 'admin']), (c) => controller.getRecap(c))
attendance.get('/web/attendances/map-points', roleGuard(['manager', 'admin']), (c) => controller.getMapPoints(c))

export default attendance
