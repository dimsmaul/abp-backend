import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('office')
    .addColumn('workStartTime', 'time', (col) => col.defaultTo('08:00:00'))
    .addColumn('workEndTime', 'time', (col) => col.defaultTo('17:00:00'))
    .addColumn('lateThresholdMinutes', 'integer', (col) => col.defaultTo(15))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('office')
    .dropColumn('workStartTime')
    .dropColumn('workEndTime')
    .dropColumn('lateThresholdMinutes')
    .execute()
}
