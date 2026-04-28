import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("reportValidation")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("reportId", "text", (col) => col.references("fieldReport.id").onDelete("cascade").notNull().unique())
    .addColumn("validatedBy", "text", (col) => col.references("user.id").notNull())
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("notes", "text")
    .addColumn("validatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("reportValidation").execute();
}
