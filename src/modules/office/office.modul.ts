import { OfficeRepository } from './office.repository'
import { createOfficeSchema, updateOfficeSchema } from './office.schema'

export class OfficeModule {
  private repository = new OfficeRepository()

  async fetchAll() {
    const data = await this.repository.findAll()
    return { data, status: 200 }
  }

  async fetchOne(id: string) {
    const data = await this.repository.findById(id)
    if (!data) return { error: { code: 'OFFICE_NOT_FOUND', message: 'Office not found' }, status: 404 }
    return { data, status: 200 }
  }

  async processCreate(body: any) {
    const validated = createOfficeSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const data = await this.repository.create(validated.data)
    return { data, status: 201 }
  }

  async processUpdate(id: string, body: any) {
    const validated = updateOfficeSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' }, status: 422 }
    }

    const data = await this.repository.update(id, validated.data)
    if (!data) return { error: { code: 'OFFICE_NOT_FOUND', message: 'Office not found' }, status: 404 }
    
    return { data, status: 200 }
  }

  async processDelete(id: string) {
    await this.repository.delete(id)
    return { status: 200 }
  }
}
