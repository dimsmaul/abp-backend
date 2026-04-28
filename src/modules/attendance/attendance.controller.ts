import { Context } from 'hono'
import { AttendanceModule } from './attendance.modul'
import { paginatedResponse, successResponse } from '../../lib/response'

export class AttendanceController {
  private module = new AttendanceModule()

  async checkIn(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()

    const result = await this.module.processCheckIn(user.id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Check-in successful'), 201)
  }

  async checkOut(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()

    const result = await this.module.processCheckOut(user.id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Check-out successful'), 201)
  }

  async getMyHistory(c: Context) {
    const user = c.get('user')
    const query = c.req.query()

    const result = await this.module.fetchHistory(user.id, query)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async getAllHistory(c: Context) {
    const query = c.req.query()

    const result = await this.module.fetchAllHistory(query)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async getRecap(c: Context) {
    const query = c.req.query()

    const result = await this.module.fetchRecap(query)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data))
  }

  async getMapPoints(c: Context) {
    const date = c.req.query('date')

    const result = await this.module.fetchMapPoints(date)

    return c.json(successResponse(result.data))
  }
}
