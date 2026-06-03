import { Context } from 'hono'
import { LeaveBalanceModule } from './leave_balance.modul'
import { paginatedResponse, successResponse } from '../../lib/response'

export class LeaveBalanceController {
  private module = new LeaveBalanceModule()

  async findMine(c: Context) {
    const user = c.get('user')
    const result = await this.module.fetchMine(user.id)
    return c.json(successResponse(result.data, 'Leave balance fetched'))
  }

  async findAll(c: Context) {
    const query = c.req.query()
    const result = await this.module.fetchAll(query)
    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async update(c: Context) {
    const userId = c.req.param('userId') ?? ''
    const body = await c.req.json()
    const result = await this.module.processUpdate(userId, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Leave balance updated'))
  }
}
