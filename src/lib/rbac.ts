import { Context, Next } from 'hono'
import { auth } from './auth'

export type Role = 'employee' | 'admin' | 'manager'

export const roleGuard = (roles: Role[]) => {
  return async (c: Context, next: Next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'You must be logged in' } }, 401)
    }

    const userRole = session.user.role as Role

    if (!roles.includes(userRole)) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' } }, 403)
    }

    // Set user and session in context for later use
    c.set('user', session.user)
    c.set('session', session.session)

    await next()
  }
}
