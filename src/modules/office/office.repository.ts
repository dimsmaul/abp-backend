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

  async findAll(filters: { page: number; limit: number }) {
    const offset = (filters.page - 1) * filters.limit
    const [items, countResult] = await Promise.all([
      db
        .selectFrom('office')
        .selectAll()
        .orderBy('name', 'asc')
        .limit(filters.limit)
        .offset(offset)
        .execute(),
      db.selectFrom('office').select(sql`count(*)`.as('count')).executeTakeFirst(),
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
