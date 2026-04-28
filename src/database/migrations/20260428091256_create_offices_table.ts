import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("office")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("latitude", sql`decimal(10,7)`, (col) => col.notNull())
    .addColumn("longitude", sql`decimal(10,7)`, (col) => col.notNull())
    .addColumn("radius", "integer", (col) => col.notNull().defaultTo(100)) // radius in meters
    .addColumn("address", "text")
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("office").execute();
}
