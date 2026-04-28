import { ReportRepository } from './report.repository'
import { createReportSchema, validateReportSchema, reportQuerySchema } from './report.schema'
import { uploadToR2 } from '../../lib/s3'

export class ReportModule {
  private repository = new ReportRepository()

  async processCreate(userId: string, body: any) {
    const validated = createReportSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const photo = body['photo'] as File
    if (!photo) {
      return { error: { code: 'MISSING_PHOTO', message: 'Photo is required' }, status: 422 }
    }

    const key = `reports/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(photo, key)

    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      category: validated.data.category as any,
      description: validated.data.description,
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      status: 'pending',
    })

    return { data, status: 201 }
  }

  async fetchMyReports(userId: string, query: any) {
    const validated = reportQuerySchema.safeParse(query)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' }, status: 422 }
    }

    const result = await this.repository.findAll({
      ...validated.data,
      userId: userId
    })

    return { data: result, status: 200 }
  }

  async fetchAllReports(query: any) {
    const validated = reportQuerySchema.safeParse(query)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' }, status: 422 }
    }

    const result = await this.repository.findAll(validated.data)

    return { data: result, status: 200 }
  }

  async fetchDetail(id: string) {
    const data = await this.repository.findById(id)
    if (!data) {
      return { error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' }, status: 404 }
    }

    return { data, status: 200 }
  }

  async processValidate(reportId: string, userId: string, body: any) {
    const validated = validateReportSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const report = await this.repository.findById(reportId)
    if (!report) {
      return { error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' }, status: 404 }
    }

    if (report.status !== 'pending') {
      return { error: { code: 'ALREADY_VALIDATED', message: 'Report has already been validated' }, status: 409 }
    }

    await this.repository.validate(reportId, {
      id: crypto.randomUUID(),
      reportId: reportId,
      validatedBy: userId,
      status: validated.data.status,
      notes: validated.data.notes,
    })

    return { data: { id: reportId, status: validated.data.status }, status: 200 }
  }
}
