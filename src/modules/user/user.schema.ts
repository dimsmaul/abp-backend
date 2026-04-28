import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'manager', 'admin']).default('employee'),
  department: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['employee', 'manager', 'admin']).optional(),
  department: z.string().optional(),
})

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['employee', 'manager', 'admin']).optional(),
  department: z.string().optional(),
  search: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserQuery = z.infer<typeof userQuerySchema>
