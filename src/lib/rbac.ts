import { Context, Next } from 'hono'
import { auth } from './auth'

export type Role = 'employee' | 'admin' | 'manager'

/**
 * Gate a route by session + (optional) role allowlist.
 *
 * - `roleGuard()` or `roleGuard('any')` → just requires a valid session
 *   (used for endpoints any authenticated user can hit, e.g. mobile).
 * - `roleGuard(['admin'])` / `roleGuard(['manager', 'admin'])` → restrict
 *   to specific roles (web admin scope).
 */
export const roleGuard = (roles?: Role[] | 'any') => {
  return async (c: Context, next: Next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'You must be logged in' } }, 401)
    }

    const userRole = session.user.role as Role

    if (Array.isArray(roles) && !roles.includes(userRole)) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' } }, 403)
    }

    c.set('user', session.user)
    c.set('session', session.session)

    await next()
  }
}

/** Sugar: any authenticated user (no role filter). */
export const authGuard = () => roleGuard()
