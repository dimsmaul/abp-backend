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
}
