import { DashboardRepository } from './dashboard.repository'

export class DashboardModule {
  private repository = new DashboardRepository()

  async fetchSummary() {
    const stats = await this.repository.getStats()
    
    return {
      data: {
        todayPresent: stats.todayPresent,
        todayAbsent: stats.totalEmployees - stats.todayPresent,
        pendingReports: stats.pendingReports,
        totalEmployees: stats.totalEmployees,
      },
      status: 200
    }
  }

  async fetchMapPoints(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date()
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const points = await this.repository.findPointsByDate(startOfDay, endOfDay)
    
    return { data: { points }, status: 200 }
  }
}
