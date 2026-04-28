import { Context } from 'hono'
import { OfficeModule } from './office.modul'

export class OfficeController {
  private module = new OfficeModule()

  async findAll(c: Context) {
    const result = await this.module.fetchAll()
    return c.json({ data: result.data })
  }

  async findOne(c: Context) {
    const id = c.req.param('id') as string
    const result = await this.module.fetchOne(id)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async create(c: Context) {
    const body = await c.req.json()
    const result = await this.module.processCreate(body)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async update(c: Context) {
    const id = c.req.param('id') as string
    const body = await c.req.json()
    const result = await this.module.processUpdate(id, body)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async delete(c: Context) {
    const id = c.req.param('id') as string
    await this.module.processDelete(id)
    return c.json({ message: 'Deleted' })
  }
}
