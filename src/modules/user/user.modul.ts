import { Hono } from 'hono'
import { UserController } from './user.controller'

const userModul = new Hono()
const controller = new UserController()

userModul.get('/', (c) => controller.findAll(c))
userModul.get('/:id', (c) => controller.findOne(c))
userModul.post('/', (c) => controller.create(c))

export default userModul
