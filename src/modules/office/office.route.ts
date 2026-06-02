import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { OfficeController } from './office.controller'
import { roleGuard } from '../../lib/rbac'
import { z } from '../../lib/openapi'

const office = new OpenAPIHono()
const controller = new OfficeController()

const findAllRoute = createRoute({
  method: 'get',
  path: '/offices',
  summary: 'Get all offices',
  tags: ['Office'],
  responses: {
    200: {
      description: 'List of offices',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
          }),
        },
      },
    },
  },
})

office.openapi(findAllRoute, (c) => controller.findAll(c))

// Plain Hono routes (mixed middleware/handler) — openapi.openapi() only accepts (route, handler[, hook])
office.post('/offices', roleGuard(['admin']), (c) => controller.create(c))
office.get('/offices/:id', (c) => controller.findOne(c))
office.patch('/offices/:id', roleGuard(['admin']), (c) => controller.update(c))
office.delete('/offices/:id', roleGuard(['admin']), (c) => controller.delete(c))

export default office
