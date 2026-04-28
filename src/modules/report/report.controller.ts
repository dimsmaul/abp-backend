import { Context } from 'hono'
import { ReportRepository } from './report.repository'
import { createReportSchema, validateReportSchema, reportQuerySchema } from './report.schema'
import { crypto } from 'bun'

export class ReportController {
  private repository = new ReportRepository()

  async create(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    const validated = createReportSchema.safeParse(body)
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() } }, 422)
    }

    const photoUrl = `https://storage.fieldtrack.com/report-${crypto.randomUUIDv7()}.jpg`

    const data = await this.repository.create({
      id: crypto.randomUUIDv7(),
      userId: user.id,
      category: validated.data.category,
      description: validated.data.description,
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      status: 'pending',
    })

    return c.json({ data }, 201)
  }

  async getMyReports(c: Context) {
    const user = c.get('user')
    const query = c.req.query()
    const validated = reportQuerySchema.safeParse(query)
    
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } }, 422)
    }

    const result = await this.repository.findAll({
      ...validated.data,
      userId: user.id
    })

    return c.json({ data: result })
  }

  async getAllReports(c: Context) {
    const query = c.req.query()
    const validated = reportQuerySchema.safeParse(query)
    
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } }, 422)
    }

    const result = await this.repository.findAll(validated.data)

    return c.json({ data: result })
  }

  async getDetail(c: Context) {
    const id = c.req.param('id')
    const data = await this.repository.findById(id)
    
    if (!data) {
      return c.json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' } }, 404)
    }

    return c.json({ data })
  }

  async validate(c: Context) {
    const id = c.req.param('id')
    const user = c.get('user')
    const body = await c.req.json()
    
    const validated = validateReportSchema.safeParse(body)
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() } }, 422)
    }

    const report = await this.repository.findById(id)
    if (!report) {
      return c.json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' } }, 404)
    }

    if (report.status !== 'pending') {
      return c.json({ error: { code: 'ALREADY_VALIDATED', message: 'Report has already been validated' } }, 409)
    }

    await this.repository.validate(id, {
      id: crypto.randomUUIDv7(),
      reportId: id,
      validatedBy: user.id,
      status: validated.data.status,
      notes: validated.data.notes,
    })

    return c.json({ data: { id, status: validated.data.status } })
  }
}
