import { PermitRepository } from './permit.repository'
import { createPermitSchema, validatePermitSchema } from './permit.schema'

export class PermitModule {
  private repository = new PermitRepository()

  async fetchAll(query: any) {
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 10)
    const status = query.status
    const userId = query.userId

    const result = await this.repository.findAll({
      page,
      limit,
      status,
      userId,
    })
    return { data: result, status: 200 }
  }

  async fetchMyPermits(userId: string) {
    const data = await this.repository.findByUserId(userId)
    return { data, status: 200 }
  }

  async processCreate(userId: string, body: any) {
    const validated = createPermitSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const data = await this.repository.create({
      userId,
      ...validated.data,
    })
    return { data, status: 201 }
  }

  async processValidate(id: string, body: any) {
    const validated = validatePermitSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' }, status: 422 }
    }

    const data = await this.repository.validate(id, validated.data)
    if (!data) return { error: { code: 'PERMIT_NOT_FOUND', message: 'Permit not found' }, status: 404 }
    
    return { data, status: 200 }
  }
}
