import { z } from '../../lib/openapi'

export const createOfficeSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().int().min(10).default(100),
  address: z.string().optional(),
})

export const updateOfficeSchema = createOfficeSchema.partial()

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>
