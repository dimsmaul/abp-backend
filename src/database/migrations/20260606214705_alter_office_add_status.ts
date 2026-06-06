import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('office')
    .addColumn('status', 'varchar(16)', (col) =>
      col.notNull().defaultTo('active'),
    )
    .execute()

  // Constrain to known values so a stray write can't silently disable
  // every office.
  await sql`alter table office add constraint office_status_check
            check (status in ('active','disabled'))`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`alter table office drop constraint if exists office_status_check`.execute(db)
  await db.schema.alterTable('office').dropColumn('status').execute()
}
