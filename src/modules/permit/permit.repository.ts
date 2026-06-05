import { db } from '../../lib/database'
import { PermitTable } from '../../lib/types'
import { sql } from 'kysely'

export class PermitRepository {
  async create(data: Omit<PermitTable, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { daysUsed?: number | null }) {
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
    category?: PermitTable['category']
  }) {
    // Build a shared base WHERE chain. Selects are layered on top per
    // query — combining count(*) on a builder that already has column
    // selects would produce `SELECT col1, …, count(*)` without GROUP BY
    // and explode at runtime (was returning 500 to the admin list page).
    let base = db
      .selectFrom('permit')
      .innerJoin('user', 'user.id', 'permit.userId')

    if (filters.userId) {
      base = base.where('permit.userId', '=', filters.userId)
    }
    if (filters.status) {
      base = base.where('permit.status', '=', filters.status)
    }
    if (filters.category) {
      base = base.where('permit.category', '=', filters.category)
    }

    const offset = (filters.page - 1) * filters.limit

    const [rows, countResult] = await Promise.all([
      base
        .select([
          'permit.id',
          'permit.userId',
          'permit.type',
          'permit.category',
          'permit.description',
          'permit.startDate',
          'permit.endDate',
          'permit.attachmentUrl',
          'permit.status',
          'permit.notes',
          'permit.overtimeHours',
          'permit.reimburseAmount',
          'permit.reimburseReceiptUrl',
          'permit.loanAmount',
          'permit.loanTenorMonths',
          'permit.createdAt',
          'user.name as userName',
          'user.department as userDepartment',
        ])
        .limit(filters.limit)
        .offset(offset)
        .orderBy('permit.createdAt', 'desc')
        .execute(),
      base.select(sql`count(*)`.as('count')).executeTakeFirst(),
    ])

    const items = rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      category: r.category,
      description: r.description,
      startDate: r.startDate,
      endDate: r.endDate,
      attachmentUrl: r.attachmentUrl,
      status: r.status,
      notes: r.notes,
      overtimeHours: r.overtimeHours,
      reimburseAmount: r.reimburseAmount,
      reimburseReceiptUrl: r.reimburseReceiptUrl,
      loanAmount: r.loanAmount,
      loanTenorMonths: r.loanTenorMonths,
      createdAt: r.createdAt,
      user: {
        id: r.userId,
        name: r.userName,
        department: r.userDepartment,
      },
    }))

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
