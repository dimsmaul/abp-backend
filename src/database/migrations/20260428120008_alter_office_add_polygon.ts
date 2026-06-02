import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("office")
    .addColumn("zone_type", sql`varchar(10)`, (col) =>
      col.notNull().defaultTo("radius")
    )
    .addColumn("polygon", "jsonb")
    .execute();

  await sql`ALTER TABLE "office" ADD CONSTRAINT office_zone_type_check CHECK (zone_type IN ('radius','polygon'))`.execute(db);

  await sql`ALTER TABLE "office" ALTER COLUMN "latitude" DROP NOT NULL`.execute(db);
  await sql`ALTER TABLE "office" ALTER COLUMN "longitude" DROP NOT NULL`.execute(db);
  await sql`ALTER TABLE "office" ALTER COLUMN "radius" DROP NOT NULL`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "office" ALTER COLUMN "radius" SET NOT NULL`.execute(db);
  await sql`ALTER TABLE "office" ALTER COLUMN "longitude" SET NOT NULL`.execute(db);
  await sql`ALTER TABLE "office" ALTER COLUMN "latitude" SET NOT NULL`.execute(db);
  await sql`ALTER TABLE "office" DROP CONSTRAINT IF EXISTS office_zone_type_check`.execute(db);

  await db.schema
    .alterTable("office")
    .dropColumn("polygon")
    .dropColumn("zone_type")
    .execute();
}
