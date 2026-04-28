import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import { auth } from './lib/auth'
import user from './modules/user/user.route'
import attendance from './modules/attendance/attendance.route'
import report from './modules/report/report.route'
import dashboard from './modules/dashboard/dashboard.route'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://fieldtrack.vercel.app'],
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
  return c.text('FieldTrack API is running!')
})

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)

export default {
  port: 4000,
  fetch: app.fetch,
}
