import { Context } from 'hono'
import { DashboardModule } from './dashboard.modul'

export class DashboardController {
  private module = new DashboardModule()

  async getSummary(c: Context) {
    const result = await this.module.fetchSummary()
    return c.json({ data: result.data })
  }
}
