import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import user from './modules/user/user.route'
import attendance from './modules/attendance/attendance.route'
import report from './modules/report/report.route'
import dashboard from './modules/dashboard/dashboard.route'
import office from './modules/office/office.route'
import permit from './modules/permit/permit.route'

export function createApp() {
  const app = new OpenAPIHono()

  // Swagger UI
  app.get('/ui', swaggerUI({ url: '/doc' }))

  // OpenAPI Document
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'FieldTrack API',
      description: 'API Documentation for FieldTrack HRIS System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
      {
        url: 'https://fieldtrack.vercel.app',
        description: 'Production server',
      }
    ],
  })

  // Setup Auth Security Scheme
  app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  })

  app.use('*', logger())
  app.use('*', cors({
    origin: ['http://localhost:5173', 'https://fieldtrack.vercel.app', 'https://stg-fieldtrack.vercel.app'],
    credentials: true,
  }))

  // Auth handler
  app.all('/api/auth/*', (c) => auth.handler(c.req.raw))

  // Module routes
  app.route('/api', user)
  app.route('/api', attendance)
  app.route('/api', report)
  app.route('/api', dashboard)
  app.route('/api', office)
  app.route('/api', permit)

  app.get('/', (c) => {
    return c.json({ message: 'FieldTrack API is running!' })
  })

  return app
}
