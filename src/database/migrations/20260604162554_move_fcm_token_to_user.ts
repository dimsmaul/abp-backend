import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('fcmToken', 'text')
    .execute()

  await db.schema.dropTable('user_devices').ifExists().execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_devices')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('fcmToken', 'text', (col) => col.notNull())
    .addColumn('platform', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('user_devices_user_platform_idx')
    .on('user_devices')
    .columns(['userId', 'platform'])
    .unique()
    .execute()

  await db.schema.alterTable('user').dropColumn('fcmToken').execute()
}
