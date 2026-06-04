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
