import { db } from '../../lib/database'
import { UserTable } from '../../lib/types'

export class UserRepository {
  async findAll() {
    return await db.selectFrom('user').selectAll().execute()
  }

  async findById(id: string) {
    return await db.selectFrom('user').selectAll().where('id', '=', id).executeTakeFirst()
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
