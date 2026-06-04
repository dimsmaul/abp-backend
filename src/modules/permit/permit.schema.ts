import { z } from '../../lib/openapi'

const httpUrl = z
  .url()
  .refine(
    (v) => {
      try {
        const p = new URL(v).protocol
        return p === 'http:' || p === 'https:'
      } catch {
        return false
      }
    },
    { message: 'URL must use http or https scheme' },
  )

// Multi-category pengajuan. Existing 'sick' | 'leave' | 'permit' stays as-is;
// new categories ('overtime' | 'reimburse' | 'loan') unlock extra optional
// fields. Per-category validation lives in the module so the schema stays a
// simple optional-field bag.
export const createPermitSchema = z.object({
  type: z.enum(['sick', 'leave', 'permit']),
  category: z
    .enum(['leave', 'sick', 'permit', 'overtime', 'reimburse', 'loan'])
    .optional(),
  description: z.string().min(1),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  attachmentUrl: httpUrl.optional(),
  overtimeHours: z.number().positive().max(24).optional(),
  reimburseAmount: z.number().positive().optional(),
  reimburseReceiptUrl: httpUrl.optional(),
  loanAmount: z.number().positive().optional(),
  loanTenorMonths: z.number().int().positive().max(120).optional(),
})

export const validatePermitSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

export type CreatePermitInput = z.infer<typeof createPermitSchema>
export type ValidatePermitInput = z.infer<typeof validatePermitSchema>
