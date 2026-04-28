import { z } from 'zod'

export const createUserSchema = z.object({
  // Define your schema here
  name: z.string().min(1),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
