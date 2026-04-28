import { Context } from 'hono'
import { UserModule } from './user.modul'
import { paginatedResponse, successResponse } from '../../lib/response'

export class UserController {
  private module = new UserModule()

  async findAll(c: Context) {
    const query = c.req.query()
    const result = await this.module.fetchAll(query)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async findOne(c: Context) {
    const id = c.req.param('id')!
    const result = await this.module.fetchOne(id)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'User fetched'))
  }

  async create(c: Context) {
    const body = await c.req.json()
    const result = await this.module.processCreate(body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'User created'), 201)
  }

  async update(c: Context) {
    const id = c.req.param('id')!
    const body = await c.req.json()
    const result = await this.module.processUpdate(id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'User updated'))
  }
}
