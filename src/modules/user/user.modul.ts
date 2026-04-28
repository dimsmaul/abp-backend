import { UserRepository } from './user.repository'
import { createUserSchema, updateUserSchema } from './user.schema'
import { auth } from '../../lib/auth'

export class UserModule {
  private repository = new UserRepository()

  async fetchAll() {
    const data = await this.repository.findAll()
    return { data, status: 200 }
  }

  async fetchOne(id: string) {
    const data = await this.repository.findById(id)
    if (!data) return { error: { code: 'USER_NOT_FOUND', message: 'User not found' }, status: 404 }
    return { data, status: 200 }
  }

  async processCreate(body: any) {
    const validated = createUserSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: validated.data.email,
          password: validated.data.password,
          name: validated.data.name,
        }
      })

      await this.repository.update(result.user.id, {
        role: validated.data.role,
        department: validated.data.department,
      })

      const user = await this.repository.findById(result.user.id)
      return { data: user, status: 201 }
    } catch (e: any) {
      return { error: { code: 'CREATE_FAILED', message: e.message }, status: 400 }
    }
  }

  async processUpdate(id: string, body: any) {
    const validated = updateUserSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' }, status: 422 }
    }

    const data = await this.repository.update(id, validated.data)
    if (!data) return { error: { code: 'USER_NOT_FOUND', message: 'User not found' }, status: 404 }
    
    return { data, status: 200 }
  }
}
