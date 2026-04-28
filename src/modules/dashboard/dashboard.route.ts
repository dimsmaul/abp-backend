import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { DashboardController } from './dashboard.controller'
import { roleGuard } from '../../lib/rbac'
import { z } from '../../lib/openapi'

const dashboard = new OpenAPIHono()
const controller = new DashboardController()

const getSummaryRoute = createRoute({
  method: 'get',
  path: '/web/dashboard/summary',
  summary: 'Get dashboard summary stats',
  tags: ['Dashboard'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Summary statistics',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
  },
})

dashboard.openapi(getSummaryRoute, roleGuard(['manager', 'admin']), (c) => controller.getSummary(c))

export default dashboard
