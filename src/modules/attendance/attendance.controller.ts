import { Context } from 'hono'
import { AttendanceModule } from './attendance.modul'

export class AttendanceController {
  private logic = new AttendanceModule()

  async checkIn(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    const result = await this.logic.processCheckIn(user.id, body)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async checkOut(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    const result = await this.logic.processCheckOut(user.id, body)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async getMyHistory(c: Context) {
    const user = c.get('user')
    const query = c.req.query()
    
    const result = await this.logic.fetchHistory(user.id, query)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async getAllHistory(c: Context) {
    const query = c.req.query()
    
    const result = await this.logic.fetchAllHistory(query)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }
}
