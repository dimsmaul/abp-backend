import { OpenAPIHono } from '@hono/zod-openapi'
import { ReportController } from './report.controller'
import { authGuard, roleGuard } from '../../lib/rbac'

const report = new OpenAPIHono()
const controller = new ReportController()

// Mobile = any authenticated user.
report.post('/mobile/reports', authGuard(), (c) => controller.create(c))
report.get('/mobile/reports', authGuard(), (c) => controller.findMyReports(c))
report.get('/mobile/reports/:id', authGuard(), (c) => controller.getMyDetail(c))

// Web (manager, admin)
report.get('/web/reports', roleGuard(['manager', 'admin']), (c) => controller.findAll(c))
report.get('/web/reports/:id', roleGuard(['manager', 'admin']), (c) => controller.getDetail(c))
report.patch('/web/reports/:id/validate', roleGuard(['manager', 'admin']), (c) => controller.validate(c))

export default report
