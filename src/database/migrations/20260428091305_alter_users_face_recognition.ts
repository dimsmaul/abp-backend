import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user")
    .addColumn("faceEmbedding", "text") // store as JSON string or text for simplicity in MVP
    .addColumn("faceRecognitionEnabled", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user")
    .dropColumn("faceEmbedding")
    .dropColumn("faceRecognitionEnabled")
    .execute();
}
