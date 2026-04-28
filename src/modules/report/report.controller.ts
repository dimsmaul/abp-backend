import { Context } from 'hono'
import { ReportModule } from './report.modul'
import { paginatedResponse, successResponse } from '../../lib/response'

export class ReportController {
  private module = new ReportModule()

  async create(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()

    const result = await this.module.processCreate(user.id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Report created'), 201)
  }

  async findMyReports(c: Context) {
    const user = c.get('user')
    const query = c.req.query()

    const result = await this.module.fetchMyReports(user.id, query)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async findAll(c: Context) {
    const query = c.req.query()

    const result = await this.module.fetchAllReports(query)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }))
  }

  async getDetail(c: Context) {
    const id = c.req.param('id')!
    const result = await this.module.fetchDetail(id)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Report fetched'))
  }

  async validate(c: Context) {
    const id = c.req.param('id')!
    const user = c.get('user')
    const body = await c.req.json()

    const result = await this.module.processValidate(id, user.id, body)

    if (result.error) {
      return c.json({ message: result.error.message, error: result.error }, result.status as any)
    }

    return c.json(successResponse(result.data, 'Report validated'))
  }
}
