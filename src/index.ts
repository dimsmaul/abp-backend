import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { auth } from './lib/auth'
import user from './modules/user/user.modul'
import attendance from './modules/attendance/attendance.modul'
import report from './modules/report/report.modul'
import dashboard from './modules/dashboard/dashboard.modul'

const app = new Hono()

app.use('*', logger())

// Auth handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// Module routes
app.route('/api', user)
app.route('/api', attendance)
app.route('/api', report)
app.route('/api', dashboard)

app.get('/', (c) => {
  return c.text('FieldTrack API is running!')
})

export default {
  port: 4000,
  fetch: app.fetch,
}
