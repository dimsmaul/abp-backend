import { z } from '../../lib/openapi'

export const createPermitSchema = z.object({
  type: z.enum(['sick', 'leave', 'permit']),
  description: z.string().min(1),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  attachmentUrl: z.url().optional(),
})

export const validatePermitSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

export type CreatePermitInput = z.infer<typeof createPermitSchema>
export type ValidatePermitInput = z.infer<typeof validatePermitSchema>
