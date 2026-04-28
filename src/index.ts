import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

// Auth handler
app.all('/api/auth/*', (c) => auth.handler(c.req.raw))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default {
  port: 4000,
  fetch: app.fetch,
}
