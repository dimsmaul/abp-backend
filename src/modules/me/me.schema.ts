import { z } from 'zod'

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  department: z.string().nullable().optional(),
})

export type UpdateMeInput = z.infer<typeof updateMeSchema>

// MobileFaceNet on-device produces a 192-d float embedding. The vector
// arrives as a JSON array of numbers; we validate shape and finiteness so
// downstream cosine-similarity math can't NaN out.
export const enrollFaceSchema = z.object({
  embedding: z
    .array(z.number().finite())
    .length(192, 'embedding must have exactly 192 dimensions'),
})

export type EnrollFaceInput = z.infer<typeof enrollFaceSchema>

// One FCM token per user — stored directly on `user.fcmToken`. Platform is
// no longer tracked since the mobile app is the only consumer that needs
// the token registered.
export const registerDeviceSchema = z.object({
  fcmToken: z.string().min(10),
  platform: z.enum(['android', 'ios', 'web']).optional(),
})

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>
