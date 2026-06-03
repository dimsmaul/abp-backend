import { db } from '../../lib/database'
import { sql } from 'kysely'

export type AnnouncementPriority = 'low' | 'normal' | 'high'

export interface CreateAnnouncementData {
  title: string
  body: string
  priority: AnnouncementPriority
  isPinned: boolean
  publishedBy: string
  expiresAt?: Date | null
}

export interface UpdateAnnouncementData {
  title?: string
  body?: string
  priority?: AnnouncementPriority
  isPinned?: boolean
  expiresAt?: Date | null
}

function mapRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    priority: r.priority,
    isPinned: r.isPinned,
    publishedAt: r.publishedAt,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    publishedBy: r.publisherId
      ? { id: r.publisherId, name: r.publisherName }
      : { id: r.publishedBy, name: null },
  }
}

export class AnnouncementRepository {
  async create(data: CreateAnnouncementData) {
    const row = await db
      .insertInto('announcement')
      .values({
        title: data.title,
        body: data.body,
        priority: data.priority,
        isPinned: data.isPinned,
        publishedBy: data.publishedBy,
        expiresAt: data.expiresAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    return this.findById(row.id as string)
  }

  async findAllWeb(filters: {
    page: number
    limit: number
    priority?: AnnouncementPriority
  }) {
    let base = db
      .selectFrom('announcement')
      .leftJoin('user', 'user.id', 'announcement.publishedBy')
      .select([
        'announcement.id',
        'announcement.title',
        'announcement.body',
        'announcement.priority',
        'announcement.isPinned',
        'announcement.publishedBy',
        'announcement.publishedAt',
        'announcement.expiresAt',
        'announcement.createdAt',
        'announcement.updatedAt',
        'user.id as publisherId',
        'user.name as publisherName',
      ])

    if (filters.priority) {
      base = base.where('announcement.priority', '=', filters.priority)
    }

    const offset = (filters.page - 1) * filters.limit

    const [rows, countResult] = await Promise.all([
      base
        .orderBy('announcement.isPinned', 'desc')
        .orderBy('announcement.publishedAt', 'desc')
        .limit(filters.limit)
        .offset(offset)
        .execute(),
      (filters.priority
        ? db
            .selectFrom('announcement')
            .where('priority', '=', filters.priority)
            .select(sql`count(*)`.as('count'))
        : db.selectFrom('announcement').select(sql`count(*)`.as('count'))
      ).executeTakeFirst(),
    ])

    return {
      items: rows.map(mapRow),
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult?.count ?? 0),
    }
  }

  async findAllMobile(filters: { page: number; limit: number }) {
    const now = new Date()
    const base = db
      .selectFrom('announcement')
      .leftJoin('user', 'user.id', 'announcement.publishedBy')
      .select([
        'announcement.id',
        'announcement.title',
        'announcement.body',
        'announcement.priority',
        'announcement.isPinned',
        'announcement.publishedBy',
        'announcement.publishedAt',
        'announcement.expiresAt',
        'announcement.createdAt',
        'announcement.updatedAt',
        'user.id as publisherId',
        'user.name as publisherName',
      ])
      .where((eb) =>
        eb.or([
          eb('announcement.expiresAt', 'is', null),
          eb('announcement.expiresAt', '>', now),
        ]),
      )

    const offset = (filters.page - 1) * filters.limit

    const [rows, countResult] = await Promise.all([
      base
        .orderBy('announcement.isPinned', 'desc')
        .orderBy('announcement.publishedAt', 'desc')
        .limit(filters.limit)
        .offset(offset)
        .execute(),
      db
        .selectFrom('announcement')
        .where((eb) =>
          eb.or([
            eb('expiresAt', 'is', null),
            eb('expiresAt', '>', now),
          ]),
        )
        .select(sql`count(*)`.as('count'))
        .executeTakeFirst(),
    ])

    return {
      items: rows.map(mapRow),
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult?.count ?? 0),
    }
  }

  async findById(id: string) {
    const row = await db
      .selectFrom('announcement')
      .leftJoin('user', 'user.id', 'announcement.publishedBy')
      .select([
        'announcement.id',
        'announcement.title',
        'announcement.body',
        'announcement.priority',
        'announcement.isPinned',
        'announcement.publishedBy',
        'announcement.publishedAt',
        'announcement.expiresAt',
        'announcement.createdAt',
        'announcement.updatedAt',
        'user.id as publisherId',
        'user.name as publisherName',
      ])
      .where('announcement.id', '=', id)
      .executeTakeFirst()
    return row ? mapRow(row) : null
  }

  async update(id: string, data: UpdateAnnouncementData) {
    const patch: Record<string, any> = { updatedAt: new Date() }
    if (data.title !== undefined) patch.title = data.title
    if (data.body !== undefined) patch.body = data.body
    if (data.priority !== undefined) patch.priority = data.priority
    if (data.isPinned !== undefined) patch.isPinned = data.isPinned
    if (data.expiresAt !== undefined) patch.expiresAt = data.expiresAt

    const updated = await db
      .updateTable('announcement')
      .set(patch)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
    if (!updated) return null
    return this.findById(id)
  }

  async delete(id: string) {
    return await db.deleteFrom('announcement').where('id', '=', id).execute()
  }
}
