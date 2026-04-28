import { Context } from 'hono'
import { DashboardModule } from './dashboard.modul'

export class DashboardController {
  private logic = new DashboardModule()

  async getSummary(c: Context) {
    const result = await this.logic.fetchSummary()
    return c.json({ data: result.data })
  }
}
