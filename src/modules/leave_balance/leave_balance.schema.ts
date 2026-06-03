import { z } from '../../lib/openapi'

export const updateLeaveBalanceSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  totalDays: z.number().min(0).max(365),
  usedDays: z.number().min(0).max(365).optional(),
  notes: z.string().optional(),
})

export type UpdateLeaveBalanceInput = z.infer<typeof updateLeaveBalanceSchema>
