import { z } from 'zod'

export const checkInSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export const checkOutSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  from: z.string().optional(),
  to: z.string().optional(),
  userId: z.string().optional(),
  department: z.string().optional(),
  type: z.enum(['check_in', 'check_out']).optional(),
})

export const recapQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
  userId: z.string().optional(),
  department: z.string().optional(),
})

export type CheckInInput = z.infer<typeof checkInSchema>
export type CheckOutInput = z.infer<typeof checkOutSchema>
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>
export type RecapQuery = z.infer<typeof recapQuerySchema>
