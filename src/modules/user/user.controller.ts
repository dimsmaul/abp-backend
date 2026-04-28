import { Context } from 'hono'
import { UserRepository } from './user.repository'
import { createUserSchema, updateUserSchema } from './user.schema'
import { auth } from '../../lib/auth'

export class UserController {
  private repository = new UserRepository()

  async findAll(c: Context) {
    const data = await this.repository.findAll()
    return c.json({ data })
  }

  async findOne(c: Context) {
    const id = c.req.param('id')
    const data = await this.repository.findById(id)
    if (!data) return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404)
    return c.json({ data })
  }

  async create(c: Context) {
    const body = await c.req.json()
    const validated = createUserSchema.safeParse(body)
    
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() } }, 422)
    }

    // Use better-auth to create user so password hashing is handled
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: validated.data.email,
          password: validated.data.password,
          name: validated.data.name,
        }
      })

      // Update the role and department since sign-up doesn't allow setting them
      await this.repository.update(result.user.id, {
        role: validated.data.role,
        department: validated.data.department,
      })

      const user = await this.repository.findById(result.user.id)
      return c.json({ data: user }, 201)
    } catch (e: any) {
      return c.json({ error: { code: 'CREATE_FAILED', message: e.message } }, 400)
    }
  }

  async update(c: Context) {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateUserSchema.safeParse(body)
    
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } }, 422)
    }

    const data = await this.repository.update(id, validated.data)
    if (!data) return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404)
    
    return c.json({ data })
  }
}
