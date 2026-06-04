import { AnnouncementRepository, type AnnouncementPriority } from './announcement.repository'
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcement.schema'
import { broadcast as fcmBroadcast } from '../../lib/fcm'

export class AnnouncementModule {
  private repository = new AnnouncementRepository()

  async fetchAllWeb(query: { page?: string; limit?: string; priority?: string }) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const priority = (['low', 'normal', 'high'] as const).includes(query.priority as any)
      ? (query.priority as AnnouncementPriority)
      : undefined
    const data = await this.repository.findAllWeb({ page, limit, priority })
    return { data, status: 200 }
  }

  async fetchAllMobile(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const data = await this.repository.findAllMobile({ page, limit })
    return { data, status: 200 }
  }

  async fetchOne(id: string) {
    const data = await this.repository.findById(id)
    if (!data) {
      return {
        error: { code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found' },
        status: 404,
      }
    }
    return { data, status: 200 }
  }

  async processCreate(publishedBy: string, body: any) {
    const validated = createAnnouncementSchema.safeParse(body)
    if (!validated.success) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: validated.error.flatten(),
        },
        status: 422,
      }
    }
    const data = await this.repository.create({
      title: validated.data.title,
      body: validated.data.body,
      priority: validated.data.priority,
      isPinned: validated.data.isPinned,
      expiresAt: validated.data.expiresAt ?? null,
      publishedBy,
    })

    // Best-effort push to every registered device. Errors swallowed inside
    // the FCM helper so a flaky push doesn't reject the create response.
    // `data` is technically nullable (insert→findById round-trip), so guard.
    if (data) {
      void fcmBroadcast({
        title: data.title,
        body: data.body,
        data: { announcementId: String(data.id), type: 'announcement' },
      }).catch(() => {})
    }

    return { data, status: 201 }
  }

  async processUpdate(id: string, body: any) {
    const validated = updateAnnouncementSchema.safeParse(body)
    if (!validated.success) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: validated.error.flatten(),
        },
        status: 422,
      }
    }
    const data = await this.repository.update(id, validated.data)
    if (!data) {
      return {
        error: { code: 'ANNOUNCEMENT_NOT_FOUND', message: 'Announcement not found' },
        status: 404,
      }
    }
    return { data, status: 200 }
  }

  async processDelete(id: string) {
    await this.repository.delete(id)
    return { status: 200 }
  }
}
