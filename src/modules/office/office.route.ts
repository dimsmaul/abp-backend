import { Hono } from 'hono'
import { OfficeController } from './office.controller'
import { authGuard, roleGuard } from '../../lib/rbac'

const office = new Hono()
const controller = new OfficeController()

// Mobile — any authenticated user. Presence flow filters by regency before
// running polygon hit-testing on the device.
office.get('/mobile/offices', authGuard(), (c) => controller.findAll(c))

// Web admin — full CRUD.
office.get('/web/offices', roleGuard(['admin']), (c) => controller.findAll(c))
office.get('/web/offices/:id', roleGuard(['admin']), (c) => controller.findOne(c))
office.post('/web/offices', roleGuard(['admin']), (c) => controller.create(c))
office.patch('/web/offices/:id', roleGuard(['admin']), (c) => controller.update(c))
office.delete('/web/offices/:id', roleGuard(['admin']), (c) => controller.delete(c))

export default office
