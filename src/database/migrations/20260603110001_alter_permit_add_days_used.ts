import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('permit')
    .addColumn('daysUsed', sql`numeric(5,1)`, (col) => col.defaultTo(0))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('permit').dropColumn('daysUsed').execute()
}
