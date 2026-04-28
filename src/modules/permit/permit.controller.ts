import { Context } from 'hono'
import { PermitModule } from './permit.modul'
import { paginatedResponse, successResponse } from '../../lib/response'

export class PermitController {
  private module = new PermitModule()

  async findMyPermits(c: Context) {
    const user = c.get('user')
    const result = await this.module.fetchMyPermits(user.id)
    return c.json(successResponse(result.data, 'Permits fetched'))
  }

  async findAll(c: Context) {
    const query = c.req.query()
    const result = await this.module.fetchAll(query)
    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async create(c: Context) {
    const user = c.get('user')
    const body = await c.req.json()
    const result = await this.module.processCreate(user.id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Permit request submitted'), 201)
  }

  async validate(c: Context) {
    const id = c.req.param('id') ?? ''
    const body = await c.req.json()
    const result = await this.module.processValidate(id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Permit validated'))
  }
}
