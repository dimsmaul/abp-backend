import { z } from 'zod'

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().nullable().optional(),
})

export type UpdateMeInput = z.infer<typeof updateMeSchema>
