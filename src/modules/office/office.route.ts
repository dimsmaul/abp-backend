import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { OfficeController } from './office.controller'
import { roleGuard } from '../../lib/rbac'
import { createOfficeSchema, updateOfficeSchema } from './office.schema'
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

const createRouteDef = createRoute({
  method: 'post',
  path: '/offices',
  summary: 'Create a new office',
  tags: ['Office'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createOfficeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Office created',
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

office.openapi(findAllRoute, (c) => controller.findAll(c))
office.openapi(createRouteDef, roleGuard(['admin']), (c) => controller.create(c))

// Fallback for non-OpenAPI routes for now
office.get('/offices/:id', (c) => controller.findOne(c))
office.patch('/offices/:id', roleGuard(['admin']), (c) => controller.update(c))
office.delete('/offices/:id', roleGuard(['admin']), (c) => controller.delete(c))

export default office
