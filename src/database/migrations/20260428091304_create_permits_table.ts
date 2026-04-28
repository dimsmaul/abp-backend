import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("permit")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("userId", "text", (col) => col.references("user.id").onDelete("cascade").notNull())
    .addColumn("type", "text", (col) => col.notNull()) // sick, leave, permit
    .addColumn("description", "text", (col) => col.notNull())
    .addColumn("startDate", "timestamp", (col) => col.notNull())
    .addColumn("endDate", "timestamp", (col) => col.notNull())
    .addColumn("attachmentUrl", "text")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("pending")) // pending, approved, rejected
    .addColumn("notes", "text")
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("permit").execute();
}
