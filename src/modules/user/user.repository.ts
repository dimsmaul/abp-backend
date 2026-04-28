import { db } from '../../lib/database'

export class UserRepository {
  async findAll() {
    // return await db.selectFrom('users').selectAll().execute()
    return []
  }

  async findById(id: string | number) {
    // return await db.selectFrom('users').selectAll().where('id', '=', id as any).executeTakeFirst()
    return null
  }

  async create(data: any) {
    // return await db.insertInto('users').values(data).returningAll().executeTakeFirst()
    return data
  }
}
