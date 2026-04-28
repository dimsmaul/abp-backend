import { Context } from 'hono'
import { ReportModule } from './report.modul'

export class ReportController {
  private logic = new ReportModule()

  async create(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    const result = await this.logic.processCreate(user.id, body)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data }, result.status as any)
  }

  async getMyReports(c: Context) {
    const user = c.get('user')
    const query = c.req.query()
    
    const result = await this.logic.fetchMyReports(user.id, query)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async getAllReports(c: Context) {
    const query = c.req.query()
    
    const result = await this.logic.fetchAllReports(query)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async getDetail(c: Context) {
    const id = c.req.param('id')!
    const result = await this.logic.fetchDetail(id)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }

  async validate(c: Context) {
    const id = c.req.param('id')!
    const user = c.get('user')
    const body = await c.req.json()
    
    const result = await this.logic.processValidate(id, user.id, body)
    
    if (result.error) {
      return c.json({ error: result.error }, result.status as any)
    }

    return c.json({ data: result.data })
  }
}
