import { z } from '../../lib/openapi'

// HH:MM or HH:MM:SS — Postgres `time` accepts both.
const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'expected HH:MM or HH:MM:SS')

export const createOfficeSchema = z.object({
  name: z.string().min(1),
  zoneType: z.enum(['radius', 'polygon']).default('radius'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  radius: z.number().int().min(10).optional().nullable(),
  polygon: z.array(z.array(z.number()).length(2)).min(3).optional().nullable(),
  address: z.string().optional(),
  province: z.string().optional().nullable(),
  regency: z.string().optional().nullable(),
  workStartTime: timeString.optional().nullable(),
  workEndTime: timeString.optional().nullable(),
  lateThresholdMinutes: z.number().int().min(0).max(240).optional().nullable(),
})

export const updateOfficeSchema = z.object({
  name: z.string().min(1).optional(),
  zoneType: z.enum(['radius', 'polygon']).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  radius: z.number().int().min(10).optional().nullable(),
  polygon: z.array(z.array(z.number()).length(2)).min(3).optional().nullable(),
  address: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  regency: z.string().optional().nullable(),
  workStartTime: timeString.optional().nullable(),
  workEndTime: timeString.optional().nullable(),
  lateThresholdMinutes: z.number().int().min(0).max(240).optional().nullable(),
})

// Mobile presence flow: filter offices the user is potentially inside.
// regency is reverse-geocoded on the device.
export const findOfficesQuerySchema = z.object({
  regency: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
})

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>
export type FindOfficesQuery = z.infer<typeof findOfficesQuerySchema>
