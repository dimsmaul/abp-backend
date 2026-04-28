import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { PermitController } from './permit.controller'
import { roleGuard } from '../../lib/rbac'
import { createPermitSchema, validatePermitSchema } from './permit.schema'
import { z } from '../../lib/openapi'

const permit = new OpenAPIHono()
const controller = new PermitController()

const findMyPermitsRoute = createRoute({
  method: 'get',
  path: '/permits/me',
  summary: 'Get my permits',
  tags: ['Permit'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of my permits',
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

const createPermitRoute = createRoute({
  method: 'post',
  path: '/permits',
  summary: 'Request a permit',
  tags: ['Permit'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPermitSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Permit created',
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

const findAllRoute = createRoute({
  method: 'get',
  path: '/permits',
  summary: 'Get all permits (Admin/Manager)',
  tags: ['Permit'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of all permits',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.any()),
            meta: z.any(),
          }),
        },
      },
    },
  },
})

const validatePermitRoute = createRoute({
  method: 'patch',
  path: '/permits/{id}/validate',
  summary: 'Validate a permit',
  tags: ['Permit'],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '123' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: validatePermitSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Permit validated',
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

permit.openapi(findMyPermitsRoute, roleGuard(['employee', 'manager', 'admin']), (c) => controller.findMyPermits(c))
permit.openapi(createPermitRoute, roleGuard(['employee', 'manager', 'admin']), (c) => controller.create(c))
permit.openapi(findAllRoute, roleGuard(['manager', 'admin']), (c) => controller.findAll(c))
permit.openapi(validatePermitRoute, roleGuard(['manager', 'admin']), (c) => controller.validate(c))

export default permit
