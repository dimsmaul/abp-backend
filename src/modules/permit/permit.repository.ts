import { db } from '../../lib/database'
import { PermitTable } from '../../lib/types'
import { sql } from 'kysely'

export class PermitRepository {
  async create(data: Omit<PermitTable, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const id = crypto.randomUUID()
    return await db
      .insertInto('permit')
      .values({
        id,
        ...data,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findAll(filters: {
    page: number
    limit: number
    userId?: string
    status?: PermitTable['status']
  }) {
    let query = db
      .selectFrom('permit')
      .innerJoin('user', 'user.id', 'permit.userId')
      .select([
        'permit.id',
        'permit.userId',
        'permit.type',
        'permit.description',
        'permit.startDate',
        'permit.endDate',
        'permit.attachmentUrl',
        'permit.status',
        'permit.notes',
        'permit.createdAt',
        'user.name as userName',
        'user.department as userDepartment',
      ])

    if (filters.userId) {
      query = query.where('permit.userId', '=', filters.userId)
    }

    if (filters.status) {
      query = query.where('permit.status', '=', filters.status)
    }

    const offset = (filters.page - 1) * filters.limit

    const [items, countResult] = await Promise.all([
      query.limit(filters.limit).offset(offset).orderBy('permit.createdAt', 'desc').execute(),
      query.select(sql`count(*)`.as('count')).executeTakeFirst(),
    ])

    const total = Number(countResult?.count ?? 0)

    return {
      items,
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult?.count ?? 0),
    }
  }

  async findByUserId(userId: string) {
    return await db
      .selectFrom('permit')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute()
  }

  async findById(id: string) {
    return await db
      .selectFrom('permit')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async validate(id: string, data: { status: 'approved' | 'rejected'; notes?: string }) {
    return await db
      .updateTable('permit')
      .set({
        status: data.status,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }
}
