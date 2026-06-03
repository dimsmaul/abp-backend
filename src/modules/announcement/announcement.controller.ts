import { Context } from 'hono'
import { AnnouncementModule } from './announcement.modul'
import { paginatedResponse, successResponse } from '../../lib/response'

export class AnnouncementController {
  private module = new AnnouncementModule()

  async findAllWeb(c: Context) {
    const query = c.req.query()
    const result = await this.module.fetchAllWeb(query)
    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }, 'Announcements fetched'))
  }

  async findAllMobile(c: Context) {
    const query = c.req.query()
    const result = await this.module.fetchAllMobile(query)
    const { items, page, limit, total } = result.data
    return c.json(paginatedResponse(items, { page, limit, total }, 'Announcements fetched'))
  }

  async findOne(c: Context) {
    const id = c.req.param('id') as string
    const result = await this.module.fetchOne(id)
    if (result.error) {
      return c.json(
        { message: result.error.message, error: result.error },
        result.status as any,
      )
    }
    return c.json(successResponse(result.data, 'Announcement fetched'))
  }

  async create(c: Context) {
    const user = c.get('user')
    const body = await c.req.json()
    const result = await this.module.processCreate(user.id, body)
    if (result.error) {
      return c.json(
        { message: result.error.message, error: result.error },
        result.status as any,
      )
    }
    return c.json(successResponse(result.data, 'Announcement created'), 201)
  }

  async update(c: Context) {
    const id = c.req.param('id') as string
    const body = await c.req.json()
    const result = await this.module.processUpdate(id, body)
    if (result.error) {
      return c.json(
        { message: result.error.message, error: result.error },
        result.status as any,
      )
    }
    return c.json(successResponse(result.data, 'Announcement updated'))
  }

  async delete(c: Context) {
    const id = c.req.param('id') as string
    await this.module.processDelete(id)
    return c.json({ message: 'Announcement deleted', data: null })
  }
}
