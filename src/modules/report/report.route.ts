import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { ReportController } from './report.controller'
import { roleGuard } from '../../lib/rbac'
import { createReportSchema, validateReportSchema, reportQuerySchema } from './report.schema'
import { z } from '../../lib/openapi'

const report = new OpenAPIHono()
const controller = new ReportController()

const createReportRoute = createRoute({
  method: 'post',
  path: '/reports',
  summary: 'Create a field report',
  tags: ['Report'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: createReportSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Report created',
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

const getMyReportsRoute = createRoute({
  method: 'get',
  path: '/reports/me',
  summary: 'Get my field reports',
  tags: ['Report'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of my reports',
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

const getAllReportsRoute = createRoute({
  method: 'get',
  path: '/reports',
  summary: 'Get all field reports (Admin/Manager)',
  tags: ['Report'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of all reports',
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

const validateReportRoute = createRoute({
  method: 'patch',
  path: '/reports/{id}/validate',
  summary: 'Validate a field report',
  tags: ['Report'],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '123' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: validateReportSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Report validated',
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

report.openapi(createReportRoute, roleGuard(['employee']), (c) => controller.create(c))
report.openapi(getMyReportsRoute, roleGuard(['employee']), (c) => controller.findMyReports(c))
report.openapi(getAllReportsRoute, roleGuard(['manager', 'admin']), (c) => controller.findAll(c))
report.openapi(validateReportRoute, roleGuard(['manager', 'admin']), (c) => controller.validate(c))

export default report
