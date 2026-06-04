import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('office')
    .addColumn('province', 'text')
    .addColumn('regency', 'text')
    .execute()

  // Mobile presence flow filters offices by the user's reverse-geocoded
  // regency before doing polygon hit-testing. Index it so the filter stays
  // cheap as the office list grows.
  await sql`create index if not exists office_regency_idx on office (lower(regency))`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`drop index if exists office_regency_idx`.execute(db)
  await db.schema
    .alterTable('office')
    .dropColumn('province')
    .dropColumn('regency')
    .execute()
}
