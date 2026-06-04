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
   * Upsert (userId, platform) → fcmToken. One device per platform per user
   * keeps the FCM fan-out cheap and avoids stale tokens piling up when the
   * user reinstalls the app.
   */
  async upsertDevice(userId: string, fcmToken: string, platform: string) {
    return await db
      .insertInto('user_devices')
      .values({
        userId,
        fcmToken,
        platform,
        updatedAt: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'platform']).doUpdateSet({
          fcmToken,
          updatedAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirst()
  }
}
