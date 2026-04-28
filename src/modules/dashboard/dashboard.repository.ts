import { db } from '../../lib/database'
import { sql } from 'kysely'

export class DashboardRepository {
  async getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [presentCount, reportCount, employeeCount] = await Promise.all([
      db
        .selectFrom('attendance')
        .select(sql`count(distinct "userId")`.as('count'))
        .where('serverTime', '>=', today)
        .executeTakeFirst(),
      db
        .selectFrom('fieldReport')
        .select(sql`count(*)`.as('count'))
        .where('status', '=', 'pending')
        .executeTakeFirst(),
      db
        .selectFrom('user')
        .select(sql`count(*)`.as('count'))
        .where('role', '=', 'employee')
        .executeTakeFirst(),
    ])

    return {
      todayPresent: Number(presentCount?.count ?? 0),
      totalEmployees: Number(employeeCount?.count ?? 0),
      pendingReports: Number(reportCount?.count ?? 0)
    }
  }

  async findPointsByDate(start: Date, end: Date) {
    return await db
      .selectFrom('attendance')
      .innerJoin('user', 'user.id', 'attendance.userId')
      .select([
        'attendance.id as attendanceId',
        'attendance.userId',
        'user.name as userName',
        'attendance.type',
        'attendance.latitude',
        'attendance.longitude',
        'attendance.locationName',
        'attendance.isWithinZone',
        'attendance.serverTime',
      ])
      .where('attendance.serverTime', '>=', start)
      .where('attendance.serverTime', '<=', end)
      .execute()
  }
}
