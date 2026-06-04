import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_devices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('userId', 'text', (col) =>
      col.references('user.id').onDelete('cascade').notNull(),
    )
    .addColumn('fcmToken', 'text', (col) => col.notNull())
    .addColumn('platform', sql`varchar(20)`, (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  // One token per (user, platform). Upsert on (userId, platform).
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_devices_user_platform_uidx ON user_devices ("userId", platform)`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS user_devices_user_platform_uidx`.execute(db)
  await db.schema.dropTable('user_devices').execute()
}
