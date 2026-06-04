import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('attendance')
    .addColumn('faceScore', sql`decimal(5,4)`)
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('attendance')
    .dropColumn('faceScore')
    .execute()
}
