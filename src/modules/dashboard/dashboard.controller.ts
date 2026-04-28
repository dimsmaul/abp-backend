import { Context } from 'hono'
import { DashboardModule } from './dashboard.modul'
import { successResponse } from '../../lib/response'

export class DashboardController {
  private module = new DashboardModule()

  async getSummary(c: Context) {
    const result = await this.module.fetchSummary()
    return c.json(successResponse(result.data, 'Dashboard summary'))
  }
}
