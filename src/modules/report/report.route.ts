import { OpenAPIHono } from '@hono/zod-openapi'
import { ReportController } from './report.controller'
import { roleGuard } from '../../lib/rbac'

const report = new OpenAPIHono()
const controller = new ReportController()

report.post('/reports', roleGuard(['employee']), (c) => controller.create(c))
report.get('/reports/me', roleGuard(['employee']), (c) => controller.findMyReports(c))
report.get('/reports', roleGuard(['manager', 'admin']), (c) => controller.findAll(c))
report.get('/reports/:id', roleGuard(['employee', 'manager', 'admin']), (c) => controller.getDetail(c))
report.patch('/reports/:id/validate', roleGuard(['manager', 'admin']), (c) => controller.validate(c))

export default report
