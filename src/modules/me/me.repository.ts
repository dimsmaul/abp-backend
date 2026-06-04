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

  /**
   * One FCM token per user — overwrites any previously stored token so the
   * old device stops getting pushes. Latest registration wins.
   */
  async setFcmToken(userId: string, fcmToken: string) {
    return await db
      .updateTable('user')
      .set({ fcmToken, updatedAt: new Date() })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst()
  }
}
