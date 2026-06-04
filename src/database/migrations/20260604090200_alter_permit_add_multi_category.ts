import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('permit')
    .addColumn('category', sql`varchar(20)`, (col) =>
      col.notNull().defaultTo('leave'),
    )
    .addColumn('overtimeHours', sql`decimal(5,2)`)
    .addColumn('reimburseAmount', sql`decimal(15,2)`)
    .addColumn('reimburseReceiptUrl', 'text')
    .addColumn('loanAmount', sql`decimal(15,2)`)
    .addColumn('loanTenorMonths', 'integer')
    .execute()

  await sql`ALTER TABLE "permit" ADD CONSTRAINT permit_category_check CHECK (category IN ('leave','sick','permit','overtime','reimburse','loan'))`.execute(db)

  // Backfill: align category with existing `type` so historical rows look
  // consistent ('sick'|'leave'|'permit' overlap with the new enum 1:1).
  await sql`UPDATE "permit" SET category = type WHERE type IN ('sick','leave','permit')`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "permit" DROP CONSTRAINT IF EXISTS permit_category_check`.execute(db)
  await db.schema
    .alterTable('permit')
    .dropColumn('category')
    .dropColumn('overtimeHours')
    .dropColumn('reimburseAmount')
    .dropColumn('reimburseReceiptUrl')
    .dropColumn('loanAmount')
    .dropColumn('loanTenorMonths')
    .execute()
}
