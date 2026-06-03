import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('leave_balance')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'text', (col) => col.references('user.id').onDelete('cascade').notNull())
    .addColumn('year', 'integer', (col) => col.notNull())
    .addColumn('total_days', sql`numeric(5,1)`, (col) => col.notNull().defaultTo(12.0))
    .addColumn('used_days', sql`numeric(5,1)`, (col) => col.notNull().defaultTo(0.0))
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('leave_balance_user_year_unique', ['user_id', 'year'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('leave_balance').execute()
}
