import { Hono } from 'hono'
import { UserController } from './user.controller'
import { roleGuard } from '../../lib/rbac'

const user = new Hono()
const controller = new UserController()

user.get('/web/users', roleGuard(['admin']), (c) => controller.findAll(c))
user.get('/web/users/:id', roleGuard(['admin']), (c) => controller.findOne(c))
user.post('/web/users', roleGuard(['admin']), (c) => controller.create(c))
user.patch('/web/users/:id', roleGuard(['admin']), (c) => controller.update(c))

export default user
