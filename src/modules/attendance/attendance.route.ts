import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { AttendanceController } from './attendance.controller'
import { roleGuard } from '../../lib/rbac'
import { checkInSchema, checkOutSchema, attendanceQuerySchema, recapQuerySchema } from './attendance.schema'
import { z } from '../../lib/openapi'

const attendance = new OpenAPIHono()
const controller = new AttendanceController()

const checkInRoute = createRoute({
  method: 'post',
  path: '/mobile/attendances/check-in',
  summary: 'Employee check-in',
  tags: ['Attendance'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: checkInSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Check-in successful',
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

const checkOutRoute = createRoute({
  method: 'post',
  path: '/mobile/attendances/check-out',
  summary: 'Employee check-out',
  tags: ['Attendance'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: checkOutSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Check-out successful',
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

const getMyHistoryRoute = createRoute({
  method: 'get',
  path: '/mobile/attendances',
  summary: 'Get my attendance history',
  tags: ['Attendance'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of attendance records',
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

const getAllHistoryRoute = createRoute({
  method: 'get',
  path: '/web/attendances',
  summary: 'Get all attendance history (Admin/Manager)',
  tags: ['Attendance'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of all attendance records',
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

const getRecapRoute = createRoute({
  method: 'get',
  path: '/web/attendances/recap',
  summary: 'Get attendance recap report',
  tags: ['Attendance'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Attendance recap data',
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

const getMapPointsRoute = createRoute({
  method: 'get',
  path: '/web/attendances/map-points',
  summary: 'Get attendance map points',
  tags: ['Attendance'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Map points for dashboard',
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

attendance.openapi(checkInRoute, roleGuard(['employee']), (c) => controller.checkIn(c))
attendance.openapi(checkOutRoute, roleGuard(['employee']), (c) => controller.checkOut(c))
attendance.openapi(getMyHistoryRoute, roleGuard(['employee']), (c) => controller.getMyHistory(c))
attendance.openapi(getAllHistoryRoute, roleGuard(['manager', 'admin']), (c) => controller.getAllHistory(c))
attendance.openapi(getRecapRoute, roleGuard(['manager', 'admin']), (c) => controller.getRecap(c))
attendance.openapi(getMapPointsRoute, roleGuard(['manager', 'admin']), (c) => controller.getMapPoints(c))

export default attendance
