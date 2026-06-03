import { db } from '../../lib/database'
import { sql } from 'kysely'

export class LeaveBalanceRepository {
  /**
   * Fetch (or auto-create at default 12) the leave balance row for a given
   * user / year. Encapsulates the "missing means fresh 12-day allowance" rule
   * so callers don't have to special-case it.
   */
  async getOrCreate(userId: string, year: number) {
    const existing = await db
      .selectFrom('leave_balance')
      .selectAll()
      .where('user_id', '=', userId)
      .where('year', '=', year)
      .executeTakeFirst()

    if (existing) return existing

    return await db
      .insertInto('leave_balance')
      .values({
        user_id: userId,
        year,
        total_days: 12,
        used_days: 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findAll(filters: { page: number; limit: number; year: number }) {
    const { page, limit, year } = filters
    const offset = (page - 1) * limit

    // Outer join so users without a balance row still surface in admin view
    // with implicit defaults (12 / 0). Lets admin top-up before any cuti.
    const rows = await db
      .selectFrom('user')
      .leftJoin('leave_balance', (join) =>
        join
          .onRef('leave_balance.user_id', '=', 'user.id')
          .on('leave_balance.year', '=', year),
      )
      .select([
        'user.id as userId',
        'user.name as userName',
        'user.department as userDepartment',
        'leave_balance.year',
        'leave_balance.total_days',
        'leave_balance.used_days',
        'leave_balance.notes',
      ])
      .orderBy('user.name', 'asc')
      .limit(limit)
      .offset(offset)
      .execute()

    const countResult = await db
      .selectFrom('user')
      .select(sql`count(*)`.as('count'))
      .executeTakeFirst()

    const items = rows.map((r: any) => {
      const totalDays = r.total_days != null ? Number(r.total_days) : 12
      const usedDays = r.used_days != null ? Number(r.used_days) : 0
      return {
        userId: r.userId,
        year: r.year ?? year,
        totalDays,
        usedDays,
        remainingDays: totalDays - usedDays,
        notes: r.notes ?? null,
        user: {
          id: r.userId,
          name: r.userName,
          department: r.userDepartment,
        },
      }
    })

    return {
      items,
      page,
      limit,
      total: Number(countResult?.count ?? 0),
    }
  }

  async upsert(userId: string, data: { year: number; totalDays: number; usedDays?: number; notes?: string }) {
    const existing = await db
      .selectFrom('leave_balance')
      .selectAll()
      .where('user_id', '=', userId)
      .where('year', '=', data.year)
      .executeTakeFirst()

    if (existing) {
      return await db
        .updateTable('leave_balance')
        .set({
          total_days: data.totalDays,
          ...(data.usedDays !== undefined ? { used_days: data.usedDays } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          updated_at: new Date(),
        })
        .where('user_id', '=', userId)
        .where('year', '=', data.year)
        .returningAll()
        .executeTakeFirstOrThrow()
    }

    return await db
      .insertInto('leave_balance')
      .values({
        user_id: userId,
        year: data.year,
        total_days: data.totalDays,
        used_days: data.usedDays ?? 0,
        notes: data.notes ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  /**
   * Atomic increment helper used by permit approval flow. Negative delta
   * (e.g. when an approved permit is later rejected) decrements; we clamp at
   * zero so admin tweaks can't push the counter negative.
   */
  async adjustUsed(userId: string, year: number, deltaDays: number) {
    const row = await this.getOrCreate(userId, year)
    const current = Number(row.used_days)
    const next = Math.max(0, current + deltaDays)

    return await db
      .updateTable('leave_balance')
      .set({ used_days: next, updated_at: new Date() })
      .where('user_id', '=', userId)
      .where('year', '=', year)
      .returningAll()
      .executeTakeFirstOrThrow()
  }
}
