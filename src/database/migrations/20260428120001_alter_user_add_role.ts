import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user")
    .addColumn("role", "text", (col) => col.notNull().defaultTo("employee"))
    .addColumn("department", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("user").dropColumn("department").execute();
  await db.schema.alterTable("user").dropColumn("role").execute();
}
