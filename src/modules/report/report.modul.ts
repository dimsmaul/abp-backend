import { Hono } from 'hono'
import { ReportController } from './report.controller'
import { roleGuard } from '../../lib/rbac'

const report = new Hono()
const controller = new ReportController()

// Mobile endpoints
report.post('/mobile/reports', roleGuard(['employee']), (c) => controller.create(c))
report.get('/mobile/reports', roleGuard(['employee']), (c) => controller.getMyReports(c))
report.get('/mobile/reports/:id', roleGuard(['employee']), (c) => controller.getDetail(c))

// Web endpoints
report.get('/web/reports', roleGuard(['manager', 'admin']), (c) => controller.getAllReports(c))
report.get('/web/reports/:id', roleGuard(['manager', 'admin']), (c) => controller.getDetail(c))
report.patch('/web/reports/:id/validate', roleGuard(['manager', 'admin']), (c) => controller.validate(c))

export default report
