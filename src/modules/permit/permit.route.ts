import { Hono } from 'hono'
import { PermitController } from './permit.controller'
import { authGuard, roleGuard } from '../../lib/rbac'

// NOTE: We previously used OpenAPIHono `app.openapi(route, guard, handler)`
// here, but that overload silently fails to dispatch in our @hono/zod-openapi
// version (see the same comment in `attendance.route.ts`) — the routes were
// registered for OpenAPI docs but never wired into the actual router, so
// every call returned 404. Use plain Hono methods for the real handlers.
const permit = new Hono()
const controller = new PermitController()

// Mobile — any authenticated user can list their own permits and create
// new requests.
permit.get('/mobile/permits/me', authGuard(), (c) =>
  controller.findMyPermits(c),
)
permit.get('/mobile/permits/:id', authGuard(), (c) => controller.getMyDetail(c))
permit.post('/mobile/permits', authGuard(), (c) => controller.create(c))

// Web (manager / admin) — list every permit and validate them.
permit.get('/web/permits', roleGuard(['manager', 'admin']), (c) =>
  controller.findAll(c),
)
permit.patch(
  '/web/permits/:id/validate',
  roleGuard(['manager', 'admin']),
  (c) => controller.validate(c),
)

export default permit
