import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // await db.schema
  //   .createTable('your_table')
  //   .addColumn('id', 'serial', (col) => col.primaryKey())
  //   .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // await db.schema.dropTable('your_table').execute()
}
