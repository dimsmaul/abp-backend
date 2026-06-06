import { db } from '../../lib/database'
import { OfficeTable } from '../../lib/types'
import { sql } from 'kysely'

export class OfficeRepository {
  async create(data: Omit<OfficeTable, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID()
    return await db
      .insertInto('office')
      .values({
        id,
        ...data,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findAll(filters: {
    page: number
    limit: number
    regency?: string
    /** 'active' | 'disabled' | 'all'. Repository-level safety net: when
     * omitted we default to 'active' so a forgotten filter at the
     * module layer can't accidentally include disabled offices in a
     * mobile presence call. */
    status?: 'active' | 'disabled' | 'all'
  }) {
    const offset = (filters.page - 1) * filters.limit
    const status = filters.status ?? 'active'
    const applyFilters = <T extends { where: (...args: any[]) => T }>(q: T): T => {
      let out = q
      if (filters.regency) {
        out = out.where(sql<boolean>`lower(regency) like ${'%' + filters.regency.toLowerCase() + '%'}`)
      }
      if (status !== 'all') {
        out = out.where('status', '=', status)
      }
      return out
    }
    const baseList = () => applyFilters(db.selectFrom('office').selectAll())
    const baseCount = () =>
      applyFilters(db.selectFrom('office').select(sql`count(*)`.as('count')))
    const [items, countResult] = await Promise.all([
      baseList()
        .orderBy('name', 'asc')
        .limit(filters.limit)
        .offset(offset)
        .execute(),
      baseCount().executeTakeFirst(),
    ])
    return {
      items,
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult?.count ?? 0),
    }
  }

  async findById(id: string) {
    return await db
      .selectFrom('office')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async update(id: string, data: Partial<Omit<OfficeTable, 'id' | 'createdAt'>>) {
    return await db
      .updateTable('office')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async delete(id: string) {
    return await db
      .deleteFrom('office')
      .where('id', '=', id)
      .execute()
  }
}
