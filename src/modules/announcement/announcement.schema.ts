import { z } from '../../lib/openapi'

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  isPinned: z.boolean().default(false),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
})

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? undefined : v ? new Date(v) : null)),
})

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
