import { Context } from 'hono'
import { AttendanceModule } from './attendance.modul'

export class AttendanceController {
  private module = new AttendanceModule()

  async checkIn(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()

    const result = await this.module.processCheckIn(user.id, body)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async checkOut(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()

    const result = await this.module.processCheckOut(user.id, body)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async getMyHistory(c: Context) {
    const user = c.get('user')
    const query = c.req.query()

    const result = await this.module.fetchHistory(user.id, query)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async getAllHistory(c: Context) {
    const query = c.req.query()

    const result = await this.module.fetchAllHistory(query)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async getRecap(c: Context) {
    const query = c.req.query()

    const result = await this.module.fetchRecap(query)

    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async getMapPoints(c: Context) {
    const date = c.req.query('date')

    const result = await this.module.fetchMapPoints(date)

    return c.json({ data: result.data })
  }
}
