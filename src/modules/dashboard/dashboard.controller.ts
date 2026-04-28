import { Context } from 'hono'
import { db } from '../../lib/database'
import { sql } from 'kysely'

export class DashboardController {
  async getSummary(c: Context) {
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

    return c.json({
      data: {
        todayPresent: Number(presentCount?.count ?? 0),
        todayAbsent: Number(employeeCount?.count ?? 0) - Number(presentCount?.count ?? 0),
        pendingReports: Number(reportCount?.count ?? 0),
        totalEmployees: Number(employeeCount?.count ?? 0),
      }
    })
  }

  async getMapPoints(c: Context) {
    const date = c.req.query('date') ? new Date(c.req.query('date')!) : new Date()
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const points = await db
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
      .where('attendance.serverTime', '>=', startOfDay)
      .where('attendance.serverTime', '<=', endOfDay)
      .execute()

    return c.json({ data: { points } })
  }
}
