import { db } from '../../lib/database'
import { FieldReportTable, ReportValidationTable } from '../../lib/types'
import { sql } from 'kysely'

export class ReportRepository {
  async create(data: Omit<FieldReportTable, 'createdAt'>) {
    return await db
      .insertInto('fieldReport')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findById(id: string) {
    return await db
      .selectFrom('fieldReport')
      .leftJoin('reportValidation', 'reportValidation.reportId', 'fieldReport.id')
      .innerJoin('user', 'user.id', 'fieldReport.userId')
      .select([
        'fieldReport.id',
        'fieldReport.category',
        'fieldReport.description',
        'fieldReport.photoUrl',
        'fieldReport.latitude',
        'fieldReport.longitude',
        'fieldReport.status',
        'fieldReport.createdAt',
        'user.name as userName',
        'user.department as userDepartment',
        'reportValidation.status as validationStatus',
        'reportValidation.notes as validationNotes',
        'reportValidation.validatedAt as validationDate',
      ])
      .where('fieldReport.id', '=', id)
      .executeTakeFirst()
  }

  async findAll(filters: {
    page: number
    limit: number
    status?: string
    category?: string
    userId?: string
    from?: string
    to?: string
  }) {
    let query = db
      .selectFrom('fieldReport')
      .innerJoin('user', 'user.id', 'fieldReport.userId')
      .select([
        'fieldReport.id',
        'fieldReport.category',
        'fieldReport.description',
        'fieldReport.photoUrl',
        'fieldReport.status',
        'fieldReport.createdAt',
        'user.name as userName',
        'user.department as userDepartment',
      ])

    if (filters.status) {
      query = query.where('fieldReport.status', '=', filters.status as any)
    }

    if (filters.category) {
      query = query.where('fieldReport.category', '=', filters.category as any)
    }

    if (filters.userId) {
      query = query.where('fieldReport.userId', '=', filters.userId)
    }

    if (filters.from) {
      query = query.where('fieldReport.createdAt', '>=', new Date(filters.from))
    }

    if (filters.to) {
      query = query.where('fieldReport.createdAt', '<=', new Date(filters.to))
    }

    const offset = (filters.page - 1) * filters.limit

    const [items, countResult] = await Promise.all([
      query.limit(filters.limit).offset(offset).orderBy('fieldReport.createdAt', 'desc').execute(),
      query.select(sql`count(*)`.as('count')).executeTakeFirst(),
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

  async validate(reportId: string, validationData: Omit<ReportValidationTable, 'validatedAt'>) {
    return await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('reportValidation')
        .values(validationData)
        .execute()

      await trx
        .updateTable('fieldReport')
        .set({ status: validationData.status as any })
        .where('id', '=', reportId)
        .execute()
    })
  }
}
