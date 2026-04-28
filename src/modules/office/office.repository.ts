import { db } from '../../lib/database'
import { OfficeTable } from '../../lib/types'

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

  async findAll() {
    return await db
      .selectFrom('office')
      .selectAll()
      .orderBy('name', 'asc')
      .execute()
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
