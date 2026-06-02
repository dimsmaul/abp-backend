import { z } from '../../lib/openapi'

export const createOfficeSchema = z.object({
  name: z.string().min(1),
  zoneType: z.enum(['radius', 'polygon']).default('radius'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().int().min(10).optional(),
  polygon: z.array(z.array(z.number()).length(2)).min(3).optional().nullable(),
  address: z.string().optional(),
}).refine(
  (data) => {
    if (data.zoneType === 'radius') {
      return data.latitude !== undefined && data.longitude !== undefined && data.radius !== undefined
    }
    if (data.zoneType === 'polygon') {
      return Array.isArray(data.polygon) && data.polygon.length >= 3
    }
    return true
  },
  { message: 'Missing required fields for selected zoneType' }
)

export const updateOfficeSchema = z.object({
  name: z.string().min(1).optional(),
  zoneType: z.enum(['radius', 'polygon']).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  radius: z.number().int().min(10).optional().nullable(),
  polygon: z.array(z.array(z.number()).length(2)).min(3).optional().nullable(),
  address: z.string().optional().nullable(),
})

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>
