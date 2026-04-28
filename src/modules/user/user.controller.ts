import { Context } from 'hono'
import { UserModule } from './user.modul'

export class UserController {
  private logic = new UserModule()

  async findAll(c: Context) {
    const result = await this.logic.fetchAll()
    return c.json({ data: result.data })
  }

  async findOne(c: Context) {
    const id = c.req.param('id')
    const result = await this.logic.fetchOne(id)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async create(c: Context) {
    const body = await c.req.json()
    const result = await this.logic.processCreate(body)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async update(c: Context) {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const result = await this.logic.processUpdate(id, body)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }
}
