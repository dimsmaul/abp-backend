import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("attendance")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("userId", "text", (col) => col.references("user.id").onDelete("cascade").notNull())
    .addColumn("type", "text", (col) => col.notNull()) // check_in, check_out
    .addColumn("photoUrl", "text", (col) => col.notNull())
    .addColumn("latitude", sql`decimal(10,7)`, (col) => col.notNull())
    .addColumn("longitude", sql`decimal(10,7)`, (col) => col.notNull())
    .addColumn("locationName", "text")
    .addColumn("isWithinZone", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("serverTime", "timestamp", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("attendance").execute();
}
