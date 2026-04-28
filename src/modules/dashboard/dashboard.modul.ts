import { Hono } from 'hono'
import { DashboardController } from './dashboard.controller'
import { roleGuard } from '../../lib/rbac'

const dashboard = new Hono()
const controller = new DashboardController()

dashboard.get('/web/dashboard/summary', roleGuard(['manager', 'admin']), (c) => controller.getSummary(c))
dashboard.get('/web/dashboard/map-points', roleGuard(['manager', 'admin']), (c) => controller.getMapPoints(c))

export default dashboard
