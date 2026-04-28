import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import { auth } from '../src/lib/auth'
import user from '../src/modules/user/user.route'
import attendance from '../src/modules/attendance/attendance.route'
import report from '../src/modules/report/report.route'
import dashboard from '../src/modules/dashboard/dashboard.route'

const app = new Hono().basePath('/api')

app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://fieldtrack.vercel.app'],
  credentials: true,
}))

// Auth handler
app.all('/auth/*', (c) => auth.handler(c.req.raw))

// Module routes
app.route('/', user)
app.route('/', attendance)
app.route('/', report)
app.route('/', dashboard)

app.get('/', (c) => {
  return c.text('FieldTrack API is running!')
})

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
