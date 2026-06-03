import { LeaveBalanceRepository } from './leave_balance.repository'
import { updateLeaveBalanceSchema } from './leave_balance.schema'

export class LeaveBalanceModule {
  private repository = new LeaveBalanceRepository()

  async fetchMine(userId: string) {
    const year = new Date().getFullYear()
    const row = await this.repository.getOrCreate(userId, year)
    const totalDays = Number(row.total_days)
    const usedDays = Number(row.used_days)
    return {
      data: {
        year: row.year,
        totalDays,
        usedDays,
        remainingDays: totalDays - usedDays,
      },
      status: 200,
    }
  }

  async fetchAll(query: any) {
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 20)
    const year = Number(query.year || new Date().getFullYear())

    const result = await this.repository.findAll({ page, limit, year })
    return { data: result, status: 200 }
  }

  async processUpdate(userId: string, body: any) {
    const validated = updateLeaveBalanceSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const data = await this.repository.upsert(userId, validated.data)
    return { data, status: 200 }
  }
}
