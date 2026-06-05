import { Hono } from 'hono'
import { DashboardController } from './dashboard.controller'
import { roleGuard } from '../../lib/rbac'

// NOTE: OpenAPIHono `app.openapi(route, guard, handler)` silently fails to
// dispatch (same bug documented in attendance.route.ts + permit.route.ts).
// Use plain Hono methods so the handler actually wires into the router.
const dashboard = new Hono()
const controller = new DashboardController()

dashboard.get('/web/dashboard/summary', roleGuard(['manager', 'admin']), (c) =>
  controller.getSummary(c),
)

export default dashboard
