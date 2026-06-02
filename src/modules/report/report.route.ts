import { OpenAPIHono } from '@hono/zod-openapi'
import { ReportController } from './report.controller'
import { roleGuard } from '../../lib/rbac'

const report = new OpenAPIHono()
const controller = new ReportController()

// Mobile = all roles (admin/manager bisa lapor + absen via mobile juga)
report.post('/mobile/reports', roleGuard(['employee', 'manager', 'admin']), (c) => controller.create(c))
report.get('/mobile/reports', roleGuard(['employee', 'manager', 'admin']), (c) => controller.findMyReports(c))
report.get('/mobile/reports/:id', roleGuard(['employee', 'manager', 'admin']), (c) => controller.getMyDetail(c))

// Web (manager, admin)
report.get('/web/reports', roleGuard(['manager', 'admin']), (c) => controller.findAll(c))
report.get('/web/reports/:id', roleGuard(['manager', 'admin']), (c) => controller.getDetail(c))
report.patch('/web/reports/:id/validate', roleGuard(['manager', 'admin']), (c) => controller.validate(c))

export default report
