import { db } from '../../lib/database'
import { UserTable } from '../../lib/types'

export class MeRepository {
  async findById(id: string) {
    return await db
      .selectFrom('user')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<UserTable, 'name' | 'department'>>,
  ) {
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

  async updateImage(id: string, imageUrl: string) {
    return await db
      .updateTable('user')
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async updateFaceEmbedding(id: string, embeddingJson: string) {
    return await db
      .updateTable('user')
      .set({
        faceEmbedding: embeddingJson,
        faceRecognitionEnabled: true,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }
}
