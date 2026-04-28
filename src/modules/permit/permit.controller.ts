import { Context } from 'hono'
import { PermitModule } from './permit.modul'

export class PermitController {
  private module = new PermitModule()

  async findMyPermits(c: Context) {
    const user = c.get('user')
    const result = await this.module.fetchMyPermits(user.id)
    return c.json({ data: result.data })
  }

  async findAll(c: Context) {
    const query = c.req.query()
    const result = await this.module.fetchAll(query)
    return c.json(result.data)
  }

  async create(c: Context) {
    const user = c.get('user')
    const body = await c.req.json()
    const result = await this.module.processCreate(user.id, body)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async validate(c: Context) {
    const id = c.req.param('id') as string
    const body = await c.req.json()
    const result = await this.module.processValidate(id, body)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }
}
