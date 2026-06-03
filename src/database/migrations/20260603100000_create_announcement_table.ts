import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('announcement')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('title', sql`varchar(200)`, (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('priority', sql`varchar(10)`, (col) =>
      col.notNull().defaultTo('normal'),
    )
    .addColumn('isPinned', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('publishedBy', 'text', (col) =>
      col.references('user.id').notNull(),
    )
    .addColumn('publishedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('expiresAt', 'timestamp')
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint(
      'announcement_priority_check',
      sql`priority IN ('low', 'normal', 'high')`,
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('announcement').execute()
}
