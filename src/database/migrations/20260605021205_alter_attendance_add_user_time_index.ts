import { Kysely, sql } from 'kysely'

// Composite index supports the hot mobile queries that filter on userId
// then a serverTime range:
//   - GET /mobile/attendances/calendar  (findMonthlyByUser)
//   - findTodayStatus
//   - findAll with userId + from/to
// Without it, every call does a full attendance scan, which scales
// linearly with table size and makes the calendar endpoint visibly slow.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS attendance_user_id_server_time_idx
    ON attendance ("userId", "serverTime")
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS attendance_user_id_server_time_idx`.execute(db)
}
