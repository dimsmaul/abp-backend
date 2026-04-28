import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import user from './modules/user/user.route'
import attendance from './modules/attendance/attendance.route'
import report from './modules/report/report.route'
import dashboard from './modules/dashboard/dashboard.route'

export function createApp() {
  const app = new Hono()

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

  app.get('/', (c) => {
    return c.json({ message: 'FieldTrack API is running!' })
  })

  return app
}
