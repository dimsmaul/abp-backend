import { z } from 'zod'

export const createReportSchema = z.object({
  category: z.enum(['weather', 'technical', 'progress', 'other']),
  description: z.string().min(10).max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export const validateReportSchema = z.object({
  status: z.enum(['approved', 'rejected', 'need_revision']),
  notes: z.string().optional(),
})

export const reportQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['pending', 'approved', 'rejected', 'need_revision']).optional(),
  category: z.enum(['weather', 'technical', 'progress', 'other']).optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
export type ValidateReportInput = z.infer<typeof validateReportSchema>
export type ReportQuery = z.infer<typeof reportQuerySchema>
