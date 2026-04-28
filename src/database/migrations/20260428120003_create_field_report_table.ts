import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("fieldReport")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("userId", "text", (col) => col.references("user.id").onDelete("cascade").notNull())
    .addColumn("category", "text", (col) => col.notNull()) // weather, technical, progress, other
    .addColumn("description", "text", (col) => col.notNull())
    .addColumn("photoUrl", "text", (col) => col.notNull())
    .addColumn("latitude", sql`decimal(10,7)`, (col) => col.notNull())
    .addColumn("longitude", sql`decimal(10,7)`, (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull().defaultTo("pending"))
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("fieldReport").execute();
}
