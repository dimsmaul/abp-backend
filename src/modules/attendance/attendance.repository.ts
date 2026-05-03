import { db } from '../../lib/database'
import { AttendanceTable } from '../../lib/types'
import { sql } from 'kysely'

export class AttendanceRepository {
  async create(data: Omit<AttendanceTable, 'createdAt'>) {
    return await db
      .insertInto('attendance')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findTodayStatus(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await db
      .selectFrom('attendance')
      .selectAll()
      .where('userId', '=', userId)
      .where('serverTime', '>=', today)
      .orderBy('serverTime', 'desc')
      .execute()
  }

  async findAll(filters: {
    page: number
    limit: number
    userId?: string
    from?: string
    to?: string
    department?: string
    type?: 'check_in' | 'check_out'
  }) {
    let base = db
      .selectFrom('attendance')
      .innerJoin('user', 'user.id', 'attendance.userId')

    if (filters.userId) {
      base = base.where('attendance.userId', '=', filters.userId)
    }
    if (filters.from) {
      base = base.where('attendance.serverTime', '>=', new Date(filters.from))
    }
    if (filters.to) {
      base = base.where('attendance.serverTime', '<=', new Date(filters.to))
    }
    if (filters.department) {
      base = base.where('user.department', '=', filters.department)
    }
    if (filters.type) {
      base = base.where('attendance.type', '=', filters.type)
    }

    const offset = (filters.page - 1) * filters.limit

    const [items, countResult] = await Promise.all([
      base
        .select([
          'attendance.id',
          'attendance.type',
          'attendance.photoUrl',
          'attendance.latitude',
          'attendance.longitude',
          'attendance.locationName',
          'attendance.isWithinZone',
          'attendance.serverTime',
          'user.id as userId',
          'user.name as userName',
          'user.department as userDepartment',
        ])
        .limit(filters.limit)
        .offset(offset)
        .orderBy('attendance.serverTime', 'desc')
        .execute(),
      base.select(sql<string>`count(*)`.as('count')).executeTakeFirst(),
    ])

    const total = Number(countResult?.count ?? 0)

    return {
      items,
      page: filters.page,
      limit: filters.limit,
      total,
    }
  }

  async findRecapData(filters: {
    from: string
    to: string
    userId?: string
    department?: string
  }) {
    let query = db
      .selectFrom('attendance')
      .innerJoin('user', 'user.id', 'attendance.userId')
      .select([
        'attendance.userId',
        'attendance.type',
        'attendance.serverTime',
        'attendance.isWithinZone',
        'user.name as userName',
        'user.department as userDepartment',
      ])
      .where('attendance.serverTime', '>=', new Date(filters.from))
      .where('attendance.serverTime', '<=', new Date(filters.to))
      .orderBy('attendance.userId')
      .orderBy('attendance.serverTime', 'asc')

    if (filters.userId) {
      query = query.where('attendance.userId', '=', filters.userId)
    }

    if (filters.department) {
      query = query.where('user.department', '=', filters.department)
    }

    return await query.execute()
  }

  async findMapPoints(start: Date, end: Date) {
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
