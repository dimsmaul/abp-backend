import { Context } from 'hono'
import { UserRepository } from './user.repository'
import { createUserSchema } from './user.schema'

export class UserController {
  private repository = new UserRepository()

  async findAll(c: Context) {
    const data = await this.repository.findAll()
    return c.json({ data })
  }

  async findOne(c: Context) {
    const id = c.req.param('id')
    const data = await this.repository.findById(id)
    if (!data) return c.json({ message: 'Not found' }, 404)
    return c.json({ data })
  }

  async create(c: Context) {
    const body = await c.req.json()
    const validated = createUserSchema.safeParse(body)
    
    if (!validated.success) {
      return c.json({ errors: validated.error.flatten() }, 400)
    }

    const data = await this.repository.create(validated.data)
    return c.json({ data }, 201)
  }
}
