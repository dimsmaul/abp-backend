import { db } from '../../lib/database'
import { UserTable } from '../../lib/types'
import { sql } from 'kysely'

export class UserRepository {
  async findAll(filters: {
    page: number
    limit: number
    role?: string
    department?: string
    search?: string
  }) {
    let query = db
      .selectFrom('user')
      .select([
        'id',
        'name',
        'email',
        'role',
        'department',
        'createdAt',
      ])

    if (filters.role) {
      query = query.where('role', '=', filters.role as any)
    }

    if (filters.department) {
      query = query.where('department', '=', filters.department)
    }

    if (filters.search) {
      const search = `%${filters.search}%`
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', search),
          eb('email', 'ilike', search),
        ])
      )
    }

    const offset = (filters.page - 1) * filters.limit

    const [items, countResult] = await Promise.all([
      query.limit(filters.limit).offset(offset).orderBy('createdAt', 'desc').execute(),
      db.selectFrom('user')
        .select(sql`count(*)`.as('count'))
        .executeTakeFirst(),
    ])

    const total = Number(countResult?.count ?? 0)

    return {
      items,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    }
  }

  async findById(id: string) {
    return await db.selectFrom('user').selectAll().where('id', '=', id).executeTakeFirst()
  }

  async findByIdWithStats(id: string) {
    const user = await db
      .selectFrom('user')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    if (!user) return null

    const [attendanceCount, reportCount] = await Promise.all([
      db
        .selectFrom('attendance')
        .select(sql`count(*)`.as('count'))
        .where('userId', '=', id)
        .executeTakeFirst(),
      db
        .selectFrom('fieldReport')
        .select(sql`count(*)`.as('count'))
        .where('userId', '=', id)
        .executeTakeFirst(),
    ])

    return {
      ...user,
      stats: {
        totalAttendances: Number(attendanceCount?.count ?? 0),
        totalReports: Number(reportCount?.count ?? 0),
      },
    }
  }

  async create(data: Omit<UserTable, 'createdAt' | 'updatedAt' | 'emailVerified'>) {
    return await db
      .insertInto('user')
      .values({
        ...data,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async update(id: string, data: Partial<Omit<UserTable, 'id' | 'createdAt'>>) {
    return await db
      .updateTable('user')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }
}
