import { Hono } from 'hono'
import { DashboardController } from './dashboard.controller'
import { roleGuard } from '../../lib/rbac'

const dashboard = new Hono()
const controller = new DashboardController()

dashboard.get('/web/dashboard/summary', roleGuard(['manager', 'admin']), (c) => controller.getSummary(c))

export default dashboard
