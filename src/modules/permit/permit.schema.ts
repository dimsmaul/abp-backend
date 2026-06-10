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
  // Accept the new categories here too so direct API callers don't have to
  // smuggle them under type='permit'. Mobile still sends type='permit' for
  // overtime/reimburse/loan and puts the real value in `category`.
  type: z.enum(['sick', 'leave', 'permit', 'overtime', 'reimburse', 'loan']),
  category: z
    .enum(['leave', 'sick', 'permit', 'overtime', 'reimburse', 'loan'])
    .optional(),
  description: z.string().min(1),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  attachmentUrl: httpUrl.optional(),
  // `z.coerce.number()` so multipart string payloads validate too.
  overtimeHours: z.coerce.number().positive().max(24).optional(),
  reimburseAmount: z.coerce.number().positive().optional(),
  reimburseReceiptUrl: httpUrl.optional(),
  loanAmount: z.coerce.number().positive().optional(),
  loanTenorMonths: z.coerce.number().int().positive().max(120).optional(),
})

export const validatePermitSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

export type CreatePermitInput = z.infer<typeof createPermitSchema>
export type ValidatePermitInput = z.infer<typeof validatePermitSchema>
